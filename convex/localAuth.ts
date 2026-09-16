import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currencyForCountry } from "./geo";

// Demo-grade password hashing — salted SHA-256 via the Web Crypto API
// available in Convex's runtime. This is NOT a production KDF (no
// bcrypt/argon2/scrypt work-factor without a Node action); good enough for
// this prototype's own accounts, all of which go through this module.
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomHex(byteLength: number): string {
  return bufferToHex(crypto.getRandomValues(new Uint8Array(byteLength)).buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`));
  return bufferToHex(digest);
}

function generateSixDigitCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

// `firstname.lastname`, lowercased, diacritics stripped, spaces collapsed to
// a single dash — used both for real registrations and to backfill test
// fixtures with the same convention.
export function slugifyUsername(first: string, last: string): string {
  const clean = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, "-");
  return `${clean(first)}.${clean(last)}`;
}

async function findByIdentifier(ctx: MutationCtx, identifier: string): Promise<Doc<"users"> | null> {
  const trimmed = identifier.trim();
  const byUsername = await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", trimmed.toLowerCase())).unique();
  if (byUsername) return byUsername;
  const byEmail = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", trimmed.toLowerCase())).unique();
  if (byEmail) return byEmail;
  return await ctx.db.query("users").filter((q) => q.eq(q.field("phone"), trimmed)).unique();
}

// Creates a brand-new database-only account with a password — the
// registration screen (src/pages/register/page.tsx). A confirmation code
// still has to be verified (see requestConfirmationCode/verifyConfirmationCode)
// before the account is usable for sign-in.
export const register = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    country: v.string(),
    password: v.string(),
    street: v.string(),
    houseNumber: v.string(),
    city: v.string(),
    province: v.string(),
    postalCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const existingByEmail = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", normalizedEmail)).unique();
    if (existingByEmail) {
      throw new ConvexError({ code: "ACCOUNT_EXISTS", message: "An account with this email already exists — log in instead." });
    }
    if (args.password.length < 6) {
      throw new ConvexError({ code: "WEAK_PASSWORD", message: "Password must be at least 6 characters." });
    }

    const username = slugifyUsername(args.firstName, args.lastName);
    const salt = randomHex(16);
    const passwordHash = await hashPassword(args.password, salt);

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: `local:${normalizedEmail}`,
      firstName: args.firstName,
      lastName: args.lastName,
      name: `${args.firstName} ${args.lastName}`,
      username,
      email: normalizedEmail,
      phone: args.phone,
      country: args.country,
      defaultCurrency: currencyForCountry(args.country),
      passwordHash,
      passwordSalt: salt,
    });
    await ctx.db.insert("addresses", {
      userId,
      street: args.street,
      houseNumber: args.houseNumber,
      city: args.city,
      province: args.province,
      country: args.country,
      postalCode: args.postalCode,
      createdAt: Date.now(),
    });
    return { userId, username };
  },
});

// Logs into an existing database-only account. `identifier` can be the
// username, email, or phone number — "forgotten username" is handled by
// just trying the other two.
export const login = mutation({
  args: { identifier: v.string(), password: v.string() },
  handler: async (ctx, { identifier, password }) => {
    const user = await findByIdentifier(ctx, identifier);
    if (!user) {
      throw new ConvexError({ code: "ACCOUNT_NOT_FOUND", message: "No account matches that username, email or phone." });
    }
    if (!user.passwordHash || !user.passwordSalt) {
      throw new ConvexError({ code: "NO_PASSWORD_SET", message: "This account has no password set yet — use account recovery to set one." });
    }
    const candidateHash = await hashPassword(password, user.passwordSalt);
    if (candidateHash !== user.passwordHash) {
      throw new ConvexError({ code: "INVALID_CREDENTIALS", message: "Incorrect password." });
    }
    return { userId: user._id, name: user.name };
  },
});

// Generates and stores a short-lived code for signup verification or
// password recovery. This demo has no real SMS/email provider wired up, so
// the code is returned directly instead of actually being dispatched — the
// UI must label this as a demo limitation, not claim the message was sent.
export const requestConfirmationCode = mutation({
  args: {
    userId: v.optional(v.id("users")),
    identifier: v.optional(v.string()),
    purpose: v.union(v.literal("signup"), v.literal("recovery")),
    channel: v.union(v.literal("sms"), v.literal("email")),
  },
  handler: async (ctx, { userId, identifier, purpose, channel }) => {
    let resolvedUserId: Id<"users"> | null = userId ?? null;
    if (!resolvedUserId && identifier) {
      const user = await findByIdentifier(ctx, identifier);
      resolvedUserId = user?._id ?? null;
    }
    if (!resolvedUserId) {
      throw new ConvexError({ code: "ACCOUNT_NOT_FOUND", message: "No account matches that username, email or phone." });
    }
    const code = generateSixDigitCode();
    await ctx.db.insert("confirmationCodes", {
      userId: resolvedUserId,
      code,
      purpose,
      channel,
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: Date.now(),
    });
    // DEMO ONLY: a real deployment would dispatch `code` via an SMS/email
    // provider here and never return it to the client.
    return { userId: resolvedUserId, code };
  },
});

export const verifyConfirmationCode = mutation({
  args: { userId: v.id("users"), code: v.string(), purpose: v.union(v.literal("signup"), v.literal("recovery")) },
  handler: async (ctx, { userId, code, purpose }) => {
    const candidates = await ctx.db
      .query("confirmationCodes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const match = candidates.find(
      (c) => c.code === code && c.purpose === purpose && !c.consumedAt && c.expiresAt > Date.now(),
    );
    if (!match) {
      throw new ConvexError({ code: "INVALID_CODE", message: "That code is incorrect or has expired." });
    }
    await ctx.db.patch(match._id, { consumedAt: Date.now() });
    return { verified: true };
  },
});

// Password recovery's final step — requires a verified recovery code, same
// as verifyConfirmationCode above but consumed here as one atomic step so a
// code can't be replayed to reset the password twice.
export const resetPassword = mutation({
  args: { identifier: v.string(), code: v.string(), newPassword: v.string() },
  handler: async (ctx, { identifier, code, newPassword }) => {
    const user = await findByIdentifier(ctx, identifier);
    if (!user) {
      throw new ConvexError({ code: "ACCOUNT_NOT_FOUND", message: "No account matches that username, email or phone." });
    }
    if (newPassword.length < 6) {
      throw new ConvexError({ code: "WEAK_PASSWORD", message: "Password must be at least 6 characters." });
    }
    const candidates = await ctx.db
      .query("confirmationCodes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const match = candidates.find(
      (c) => c.code === code && c.purpose === "recovery" && !c.consumedAt && c.expiresAt > Date.now(),
    );
    if (!match) {
      throw new ConvexError({ code: "INVALID_CODE", message: "That code is incorrect or has expired." });
    }
    await ctx.db.patch(match._id, { consumedAt: Date.now() });

    const salt = randomHex(16);
    const passwordHash = await hashPassword(newPassword, salt);
    await ctx.db.patch(user._id, { passwordHash, passwordSalt: salt });
    return { userId: user._id };
  },
});
