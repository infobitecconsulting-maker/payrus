import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { WALLET_TEMPLATES } from "./walletMeta";

/**
 * Deterministic hash so a user's starter financial data varies by identity
 * without needing external randomness — the same userId always produces the
 * same (but different-per-user) values, which is what makes seeded test
 * users reproducible while still being non-reusable across users.
 */
function hashToInt(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const CARD_TEMPLATES = {
  individual: { tier: "Prime", brand: "Visa", network: "Visa Infinite", gradient: "from-[#0d1b4b] via-[#1a3a6b] to-[#0e5c7e]", shimmer: "from-white/0 via-white/10 to-white/0", accentColor: "#4fc3f7" },
  organisation: { tier: "Business", brand: "Visa", network: "Visa Business", gradient: "from-[#064e3b] via-[#065f46] to-[#047857]", shimmer: "from-white/0 via-green-200/10 to-white/0", accentColor: "#6ee7b7" },
} as const;

/**
 * Gives a user their first wallets/cards the first time they activate any
 * role — called from `userRoles.upsertRole` for real users and from
 * `testUsers.seed` for fixtures, so both paths create data through the same
 * entity relationship instead of a special-cased seed script. No-ops if the
 * user already has wallets (never overwrites real activity).
 */
export async function provisionStarterFinancials(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: "individual" | "organisation",
) {
  const existing = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) return;

  const user = await ctx.db.get(userId);
  const holder = (user?.name ?? "CARD HOLDER").toUpperCase();

  const seed = hashToInt(userId);

  for (let i = 0; i < 3; i++) {
    const template = WALLET_TEMPLATES[(seed + i) % WALLET_TEMPLATES.length];
    const balance = 5000 + ((seed >>> (i * 4)) % 95000);
    await ctx.db.insert("wallets", { userId, ...template, balance });
  }

  const cardTemplate = CARD_TEMPLATES[kind];
  const last4 = String(1000 + (seed % 9000));
  await ctx.db.insert("cards", {
    userId,
    tier: cardTemplate.tier,
    brand: cardTemplate.brand,
    last4,
    holder,
    expiry: "12/29",
    balance: 500 + (seed % 15000),
    currency: "USD",
    type: kind === "organisation" ? "Corporate" : "Virtual",
    network: cardTemplate.network,
    contactless: true,
    gradient: cardTemplate.gradient,
    shimmer: cardTemplate.shimmer,
    accentColor: cardTemplate.accentColor,
    locked: false,
    monthlySpend: seed % 2000,
    monthlyLimit: 5000,
  });
}
