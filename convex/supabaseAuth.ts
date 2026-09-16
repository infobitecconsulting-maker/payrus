import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { slugifyUsername } from "./localAuth";
import { currencyForCountry } from "./geo";

// The bridge between Supabase Auth (credentials/identity) and Convex (every
// other table). Every other table's userId foreign key still points at
// Convex's own `users` document id — a Supabase Auth UUID never replaces
// that id, it's only ever used to LOOK UP which Convex users._id a signed-in
// person maps to, via the tokenIdentifier convention
// "supabase:<supabase-auth-uuid>" (a new sibling to this table's existing
// "local:"/"oauth:"/"test:"/"admin-created:" prefixes, reusing the existing
// by_token index — no schema/index change needed).
export const upsertSupabaseUser = mutation({
  args: {
    supabaseUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, { supabaseUserId, email, name, firstName, lastName }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const tokenIdentifier = `supabase:${supabaseUserId}`;

    const existingByToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();
    if (existingByToken) {
      return { userId: existingByToken._id, isNew: false, name: existingByToken.name ?? normalizedEmail };
    }

    // Covers an account created before Supabase was wired up (still carries
    // its old "local:"/"oauth:" token) — adopt it onto the new Supabase
    // identity instead of creating a duplicate row for the same email.
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();
    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, { tokenIdentifier });
      return { userId: existingByEmail._id, isNew: false, name: existingByEmail.name ?? normalizedEmail };
    }

    const resolvedName = name ?? (firstName && lastName ? `${firstName} ${lastName}` : undefined) ?? normalizedEmail;
    const userId = await ctx.db.insert("users", {
      tokenIdentifier,
      email: normalizedEmail,
      name: resolvedName,
      firstName,
      lastName,
      username: firstName && lastName ? slugifyUsername(firstName, lastName) : undefined,
    });
    return { userId, isNew: true, name: resolvedName };
  },
});

// The non-identity fields the registration form collects (phone/address),
// applied right after upsertSupabaseUser resolves the account — kept as a
// separate step rather than folded into the upsert above, since sign-in
// (which also calls upsertSupabaseUser) never has these fields to give.
// Mirrors what localAuth.register used to do inline: patch `phone`/`country`/
// `defaultCurrency` onto the user row and insert one `addresses` row.
export const completeRegistrationProfile = mutation({
  args: {
    userId: v.id("users"),
    phone: v.string(),
    country: v.string(),
    street: v.string(),
    houseNumber: v.string(),
    city: v.string(),
    province: v.string(),
    postalCode: v.optional(v.string()),
  },
  handler: async (ctx, { userId, phone, country, street, houseNumber, city, province, postalCode }) => {
    await ctx.db.patch(userId, { phone, country, defaultCurrency: currencyForCountry(country) });
    await ctx.db.insert("addresses", {
      userId,
      street,
      houseNumber,
      city,
      province,
      country,
      postalCode,
      createdAt: Date.now(),
    });
  },
});

// Lets sign-in and password-recovery keep accepting a username, email, OR
// phone number (an explicit earlier requirement in this app) even though
// Supabase's own signInWithPassword/resetPasswordForEmail only take an
// email — resolve the identifier to an email here first, then call Supabase
// with that. Mirrors localAuth.ts's findByIdentifier lookup order, but
// returns just the email (or null) since the frontend handles "not found"
// itself rather than this query throwing.
export const resolveEmailByIdentifier = query({
  args: { identifier: v.string() },
  handler: async (ctx, { identifier }) => {
    const trimmed = identifier.trim();
    const byUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", trimmed.toLowerCase()))
      .unique();
    if (byUsername?.email) return byUsername.email;

    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", trimmed.toLowerCase()))
      .unique();
    if (byEmail?.email) return byEmail.email;

    const byPhone = await ctx.db.query("users").filter((q) => q.eq(q.field("phone"), trimmed)).unique();
    return byPhone?.email ?? null;
  },
});
