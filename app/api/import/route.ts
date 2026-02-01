import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

export async function GET(request: NextRequest) {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();

    return NextResponse.json({
        authenticated,
    });
}

export async function POST(request: NextRequest) {
    // Verify user is authenticated
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        return NextResponse.json(
            { error: "Unauthorized. Please sign in to import bookmarks." },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { bookmarks } = body;

        if (!Array.isArray(bookmarks)) {
            return NextResponse.json(
                { error: "Invalid data format. Expected an array of bookmarks." },
                { status: 400 }
            );
        }

        if (bookmarks.length === 0) {
            return NextResponse.json(
                { error: "No bookmarks to import." },
                { status: 400 }
            );
        }

        // Validate bookmark structure
        for (const bookmark of bookmarks) {
            if (!bookmark.title || !bookmark.url) {
                return NextResponse.json(
                    { error: "Each bookmark must have a title and url." },
                    { status: 400 }
                );
            }
        }

        // Import bookmarks to Convex via batch mutation
        const bookmarkIds = await fetchAuthMutation(api.bookmarks.batchCreateBookmarks, {
            bookmarks: bookmarks.map((b: any) => ({
                title: b.title,
                url: b.url,
                folderId: b.folderId,
                favicon: b.favicon,
                ogImage: b.ogImage,
            })),
        });

        return NextResponse.json({
            success: true,
            count: bookmarkIds.length,
            bookmarkIds,
        });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: "Failed to import bookmarks." },
            { status: 500 }
        );
    }
}
