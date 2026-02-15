import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent, getOptionalAuthUser } from "./auth";

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
    const user = await getOptionalAuthUser(ctx);
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

    // Guard against self-referencing cycle
    if (args.parentId === args.folderId) {
      throw new Error("A folder cannot be its own parent");
    }

    // Only patch fields that were actually provided
    const { folderId, ...rest } = args;
    const patch = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    ) as Record<string, unknown>;

    await ctx.db.patch(folderId, patch);
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

    // Cascading delete: remove child bookmarks
    const childBookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("folderId"), args.folderId))
      .collect();
    for (const bm of childBookmarks) {
      await ctx.db.delete(bm._id);
    }

    // Cascading delete: remove child folders recursively
    const childFolders = await ctx.db
      .query("folders")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("parentId"), args.folderId))
      .collect();
    for (const cf of childFolders) {
      // Reparent children to the deleted folder's parent instead of recursive delete
      await ctx.db.patch(cf._id, { parentId: folder.parentId });
    }

    await ctx.db.delete(args.folderId);
  },
});

// --- Bookmarks ---

export const createBookmark = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    addDate: v.optional(v.number()),
    folderId: v.optional(v.id("folders")),
    favicon: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check for duplicate
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_url", (q) =>
        q.eq("userId", user._id).eq("url", args.url),
      )
      .first();

    if (existing) {
      // Return existing ID if duplicate found (idempotent behavior)
      // or throw error? For import logic, idempotent is better.
      return existing._id;
    }

    const bookmarkId = await ctx.db.insert("bookmarks", {
      userId: user._id,
      title: args.title,
      url: args.url,
      folderId: args.folderId,
      favicon: args.favicon,
      ogImage: args.ogImage,
      description: args.description,
      createdAt: args.addDate ?? Date.now(),
      metadataStatus: args.favicon && args.ogImage ? "completed" : "pending",
    });
    return bookmarkId;
  },
});

export const batchCreateBookmarks = mutation({
  args: {
    bookmarks: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        addDate: v.optional(v.number()),
        folderId: v.optional(v.id("folders")),
        favicon: v.optional(v.string()),
        ogImage: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const createdIds: Id<"bookmarks">[] = [];
    let movedCount = 0;
    for (const bookmark of args.bookmarks) {
      // Check for duplicate
      const existing = await ctx.db
        .query("bookmarks")
        .withIndex("by_user_url", (q) =>
          q.eq("userId", user._id).eq("url", bookmark.url),
        )
        .first();

      if (existing) {
        if (bookmark.folderId) {
          if (existing.folderId !== bookmark.folderId) {
            await ctx.db.patch(existing._id, {
              folderId: bookmark.folderId,
            });
            movedCount += 1;
          }
        }
        createdIds.push(existing._id);
        continue;
      }

      const bookmarkId = await ctx.db.insert("bookmarks", {
        userId: user._id,
        title: bookmark.title,
        url: bookmark.url,
        folderId: bookmark.folderId,
        favicon: bookmark.favicon,
        ogImage: bookmark.ogImage,
        description: bookmark.description,
        createdAt: bookmark.addDate ?? Date.now(),
        metadataStatus:
          bookmark.favicon && bookmark.ogImage ? "completed" : "pending",
      });
      createdIds.push(bookmarkId);
    }
    return { createdIds, movedCount };
  },
});

export const getBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx);
    if (!user) {
      return [];
    }
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    return bookmarks.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateBookmarkMetadata = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    favicon: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    title: v.optional(v.string()),
    metadataStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("fetching"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
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

    const hasNewData =
      args.favicon !== undefined ||
      args.ogImage !== undefined ||
      args.title !== undefined;
    const resolvedStatus =
      args.metadataStatus ??
      (hasNewData ? "completed" : bookmark.metadataStatus);
    await ctx.db.patch(args.bookmarkId, {
      favicon: args.favicon ?? bookmark.favicon,
      ogImage: args.ogImage ?? bookmark.ogImage,
      title: args.title ?? bookmark.title,
      metadataStatus: resolvedStatus,
    });
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
    description: v.optional(v.string()),
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

    // Only patch fields that were actually provided so we don't
    // accidentally clear required fields like `title` and `url`.
    const { bookmarkId, ...rest } = args;
    const patch = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    ) as Record<string, unknown>;

    await ctx.db.patch(bookmarkId, patch);
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

export const deleteAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const [bookmarks, folders] = await Promise.all([
      ctx.db
        .query("bookmarks")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("folders")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect(),
    ]);

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }
    for (const folder of folders) {
      await ctx.db.delete(folder._id);
    }

    return {
      bookmarksDeleted: bookmarks.length,
      foldersDeleted: folders.length,
    };
  },
});

// --- User Stats ---

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx);
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
