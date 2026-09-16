import { v } from "convex/values";
import { query } from "./_generated/server";

// Most-recent-first history for one wallet — what the dashboard's wallet
// detail panel shows when a wallet card is selected.
export const listForWallet = query({
  args: { walletId: v.id("wallets") },
  handler: async (ctx, { walletId }) => {
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", walletId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Most-recent-first history across ALL of a user's wallets — what
// Index.tsx's "Recent Activity" and wallet/page.tsx's "Recent top-ups"
// show, instead of a hardcoded list.
export const listRecentForUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit ?? 10);
  },
});
