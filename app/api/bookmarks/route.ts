import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const STORAGE_PATH = path.join(process.cwd(), 'data', 'storage.json');

// Helper to ensure storage file exists
async function ensureStorage() {
    try {
        await fs.access(STORAGE_PATH);
    } catch {
        await fs.writeFile(STORAGE_PATH, JSON.stringify({ bookmarks: [] }, null, 2));
    }
}

export async function GET() {
    await ensureStorage();
    try {
        const data = await fs.readFile(STORAGE_PATH, 'utf-8');
        const json = JSON.parse(data);
        return NextResponse.json(json.bookmarks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read bookmarks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await ensureStorage();
    try {
        const body = await request.json();
        const { bookmarks } = body;

        if (!Array.isArray(bookmarks)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Read existing data to potentially merge, or just overwrite. 
        // valid strategy for "export from browser" is usually "add missing" or "rewrite all".
        // For simplicity, let's append new ones or overwrite? 
        // The user said "export... into our website". 
        // Let's assume we want to flatten and save them. 
        // For this implementation, we will act as a "sync" or "append".
        // But to avoid complexity with duplicates for this MVP, let's just Read-Modify-Write.

        // Actually, simply overwriting the 'imported' folder or distinct list might be safer for a demo,
        // but usually merging is preferred.
        // Let's just save what we get as "all bookmarks" or append to existing?
        // Let's just Read, Append unique, Write.

        const data = await fs.readFile(STORAGE_PATH, 'utf-8');
        const json = JSON.parse(data);

        // Simple merge: add if id doesn't exist.
        // NOTE: Browser bookmarks might not have compatible IDs with our mocks.
        // We'll trust the extensions generated IDs or generate new ones? 
        // Let's assume the extension sends compatible Bookmark objects.

        const existingIds = new Set(json.bookmarks.map((b: any) => b.id));
        const newBookmarks = bookmarks.filter((b: any) => !existingIds.has(b.id)); // Avoid exact ID duplicates

        const updatedBookmarks = [...json.bookmarks, ...newBookmarks];

        await fs.writeFile(STORAGE_PATH, JSON.stringify({ bookmarks: updatedBookmarks }, null, 2));

        return NextResponse.json({ success: true, count: updatedBookmarks.length });
    } catch (error) {
        console.error('Save error:', error);
        return NextResponse.json({ error: 'Failed to save bookmarks' }, { status: 500 });
    }
}
