import type { Id } from "@/convex/_generated/dataModel";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
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
        typeof (obj as FolderInput).id === "string" &&
        "name" in obj &&
        typeof (obj as FolderInput).name === "string"
    );
}

function parseFolders(raw: unknown): FolderInput[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter(isFolderLike).map((f) => ({
        id: f.id,
        name: f.name,
        parentId: f.parentId ?? null,
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
        out.push(b as BookmarkInput);
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

    function add(folder: FolderInput) {
        if (added.has(folder.id)) return;
        if (folder.parentId != null && !added.has(folder.parentId)) {
            const parent = byId.get(folder.parentId);
            if (parent) add(parent);
        }
        sorted.push(folder);
        added.add(folder.id);
    }

    for (const folder of folders) add(folder);
    return sorted;
}

async function createFolderMap(
    folders: FolderInput[]
): Promise<Map<string, Id<"folders">>> {
    const map = new Map<string, Id<"folders">>();
    if (folders.length === 0) return map;

    const sorted = sortFoldersTopologically(folders);
    for (const folder of sorted) {
        const appParentId = folder.parentId
            ? map.get(folder.parentId)
            : undefined;
        const appFolderId = await fetchAuthMutation(api.bookmarks.createFolder, {
            name: folder.name,
            parentId: appParentId,
        });
        map.set(folder.id, appFolderId);
    }
    return map;
}

// --- Handlers ---

export async function GET(request: NextRequest) {
    const authenticated = await isAuthenticated();
    return NextResponse.json({ authenticated });
}

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return res.unauthorized();
    }

    try {
        const body = (await request.json()) as ImportRequestBody;
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
        const chromeFolderIdToAppId = await createFolderMap(folders);

        const bookmarkIds = await fetchAuthMutation(
            api.bookmarks.batchCreateBookmarks,
            {
                bookmarks: bookmarks.map((b) => ({
                    title: b.title,
                    url: b.url,
                    folderId: b.folderId
                        ? chromeFolderIdToAppId.get(b.folderId)
                        : undefined,
                    favicon: b.favicon,
                    ogImage: b.ogImage,
                })),
            }
        );

        return NextResponse.json({
            success: true,
            count: bookmarkIds.length,
            bookmarkIds,
        });
    } catch (error) {
        console.error("Import error:", error);
        return res.serverError();
    }
}
