import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent, getOptionalAuthUser } from "./auth";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    let imageUrl = user.image;
    if (profile?.image) {
      // Check if it's a storage ID (simple heuristic or assume it uses storage if not http)
      // Or just try to get URL. If it's invalid ID it returns null.
      if (!profile.image.startsWith("http")) {
        const url = await ctx.storage.getUrl(profile.image);
        if (url) {
          imageUrl = url;
        }
      } else {
        imageUrl = profile.image;
      }
    }

    // Return combined data, preferring profile data over auth data where applicable
    // or just return the profile + auth info.
    return {
      ...user,
      ...profile,
      // Ensure we return the correct name/image if profile has them, else fallback to user
      name: profile?.name ?? user.name,
      image: imageUrl, // Resolved URL
      email: user.email, // Email usually comes from auth, but if we allow profile email overrides... usually not.
      _id: profile?._id, // This is the PROFILE ID, not User ID.
      userId: user._id,
      bio: profile?.bio ?? "",
      blurProfile: profile?.blurProfile ?? false,
    };
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    image: v.optional(v.string()), // This can be a Storage ID now
    blurProfile: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        ...args,
      });
    } else {
      await ctx.db.insert("profiles", {
        userId: user._id,
        ...args,
      });
    }
  },
});
