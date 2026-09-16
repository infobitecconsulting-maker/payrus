import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    profileType: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    idType: v.optional(v.string()),
    kycStatus: v.optional(
      v.union(v.literal("unverified"), v.literal("submitted"), v.literal("verified")),
    ),
    kycSubmittedAt: v.optional(v.number()),
    // Collected on the registration screen (src/pages/register/page.tsx).
    // `username` is derived as `firstname.lastname`; `country` drives
    // `defaultCurrency` (convex/geo.ts) so new-transaction currency pickers
    // default to something relevant to the user instead of a fixed constant.
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    country: v.optional(v.string()),
    defaultCurrency: v.optional(v.string()),
    // Demo-grade password auth (convex/localAuth.ts) — salted SHA-256 via
    // the Web Crypto API available in Convex's runtime, not a
    // production-grade KDF (no bcrypt/argon2 available without a Node
    // action). Every account in this app goes through this, real and test.
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    // Marks synthetic fixtures created by testUsers.seed so they can be told
    // apart from real accounts and bulk-removed later via
    // testUsers.cleanup — never set for a real user.
    isTestData: v.optional(v.boolean()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  // Full postal address collected at registration — kept as its own table
  // (rather than more flat fields on `users`) so a user could hold more than
  // one address later without a schema change. One row per user for now.
  addresses: defineTable({
    userId: v.id("users"),
    street: v.string(),
    houseNumber: v.string(),
    city: v.string(),
    province: v.string(),
    country: v.string(),
    postalCode: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Short-lived codes for the signup and password-recovery flows
  // (convex/localAuth.ts). This demo has no real SMS/email dispatch, so the
  // code is returned directly to the client that requested it instead of
  // actually being sent — the UI labels this clearly as a demo limitation
  // rather than pretending a message went out.
  confirmationCodes: defineTable({
    userId: v.id("users"),
    code: v.string(),
    purpose: v.union(v.literal("signup"), v.literal("recovery")),
    channel: v.union(v.literal("sms"), v.literal("email")),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // A user can hold more than one role (e.g. personal + merchant). Each row
  // is one role's onboarding/KYC record, tracked separately from `users` so
  // completeness and verification status are per-role, not per-account.
  // `kind` drives the onboarding path: "organisation" roles collect a
  // registration document and legal-representative identity before KYC;
  // "individual" roles go straight to KYC.
  userRoles: defineTable({
    userId: v.id("users"),
    role: v.string(),
    kind: v.union(v.literal("individual"), v.literal("organisation")),
    status: v.union(
      v.literal("incomplete"),
      v.literal("pending_verification"),
      v.literal("verified"),
    ),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    idType: v.optional(v.string()),
    orgName: v.optional(v.string()),
    registrationDocId: v.optional(v.id("_storage")),
    legalRepName: v.optional(v.string()),
    legalRepIdType: v.optional(v.string()),
    legalRepIdNumber: v.optional(v.string()),
    legalRepPhone: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Linked external payment methods (Apple Pay, Google Pay, cards, bank
  // accounts, mobile money). Keyed by an anonymous per-browser ownerKey
  // (src/lib/anon-id.ts) rather than real auth identity, matching the rest
  // of the app's profile-simulation UX — anyone can try the feature without
  // signing in. Shared between the Cards and Settings pages.
  linkedPaymentMethods: defineTable({
    ownerKey: v.string(),
    provider: v.union(
      v.literal("apple_pay"),
      v.literal("google_pay"),
      v.literal("card"),
      v.literal("bank"),
      v.literal("mobile_money"),
    ),
    label: v.string(),
    status: v.union(v.literal("active"), v.literal("primary")),
    createdAt: v.number(),
  }).index("by_owner", ["ownerKey"]),

  // Shop Online's marketplace partner catalog — shared/global data, not
  // scoped to any one visitor.
  marketplacePartners: defineTable({
    slug: v.string(),
    name: v.string(),
    category: v.string(),
    emoji: v.string(),
    promoted: v.boolean(),
    discountPercent: v.optional(v.number()),
    rating: v.number(),
    items: v.array(v.object({ name: v.string(), price: v.number() })),
  }).index("by_slug", ["slug"]),

  // Completed Shop Online purchases, keyed the same anonymous way as
  // linkedPaymentMethods.
  shopOrders: defineTable({
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
    createdAt: v.number(),
  }).index("by_owner", ["ownerKey"]),

  // Real per-user financial data — one-to-one with a `users` row, never
  // shared across users. Provisioned automatically the first time a user
  // activates any role (see `provisionStarterFinancials` in
  // convex/financialData.ts), so both real users and seeded test users go
  // through the identical entity relationship instead of a special-cased
  // seed path.
  wallets: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    currency: v.string(),
    balance: v.number(),
    flag: v.string(),
    colorClass: v.string(),
  }).index("by_user", ["userId"]),

  // A ledger row per real transfer/payment that actually moved money out of
  // a wallet — created by wallets.applyTransaction alongside the balance
  // update, so the wallet balance and its history never drift apart.
  transactions: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    type: v.union(
      v.literal("transfer"),
      v.literal("payment"),
      v.literal("deposit"),
      v.literal("remittance"),
      v.literal("convert_out"),
      v.literal("convert_in"),
    ),
    amount: v.number(),
    currency: v.string(),
    walletCurrency: v.string(),
    debited: v.number(),
    credited: v.optional(v.number()),
    commission: v.number(),
    fxMargin: v.number(),
    reference: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_wallet", ["walletId"]),

  cards: defineTable({
    userId: v.id("users"),
    tier: v.string(),
    brand: v.string(),
    last4: v.string(),
    holder: v.string(),
    expiry: v.string(),
    balance: v.number(),
    currency: v.string(),
    type: v.string(),
    network: v.string(),
    contactless: v.boolean(),
    gradient: v.string(),
    shimmer: v.string(),
    accentColor: v.string(),
    locked: v.boolean(),
    monthlySpend: v.number(),
    monthlyLimit: v.number(),
  }).index("by_user", ["userId"]),
});
