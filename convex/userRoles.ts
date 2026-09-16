import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { provisionStarterFinancials } from "./financialData";

const INDIVIDUAL_REQUIRED = ["phone", "dateOfBirth", "address", "idType"] as const;
const ORGANISATION_REQUIRED = [
  "phone", "dateOfBirth", "address", "idType",
  "orgName", "registrationDocId", "legalRepName", "legalRepIdType", "legalRepIdNumber", "legalRepPhone",
] as const;

function isComplete(role: { kind: "individual" | "organisation" } & Record<string, unknown>) {
  const required = role.kind === "organisation" ? ORGANISATION_REQUIRED : INDIVIDUAL_REQUIRED;
  return required.every((field) => {
    const value = role[field];
    return typeof value === "string" ? value.trim().length > 0 : value != null;
  });
}

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const roles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return roles.map((role) => ({ ...role, complete: isComplete(role) }));
  },
});

// Creates or updates a single role's record for a user. Called once, at the
// end of the onboarding wizard, with everything collected across its steps —
// so a role never exists half-written.
export const upsertRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
    kind: v.union(v.literal("individual"), v.literal("organisation")),
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), args.role))
      .unique();

    const fields = { ...args, status: "pending_verification" as const };

    // Every role activation enriches the user's financial data — a no-op if
    // they already have wallets/cards from an earlier role.
    await provisionStarterFinancials(ctx, args.userId, args.kind);

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("userRoles", { ...fields, createdAt: Date.now() });
  },
});

// Standard Convex file-upload pattern: the client POSTs the file directly to
// this URL and gets back a storageId to pass into upsertRole.
export const generateRegistrationDocUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
