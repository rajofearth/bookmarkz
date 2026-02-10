import type { Id } from "@/convex/_generated/dataModel";
import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

// --- Types ---

interface FolderInput {
    id: string;
    name: string;
    parentId?: string | null;
}

interface BookmarkInput {
    title: string;
    url: string;
    folderId?: string;
    favicon?: string;
    ogImage?: string;
}

interface ImportRequestBody {
    bookmarks: unknown;
    folders?: unknown;
}

// --- Response helpers ---

const res = {
    unauthorized: () =>
        NextResponse.json(
            { error: "Unauthorized. Please sign in to import bookmarks." },
            { status: 401 }
        ),
    badRequest: (error: string) =>
        NextResponse.json({ error }, { status: 400 }),
    serverError: () =>
        NextResponse.json(
            { error: "Failed to import bookmarks." },
            { status: 500 }
        ),
};

// --- Validation ---

function isFolderLike(obj: unknown): obj is FolderInput {
    return (
        obj !== null &&
        typeof obj === "object" &&
        "id" in obj &&
        (typeof (obj as FolderInput).id === "string" ||
            typeof (obj as FolderInput).id === "number") &&
        "name" in obj &&
        typeof (obj as FolderInput).name === "string"
    );
}

function parseFolders(raw: unknown): FolderInput[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter(isFolderLike).map((f) => ({
        id: String(f.id),
        name: f.name,
        parentId:
            f.parentId === undefined || f.parentId === null
                ? null
                : String(f.parentId),
    }));
}

/** Returns validated bookmarks or null if any item is invalid. */
function parseBookmarks(raw: unknown): BookmarkInput[] | null {
    if (!Array.isArray(raw)) return null;
    const out: BookmarkInput[] = [];
    for (const b of raw) {
        if (
            !b ||
            typeof b !== "object" ||
            typeof (b as BookmarkInput).title !== "string" ||
            typeof (b as BookmarkInput).url !== "string"
        ) {
            return null;
        }
        const folderIdRaw = (b as BookmarkInput).folderId;
        const folderId =
            typeof folderIdRaw === "string" || typeof folderIdRaw === "number"
                ? String(folderIdRaw)
                : undefined;
        out.push({
            title: (b as BookmarkInput).title,
            url: (b as BookmarkInput).url,
            folderId,
            favicon:
                typeof (b as BookmarkInput).favicon === "string"
                    ? (b as BookmarkInput).favicon
                    : undefined,
            ogImage:
                typeof (b as BookmarkInput).ogImage === "string"
                    ? (b as BookmarkInput).ogImage
                    : undefined,
        });
    }
    return out;
}

// --- Folder order: parents before children ---

function sortFoldersTopologically(
    folders: FolderInput[]
): FolderInput[] {
    const byId = new Map(folders.map((f) => [f.id, f]));
    const sorted: FolderInput[] = [];
    const added = new Set<string>();
    const visiting = new Set<string>();

    function add(folder: FolderInput) {
        if (added.has(folder.id)) return;
        if (visiting.has(folder.id)) return; // cycle detected — break it
        visiting.add(folder.id);
        if (folder.parentId != null && !added.has(folder.parentId)) {
            const parent = byId.get(folder.parentId);
            if (parent) add(parent);
        }
        visiting.delete(folder.id);
        sorted.push(folder);
        added.add(folder.id);
    }

    for (const folder of folders) add(folder);
    return sorted;
}

function folderKey(
    parentId: Id<"folders"> | undefined | null,
    name: string
): string {
    return `${parentId ?? "root"}::${name}`;
}

async function buildExistingFolderLookup(): Promise<Map<string, Id<"folders">>> {
    const existingFolders = await fetchAuthQuery(api.bookmarks.getFolders);
    const lookup = new Map<string, Id<"folders">>();
    for (const folder of existingFolders) {
        const key = folderKey(folder.parentId, folder.name);
        if (!lookup.has(key)) {
            lookup.set(key, folder._id);
        }
    }
    return lookup;
}

async function createFolderMap(
    folders: FolderInput[],
    existingFolderLookup: Map<string, Id<"folders">>
): Promise<Map<string, Id<"folders">>> {
    const map = new Map<string, Id<"folders">>();
    if (folders.length === 0) return map;

    const sorted = sortFoldersTopologically(folders);
    for (const folder of sorted) {
        const appParentId = folder.parentId
            ? map.get(folder.parentId)
            : undefined;
        const key = folderKey(appParentId, folder.name);
        const existingId = existingFolderLookup.get(key);
        if (existingId) {
            map.set(folder.id, existingId);
            continue;
        }

        const appFolderId = await fetchAuthMutation(api.bookmarks.createFolder, {
            name: folder.name,
            parentId: appParentId,
        });
        map.set(folder.id, appFolderId);
        existingFolderLookup.set(key, appFolderId);
    }
    return map;
}

// --- Handlers ---

export async function GET(request: NextRequest) {
    const authenticated = await isAuthenticated();
    return NextResponse.json({ authenticated });
}

export async function POST(request: NextRequest) {
    try {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
            return res.unauthorized();
        }

        let body: ImportRequestBody;
        try {
            body = await request.json() as ImportRequestBody;
        } catch {
            return res.badRequest("Invalid JSON in request body.");
        }

        const raw = body.bookmarks;

        if (!Array.isArray(raw)) {
            return res.badRequest(
                "Invalid data format. Expected an array of bookmarks."
            );
        }
        if (raw.length === 0) {
            return res.badRequest("No bookmarks to import.");
        }

        const bookmarks = parseBookmarks(raw);
        if (bookmarks === null) {
            return res.badRequest("Each bookmark must have a title and url.");
        }

        const folders = parseFolders(body.folders);
        const existingFolderLookup = folders.length > 0
            ? await buildExistingFolderLookup()
            : new Map<string, Id<"folders">>();
        const chromeFolderIdToAppId = await createFolderMap(
            folders,
            existingFolderLookup
        );

        // Validate that every bookmark folderId can be mapped
        for (const b of bookmarks) {
            if (b.folderId && !chromeFolderIdToAppId.has(b.folderId)) {
                return res.badRequest(
                    `Unknown folder reference for bookmark "${b.title}".`
                );
            }
        }

        // Chunk bookmarks into batches of 50 to stay under Convex's 16 MiB mutation-argument limit
        const BATCH_SIZE = 50;
        const mappedBookmarks = bookmarks.map((b) => ({
            title: b.title,
            url: b.url,
            folderId: b.folderId
                ? chromeFolderIdToAppId.get(b.folderId)
                : undefined,
            favicon: b.favicon,
            ogImage: b.ogImage,
        }));

        const createdIds: Id<"bookmarks">[] = [];
        let movedCount = 0;

        for (let i = 0; i < mappedBookmarks.length; i += BATCH_SIZE) {
            const chunk = mappedBookmarks.slice(i, i + BATCH_SIZE);
            const importResult = await fetchAuthMutation(
                api.bookmarks.batchCreateBookmarks,
                { bookmarks: chunk }
            );
            const chunkIds = Array.isArray(importResult)
                ? importResult
                : (importResult?.createdIds ?? []);
            const chunkMoved = Array.isArray(importResult)
                ? 0
                : (importResult?.movedCount ?? 0);
            createdIds.push(...chunkIds);
            movedCount += chunkMoved;
        }

        console.log("Import result", {
            createdCount: createdIds.length,
            movedCount,
        });

        return NextResponse.json({
            success: true,
            count: createdIds.length,
            movedCount,
            bookmarkIds: createdIds,
        });
    } catch (error) {
        console.error("Import error:", error);
        return res.serverError();
    }
}
