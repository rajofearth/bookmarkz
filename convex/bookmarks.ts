import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// --- Folders ---

export const createFolder = mutation({
    args: {
        name: v.string(),
        parentId: v.optional(v.id("folders")),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }
        const folderId = await ctx.db.insert("folders", {
            userId: user._id,
            name: args.name,
            parentId: args.parentId,
            createdAt: Date.now(),
        });
        return folderId;
    },
});

export const getFolders = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }
        return await ctx.db
            .query("folders")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();
    },
});

export const updateFolder = mutation({
    args: {
        folderId: v.id("folders"),
        name: v.optional(v.string()),
        parentId: v.optional(v.id("folders")),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Validate ownership
        const folder = await ctx.db.get(args.folderId);
        if (!folder || folder.userId !== user._id) {
            throw new Error("Folder not found or unauthorized");
        }

        await ctx.db.patch(args.folderId, {
            name: args.name,
            parentId: args.parentId,
        });
    },
});

export const deleteFolder = mutation({
    args: {
        folderId: v.id("folders"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Validate ownership
        const folder = await ctx.db.get(args.folderId);
        if (!folder || folder.userId !== user._id) {
            throw new Error("Folder not found or unauthorized");
        }

        // TODO: cascading delete of bookmarks?
        // For now, let's just delete the folder. Bookmarks might get orphaned or we should check.
        // Better to orphan or prevent delete if not empty?
        // Let's recursively delete for now or just delete the folder node.
        // Simple delete:
        await ctx.db.delete(args.folderId);
    },
});


// --- Bookmarks ---

export const createBookmark = mutation({
    args: {
        title: v.string(),
        url: v.string(),
        folderId: v.optional(v.id("folders")),
        favicon: v.optional(v.string()),
        ogImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const bookmarkId = await ctx.db.insert("bookmarks", {
            userId: user._id,
            title: args.title,
            url: args.url,
            folderId: args.folderId,
            favicon: args.favicon,
            ogImage: args.ogImage,
            createdAt: Date.now(),
        });
        return bookmarkId;
    },
});

export const getBookmarks = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return [];
        }
        return await ctx.db
            .query("bookmarks")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();
    },
});

export const updateBookmark = mutation({
    args: {
        bookmarkId: v.id("bookmarks"),
        title: v.optional(v.string()),
        url: v.optional(v.string()),
        folderId: v.optional(v.id("folders")),
        favicon: v.optional(v.string()),
        ogImage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const bookmark = await ctx.db.get(args.bookmarkId);
        if (!bookmark || bookmark.userId !== user._id) {
            throw new Error("Bookmark not found or unauthorized");
        }

        await ctx.db.patch(args.bookmarkId, {
            title: args.title,
            url: args.url,
            folderId: args.folderId,
            favicon: args.favicon,
            ogImage: args.ogImage,
        });
    },
});

export const deleteBookmark = mutation({
    args: {
        bookmarkId: v.id("bookmarks"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const bookmark = await ctx.db.get(args.bookmarkId);
        if (!bookmark || bookmark.userId !== user._id) {
            throw new Error("Bookmark not found or unauthorized");
        }

        await ctx.db.delete(args.bookmarkId);
    },
});

// --- User Stats ---

export const getUserStats = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) {
            return {
                bookmarks: 0,
                folders: 0,
            };
        }

        const bookmarks = await ctx.db
            .query("bookmarks")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();

        const folders = await ctx.db
            .query("folders")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();

        return {
            bookmarks: bookmarks.length,
            folders: folders.length,
        };
    },
});
