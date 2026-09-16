import { ConvexError, v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { commissionFor, convertWithMargin, RATES_PER_USD, depositFeeFor } from "./fx";
import { metadataForCurrency } from "./walletMeta";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Finds the user's wallet in `currency`, creating one on the fly (branded
// via metadataForCurrency) if they don't already hold it — this is what
// lets deposit/convert support "any currency, whenever needed" without a
// separate "add a currency" mutation or UI step.
async function findOrCreateWallet(ctx: MutationCtx, userId: Id<"users">, currency: string) {
  const wallets = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const existing = wallets.find((w) => w.currency === currency);
  if (existing) return existing;

  const meta = metadataForCurrency(currency);
  const walletId = await ctx.db.insert("wallets", { userId, currency, balance: 0, ...meta });
  return (await ctx.db.get(walletId))!;
}

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
    type: v.union(v.literal("transfer"), v.literal("payment"), v.literal("remittance")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, currency, type, note }) => {
    if (!Number.isFinite(amount) || amount <= 0) {
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

    const newBalance = round2(wallet.balance - debited);
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

/**
 * Real "add money" — credits a wallet in `currency` (creating it if the
 * user doesn't hold that currency yet), net of a method-based deposit fee.
 * This is the only place a wallet balance ever increases.
 */
export const deposit = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    method: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, currency, method, note }) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ConvexError({ code: "INVALID_AMOUNT", message: "Amount must be positive" });
    }
    if (!(currency in RATES_PER_USD)) {
      throw new ConvexError({ code: "UNSUPPORTED_CURRENCY", message: `Unsupported currency: ${currency}` });
    }

    const wallet = await findOrCreateWallet(ctx, userId, currency);
    const fee = depositFeeFor(method, amount);
    const credited = round2(amount - fee);
    const newBalance = round2(wallet.balance + credited);
    await ctx.db.patch(wallet._id, { balance: newBalance });

    const reference = `TOP-${Date.now().toString().slice(-10)}`;
    await ctx.db.insert("transactions", {
      userId, walletId: wallet._id, type: "deposit", amount, currency,
      walletCurrency: wallet.currency, debited: 0, credited, commission: fee, fxMargin: 0,
      reference, note: note ?? method, createdAt: Date.now(),
    });

    return { walletId: wallet._id, walletCurrency: wallet.currency, newBalance, credited, fee, reference };
  },
});

/**
 * Converts between two of the SAME user's own wallets — debits the source
 * (must already exist), credits the destination (created if new), at the
 * real 10% FX margin from convertWithMargin. No commission: this is an FX
 * exchange between your own money, not a paid transfer service.
 */
export const convert = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    fromCurrency: v.string(),
    toCurrency: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, fromCurrency, toCurrency, note }) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ConvexError({ code: "INVALID_AMOUNT", message: "Amount must be positive" });
    }
    if (fromCurrency === toCurrency) {
      throw new ConvexError({ code: "SAME_CURRENCY", message: "Pick two different currencies" });
    }
    if (!(fromCurrency in RATES_PER_USD) || !(toCurrency in RATES_PER_USD)) {
      throw new ConvexError({ code: "UNSUPPORTED_CURRENCY", message: "Unsupported currency" });
    }

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const fromWallet = wallets.find((w) => w.currency === fromCurrency);
    if (!fromWallet) {
      throw new ConvexError({ code: "NO_SOURCE_WALLET", message: `You don't have a ${fromCurrency} wallet yet` });
    }
    if (amount > fromWallet.balance) {
      throw new ConvexError({ code: "INSUFFICIENT_FUNDS", message: "Insufficient wallet balance" });
    }

    const toWallet = await findOrCreateWallet(ctx, userId, toCurrency);
    const { converted, fxMargin } = convertWithMargin(amount, fromCurrency, toCurrency);

    const newFromBalance = round2(fromWallet.balance - amount);
    const newToBalance = round2(toWallet.balance + converted);
    await ctx.db.patch(fromWallet._id, { balance: newFromBalance });
    await ctx.db.patch(toWallet._id, { balance: newToBalance });

    const reference = `CNV-${Date.now().toString().slice(-10)}`;
    const now = Date.now();
    await ctx.db.insert("transactions", {
      userId, walletId: fromWallet._id, type: "convert_out", amount, currency: fromCurrency,
      walletCurrency: fromWallet.currency, debited: amount, commission: 0, fxMargin: 0,
      reference, note, createdAt: now,
    });
    await ctx.db.insert("transactions", {
      userId, walletId: toWallet._id, type: "convert_in", amount, currency: fromCurrency,
      walletCurrency: toWallet.currency, debited: 0, credited: round2(converted), commission: 0, fxMargin,
      reference, note, createdAt: now + 1,
    });

    return {
      fromWalletId: fromWallet._id, toWalletId: toWallet._id,
      fromNewBalance: newFromBalance, toNewBalance: newToBalance,
      converted: round2(converted), fxMargin, reference,
    };
  },
});
