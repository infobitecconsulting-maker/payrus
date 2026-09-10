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
  }).index("by_token", ["tokenIdentifier"]),
});
