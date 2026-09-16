import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("marketplacePartners").collect();
  },
});

// Mirrors the partner list in src/pages/shop/page.tsx — keep the two in sync
// if that list changes (id there = slug here).
const SEED_PARTNERS = [
  {
    slug: "jumia", name: "Jumia", category: "general", emoji: "🛒", promoted: true, discountPercent: 5, rating: 4.5,
    items: [{ name: "Wireless Earbuds", price: 39.99 }, { name: "Phone Case", price: 12.5 }, { name: "Power Bank 10,000mAh", price: 24.0 }],
  },
  {
    slug: "amazon", name: "Amazon", category: "general", emoji: "📦", promoted: true, discountPercent: 3, rating: 4.7,
    items: [{ name: "Kitchen Blender", price: 45.0 }, { name: "LED Desk Lamp", price: 18.75 }],
  },
  {
    slug: "alibaba", name: "Alibaba", category: "wholesale", emoji: "🏭", promoted: true, discountPercent: 10, rating: 4.4,
    items: [{ name: "Bulk USB-C Cables (x50)", price: 42.0 }, { name: "Wholesale Phone Cases (x100)", price: 65.0 }],
  },
  {
    slug: "aliexpress", name: "AliExpress", category: "electronics", emoji: "📱", promoted: false, discountPercent: 6, rating: 4.3,
    items: [{ name: "Bluetooth Speaker", price: 29.99 }, { name: "USB-C Cable (2m)", price: 6.5 }],
  },
  {
    slug: "temu", name: "Temu", category: "general", emoji: "🛍️", promoted: true, discountPercent: 12, rating: 4.2,
    items: [{ name: "LED Desk Lamp", price: 14.0 }, { name: "Kitchen Gadget Set", price: 19.5 }],
  },
  {
    slug: "shein", name: "SHEIN", category: "fashion", emoji: "👗", promoted: false, discountPercent: 8, rating: 4.3,
    items: [{ name: "Print Dress", price: 24.0 }, { name: "Sandals", price: 16.0 }],
  },
  {
    slug: "kilimall", name: "Kilimall", category: "electronics", emoji: "💻", promoted: false, rating: 4.2,
    items: [{ name: "Bluetooth Earphones", price: 18.0 }, { name: "Phone Screen Protector", price: 3.5 }],
  },
  {
    slug: "yema", name: "Yema Cameroon", category: "local", emoji: "🏡", promoted: false, rating: 4.4,
    items: [{ name: "Home Appliance Bundle", price: 55.0 }, { name: "Desk Fan", price: 21.0 }],
  },
];

/**
 * Idempotently upserts the fixed partner catalog by slug. Run once after
 * deploy via `npx convex run marketplacePartners:seed` — not called from
 * the UI.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    for (const partner of SEED_PARTNERS) {
      const existing = await ctx.db
        .query("marketplacePartners")
        .withIndex("by_slug", (q) => q.eq("slug", partner.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, partner);
      } else {
        await ctx.db.insert("marketplacePartners", partner);
      }
    }
  },
});
