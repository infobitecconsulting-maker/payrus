import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { ownerKey: v.string() },
  handler: async (ctx, { ownerKey }) => {
    return await ctx.db
      .query("linkedPaymentMethods")
      .withIndex("by_owner", (q) => q.eq("ownerKey", ownerKey))
      .collect();
  },
});

export const add = mutation({
  args: {
    ownerKey: v.string(),
    provider: v.union(
      v.literal("apple_pay"),
      v.literal("google_pay"),
      v.literal("card"),
      v.literal("bank"),
      v.literal("mobile_money"),
    ),
    label: v.string(),
  },
  handler: async (ctx, { ownerKey, provider, label }) => {
    return await ctx.db.insert("linkedPaymentMethods", {
      ownerKey,
      provider,
      label,
      status: "active" as const,
      createdAt: Date.now(),
    });
  },
});

const DEFAULT_METHODS = [
  { provider: "card" as const, label: "Rawbank Visa •• 4821", status: "primary" as const },
  { provider: "card" as const, label: "Ecobank MC •• 9302", status: "active" as const },
  { provider: "mobile_money" as const, label: "Orange Money +243", status: "active" as const },
];

/**
 * Gives a first-time visitor the same starter set of linked methods the
 * old per-page mock data used to show, so the demo doesn't start empty.
 * No-ops if this owner already has any records.
 */
export const seedDefaults = mutation({
  args: { ownerKey: v.string() },
  handler: async (ctx, { ownerKey }) => {
    const existing = await ctx.db
      .query("linkedPaymentMethods")
      .withIndex("by_owner", (q) => q.eq("ownerKey", ownerKey))
      .first();
    if (existing) return;
    for (const method of DEFAULT_METHODS) {
      await ctx.db.insert("linkedPaymentMethods", { ownerKey, ...method, createdAt: Date.now() });
    }
  },
});
