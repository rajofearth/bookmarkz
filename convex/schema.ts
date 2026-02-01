import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // precise profile settings that extend the base user
    profiles: defineTable({
        userId: v.string(), // Links to the auth user (Component ID)
        name: v.optional(v.string()), // Override or cache of name
        email: v.optional(v.string()), // Override or cache
        image: v.optional(v.string()), // Override
        bio: v.optional(v.string()),
        blurProfile: v.optional(v.boolean()),
    })
        .index("by_user_id", ["userId"]),

    bookmarks: defineTable({
        userId: v.string(), // Owner (Auth User ID)
        title: v.string(),
        url: v.string(),
        favicon: v.optional(v.string()),
        ogImage: v.optional(v.string()),
        folderId: v.optional(v.id("folders")),
        createdAt: v.number(),
        metadataStatus: v.optional(v.union(v.literal("pending"), v.literal("fetching"), v.literal("completed"), v.literal("failed"))),
    })
        .index("by_user_id", ["userId"])
        .index("by_folder_id", ["folderId"])
        .index("by_user_url", ["userId", "url"]),

    folders: defineTable({
        userId: v.string(), // Owner (Auth User ID)
        name: v.string(),
        parentId: v.optional(v.id("folders")),
        createdAt: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_parent_id", ["parentId"]),
});
