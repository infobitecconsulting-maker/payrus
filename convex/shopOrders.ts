import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { ownerKey: v.string() },
  handler: async (ctx, { ownerKey }) => {
    return await ctx.db
      .query("shopOrders")
      .withIndex("by_owner", (q) => q.eq("ownerKey", ownerKey))
      .collect();
  },
});

export const create = mutation({
  args: {
    ownerKey: v.string(),
    partnerSlug: v.string(),
    partnerName: v.string(),
    subtotal: v.number(),
    discountAmount: v.number(),
    payrusFee: v.number(),
    partnerCommission: v.number(),
    total: v.number(),
    method: v.string(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shopOrders", { ...args, createdAt: Date.now() });
  },
});
