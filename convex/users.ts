import { v } from "convex/values";
import { query } from "./_generated/server";

// Real per-user identity lookup by userId — used by
// src/hooks/use-current-app-user.ts for the database-only (local/registered)
// identity path. Convex functions are called unauthenticated under Supabase
// Auth (no JWT reaches Convex), so this is the only identity lookup this
// module needs — there is no ctx.auth-based counterpart anymore.
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => await ctx.db.get(userId),
});
