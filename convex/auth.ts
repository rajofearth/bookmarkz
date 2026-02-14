import { createClient, type AuthFunctions,type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent: ReturnType<typeof createClient<DataModel>> = createClient<DataModel>(components.betterAuth, {
  authFunctions: (internal as { auth: AuthFunctions }).auth,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        await ctx.db.insert("profiles", {
          userId: doc._id,
          name: doc.name ?? undefined,
          email: doc.email ?? undefined,
          image: doc.image ?? undefined,
        });
      },
      onDelete: async (ctx, doc) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user_id", (q) => q.eq("userId", doc._id))
          .unique();
        if (profile) {
          await ctx.db.delete(profile._id);
        }
      },
    },
  },
});
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: false,
      requireEmailVerification: false,
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
  });
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});

// Helper that treats unauthenticated requests as "no user" for read-only queries.
export async function getOptionalAuthUser(ctx: GenericCtx<DataModel>) {
  try {
    const user = await authComponent.getAuthUser(ctx);
    return user ?? null;
  } catch (_error) {
    // For read-only queries we don't want unauthenticated access to throw;
    // callers should interpret `null` as "no authenticated user".
    return null;
  }
}
