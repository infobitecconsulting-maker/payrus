import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { commissionFor, convertWithMargin } from "./fx";

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Executes a real transfer or payment against a user's own wallet — the
 * balance shown on the dashboard actually changes, instead of the UI just
 * animating to a "success" screen. A 10% FX margin applies automatically
 * whenever the transaction currency differs from the wallet's own currency;
 * a flat 3.5% commission is charged on every transaction regardless of
 * currency, paid by the sender.
 */
export const applyTransaction = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    type: v.union(v.literal("transfer"), v.literal("payment")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, currency, type, note }) => {
    if (amount <= 0) {
      throw new ConvexError({ code: "INVALID_AMOUNT", message: "Amount must be positive" });
    }

    const walletsForUser = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (walletsForUser.length === 0) {
      throw new ConvexError({ code: "NO_WALLET", message: "This user has no wallet yet" });
    }
    const wallet = walletsForUser.find((w) => w.currency === currency) ?? walletsForUser[0];

    const commission = commissionFor(amount);
    const { converted: debited, fxMargin } = convertWithMargin(amount + commission, currency, wallet.currency);

    if (debited > wallet.balance) {
      throw new ConvexError({ code: "INSUFFICIENT_FUNDS", message: "Insufficient wallet balance" });
    }

    const newBalance = wallet.balance - debited;
    await ctx.db.patch(wallet._id, { balance: newBalance });

    const reference = `TXN-${Date.now().toString().slice(-10)}`;
    await ctx.db.insert("transactions", {
      userId, walletId: wallet._id, type, amount, currency,
      walletCurrency: wallet.currency, debited, commission, fxMargin,
      reference, note, createdAt: Date.now(),
    });

    return { walletId: wallet._id, walletCurrency: wallet.currency, newBalance, commission, fxMargin, debited, reference };
  },
});
