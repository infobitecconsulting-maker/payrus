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
