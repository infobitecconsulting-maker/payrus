import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { provisionStarterFinancials } from "./financialData";
import { hashPassword, randomHex } from "./localAuth";

// Gate on admin-granting actions in the panel (grantAdminRole, and creating
// a profile with role "admin"), AND the actual login password for the
// canonical admin super-user account below. Demo-grade (no rotation, no
// per-admin secrets) — rotate or replace before any real deployment.
export const ADMIN_DEFAULT_PASSWORD = "Admin";
const ADMIN_EMAIL = "admin@payrus.app";
const ADMIN_USERNAME = "admin";

function assertAdminPassword(password: string) {
  if (password !== ADMIN_DEFAULT_PASSWORD) {
    throw new ConvexError({ code: "INVALID_PASSWORD", message: "Incorrect admin password" });
  }
}

// Full directory of every user in the system (real sign-ins and seeded test
// fixtures alike) plus their roles and provisioned financial data, for the
// admin "Manage Profiles" screen. Not scoped/paginated — the demo dataset is
// small enough to load in one shot.
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return await Promise.all(
      users.map(async (user) => {
        const roles = await ctx.db
          .query("userRoles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        const wallets = await ctx.db
          .query("wallets")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        const cards = await ctx.db
          .query("cards")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        return { user, roles, wallets, cards };
      }),
    );
  },
});

// Edits an existing role's fields (used by the admin "edit profile" panel —
// same shape as userRoles.upsertRole's optional fields, minus identity/kind
// which aren't editable after creation).
export const updateUserRole = mutation({
  args: {
    roleId: v.id("userRoles"),
    status: v.optional(
      v.union(v.literal("incomplete"), v.literal("pending_verification"), v.literal("verified")),
    ),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    idType: v.optional(v.string()),
    orgName: v.optional(v.string()),
    legalRepName: v.optional(v.string()),
    legalRepIdType: v.optional(v.string()),
    legalRepIdNumber: v.optional(v.string()),
    legalRepPhone: v.optional(v.string()),
  },
  handler: async (ctx, { roleId, ...patch }) => {
    await ctx.db.patch(roleId, patch);
  },
});

// Creates a brand-new user + role from the admin panel (an admin-authored
// profile, not a real OIDC sign-in) and provisions it with the same starter
// wallets/card any other role activation gets, through
// provisionStarterFinancials — no special-cased admin-only data shape.
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.string(),
    kind: v.union(v.literal("individual"), v.literal("organisation")),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.role === "admin") {
      assertAdminPassword(args.password ?? "");
    }
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const userId = existingUser
      ? existingUser._id
      : await ctx.db.insert("users", {
          tokenIdentifier: `admin-created:${args.email}`,
          name: args.name,
          email: args.email,
        });

    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), args.role))
      .unique();
    if (existingRole) {
      return { userId, roleId: existingRole._id, alreadyExisted: true };
    }

    const roleId = await ctx.db.insert("userRoles", {
      userId,
      role: args.role,
      kind: args.kind,
      status: "incomplete" as const,
      createdAt: Date.now(),
    });
    await provisionStarterFinancials(ctx, userId, args.kind);
    return { userId, roleId, alreadyExisted: false };
  },
});

// Grants a user the admin role directly (no KYC wizard — matches "the admin
// profile is unique and has access to all roles by default"). Idempotent.
export const grantAdminRole = mutation({
  args: { userId: v.id("users"), password: v.string() },
  handler: async (ctx, { userId, password }) => {
    assertAdminPassword(password);
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .unique();
    if (existing) return existing._id;
    await provisionStarterFinancials(ctx, userId, "individual");
    return await ctx.db.insert("userRoles", {
      userId,
      role: "admin",
      kind: "individual" as const,
      status: "verified" as const,
      createdAt: Date.now(),
    });
  },
});

// Bootstraps THE admin profile — a single canonical super-user account
// (username "admin", email admin@payrus.app, password "Admin") that can log
// in through the normal username/password screen like any other account,
// and is treated as having every role verified (see profile/page.tsx's
// roleLookup) plus full visibility over every user's data in the admin
// panel (admin.listUsers has no per-caller restriction). Distinct from
// granting the admin role to an arbitrary existing user via grantAdminRole
// above. Idempotent: re-running with the correct password just returns the
// existing profile (and heals a pre-existing admin row missing its
// username/password) instead of duplicating it.
export const createAdminProfile = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    assertAdminPassword(password);

    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", ADMIN_EMAIL))
      .unique();
    if (!user) {
      const salt = randomHex(16);
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: `admin-created:${ADMIN_EMAIL}`,
        name: "PayRus System Administrator",
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        passwordHash: await hashPassword(ADMIN_DEFAULT_PASSWORD, salt),
        passwordSalt: salt,
      });
      user = await ctx.db.get(userId);
    } else if (!user.username || !user.passwordHash) {
      const salt = randomHex(16);
      await ctx.db.patch(user._id, {
        username: ADMIN_USERNAME,
        passwordHash: await hashPassword(ADMIN_DEFAULT_PASSWORD, salt),
        passwordSalt: salt,
      });
      user = await ctx.db.get(user._id);
    }
    if (!user) {
      throw new ConvexError({ code: "INTERNAL", message: "Failed to create admin user" });
    }

    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .unique();
    if (existingRole) {
      return { userId: user._id, roleId: existingRole._id, alreadyExisted: true };
    }

    await provisionStarterFinancials(ctx, user._id, "individual");
    const roleId = await ctx.db.insert("userRoles", {
      userId: user._id,
      role: "admin",
      kind: "individual" as const,
      status: "verified" as const,
      createdAt: Date.now(),
    });
    return { userId: user._id, roleId, alreadyExisted: false };
  },
});

export const deleteUserRole = mutation({
  args: { roleId: v.id("userRoles") },
  handler: async (ctx, { roleId }) => {
    await ctx.db.delete(roleId);
  },
});

// One-off data-cleanup pass: cards provisioned before
// financialData.ts:provisionStarterFinancials looked up the real account
// name were all stamped with the placeholder "CARD HOLDER" — this backfills
// them from the owning user's real name wherever one is now on file, so a
// logged-in user's own card matches who's actually logged in instead of a
// generic placeholder. Safe to re-run: only touches rows still holding the
// placeholder, and only when a real name exists to replace it with.
export const backfillCardHolders = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("cards")
      .filter((q) => q.eq(q.field("holder"), "CARD HOLDER"))
      .collect();

    let updated = 0;
    for (const card of cards) {
      const user = await ctx.db.get(card.userId);
      if (user?.name) {
        await ctx.db.patch(card._id, { holder: user.name.toUpperCase() });
        updated++;
      }
    }
    return { updated, scanned: cards.length };
  },
});
