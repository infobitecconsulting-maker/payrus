import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { provisionStarterFinancials } from "./financialData";
import { hashPassword, randomHex } from "./localAuth";

// Every test fixture shares this password so they're all usable for manual
// login testing (via the username/password screen — src/pages/signin/page.tsx)
// without having to look up 9 different secrets. Never used for a real
// account; only ever set on rows created by this seed script.
export const TEST_USER_PASSWORD = "Test1234";

// One fixture per role/profile type (see profile-context.tsx's ProfileType
// union) so every role has at least one account to sign in as and test
// against — the "admin" super-user is bootstrapped separately, see
// convex/admin.ts:createAdminProfile.
const TEST_USERS = [
  {
    slug: "aicha-fofana", name: "Aïcha Fofana", email: "aicha.fofana@test.payrus.app",
    role: "personal", kind: "individual" as const,
    phone: "+225 07 00 11 22", dateOfBirth: "1994-03-12", address: "Cocody, Abidjan", idType: "national",
  },
  {
    // The name previously baked into profile-context.tsx's generic
    // "personal" template (before that got fixed to always show the real
    // logged-in user's own name instead) — kept alive here as an actual
    // seeded account rather than orphaned as dead placeholder text.
    slug: "jean-dupont", name: "Jean Dupont", email: "jean.dupont@test.payrus.app",
    role: "personal", kind: "individual" as const,
    phone: "+237 6 90 12 34 56", dateOfBirth: "1988-09-24", address: "Bonanjo, Douala", idType: "national",
  },
  {
    slug: "kwame-asante", name: "Kwame Asante", email: "kwame.asante@test.payrus.app",
    role: "starter", kind: "individual" as const,
    phone: "+233 24 00 33 44", dateOfBirth: "1998-07-21", address: "Osu, Accra", idType: "passport",
  },
  {
    slug: "rawbank-distribution", name: "Rawbank Distribution SARL", email: "ops@test.rawbank-distribution.payrus.app",
    role: "merchant", kind: "organisation" as const,
    phone: "+243 81 55 66 77", dateOfBirth: "", address: "Gombe, Kinshasa", idType: "national",
    orgName: "Rawbank Distribution SARL",
    // No registrationDocId — a real one only exists after an actual file
    // upload, which this seed script can't perform server-side. Left
    // incomplete on purpose, demonstrating the "incomplete" role badge.
  },
  {
    slug: "amina-diallo", name: "Amina Diallo Fondation", email: "contact@test.amina-diallo.payrus.app",
    role: "ngo", kind: "organisation" as const,
    phone: "+221 77 88 99 00", dateOfBirth: "", address: "Plateau, Dakar", idType: "national",
    orgName: "Amina Diallo Fondation",
  },
  {
    slug: "mama-amina-kiosk", name: "Kiosque Mama Amina", email: "mama.amina@test.payrus.app",
    role: "agent", kind: "individual" as const,
    phone: "+236 70 12 34 56", dateOfBirth: "1979-11-02", address: "PK5, Bangui", idType: "national",
  },
  {
    slug: "cemac-holdings", name: "CEMAC Holdings S.A.", email: "treasury@test.cemac-holdings.payrus.app",
    role: "treasury", kind: "organisation" as const,
    phone: "+242 06 44 55 66", dateOfBirth: "", address: "Centre-ville, Brazzaville", idType: "national",
    orgName: "CEMAC Holdings S.A.",
  },
  {
    slug: "ministere-finances-rca", name: "Ministère des Finances — RCA", email: "contact@test.finances-rca.payrus.app",
    role: "public_institution", kind: "organisation" as const,
    phone: "+236 75 00 00 01", dateOfBirth: "", address: "Avenue de l'Indépendance, Bangui", idType: "national",
    orgName: "Ministère des Finances — RCA",
  },
  {
    slug: "mucodec-group", name: "MUCODEC Congo-Brazzaville", email: "group@test.mucodec.payrus.app",
    role: "group", kind: "organisation" as const,
    phone: "+242 05 33 22 11", dateOfBirth: "", address: "Poto-Poto, Brazzaville", idType: "national",
    orgName: "MUCODEC Congo-Brazzaville",
  },
];

// A second "personal" fixture, fully verified from the start — useful for
// testing P2P-style flows and anything that needs a second real account
// distinct from aicha-fofana above.
const SECOND_PERSONAL_TEST_USER = {
  slug: "moussa-diallo", name: "Moussa Diallo", email: "moussa.diallo@test.payrus.app",
  role: "personal", kind: "individual" as const,
  phone: "+221 78 45 12 09", dateOfBirth: "1990-05-18", address: "Médina, Dakar", idType: "passport",
};

// firstname.lastname convention, generalized to org fixtures via their
// existing slug ("rawbank-distribution" → "rawbank.distribution") since an
// organisation has no personal first/last name to split.
function usernameFromSlug(slug: string): string {
  return slug.replace(/-/g, ".");
}

async function usersTableFields(fixture: { slug: string; phone: string; dateOfBirth: string; address: string; idType: string }) {
  // Only a genuinely completed KYC (non-empty date of birth) gets marked
  // verified at the `users`-table level — a couple of org fixtures are left
  // incomplete on purpose (see TEST_USERS above) and should stay that way.
  const complete = fixture.phone && fixture.dateOfBirth && fixture.address && fixture.idType;
  const salt = randomHex(16);
  return {
    username: usernameFromSlug(fixture.slug),
    phone: fixture.phone || undefined,
    dateOfBirth: fixture.dateOfBirth || undefined,
    address: fixture.address || undefined,
    idType: fixture.idType || undefined,
    kycStatus: (complete ? "verified" : "unverified") as "unverified" | "verified",
    kycSubmittedAt: complete ? Date.now() : undefined,
    passwordHash: await hashPassword(TEST_USER_PASSWORD, salt),
    passwordSalt: salt,
  };
}

/**
 * Idempotent (by email) test-user fixtures: real `users`/`userRoles` rows
 * with financial data provisioned through the exact same
 * `provisionStarterFinancials` path a real role activation uses — not a
 * special-cased seed shape. Also backfills `isTestData` and the fuller
 * `users`-table fields onto fixtures created before those existed, so
 * re-running this after a schema change heals old rows instead of leaving
 * them half-populated. Run via `npx convex run testUsers:seed`.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const createdUserIds: string[] = [];
    for (const fixture of [...TEST_USERS, SECOND_PERSONAL_TEST_USER]) {
      let user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", fixture.email))
        .unique();

      if (!user) {
        const userId = await ctx.db.insert("users", {
          tokenIdentifier: `test:${fixture.slug}`,
          name: fixture.name,
          email: fixture.email,
          isTestData: true,
          ...(await usersTableFields(fixture)),
        });
        user = await ctx.db.get(userId);
      } else if (!user.isTestData || user.kycStatus === undefined || !user.username || !user.passwordHash) {
        // Heal a fixture that predates the isTestData flag, the fuller users
        // fields, or the username/password columns, without touching a real
        // account (only rows we already recognize by their fixture email
        // ever reach this branch).
        await ctx.db.patch(user._id, { isTestData: true, ...(await usersTableFields(fixture)) });
        user = await ctx.db.get(user._id);
      }
      if (!user) continue;

      const existingRole = await ctx.db
        .query("userRoles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("role"), fixture.role))
        .unique();

      if (!existingRole) {
        await ctx.db.insert("userRoles", {
          userId: user._id,
          role: fixture.role,
          kind: fixture.kind,
          status: "pending_verification",
          phone: fixture.phone,
          dateOfBirth: fixture.dateOfBirth,
          address: fixture.address,
          idType: fixture.idType,
          orgName: "orgName" in fixture ? fixture.orgName : undefined,
          createdAt: Date.now(),
        });
      }

      await provisionStarterFinancials(ctx, user._id, fixture.kind);
      createdUserIds.push(user._id);
    }
    return createdUserIds;
  },
});

/**
 * Removes every user flagged isTestData=true along with their roles, wallets
 * and cards — the counterpart to seed(), for wiping the fixture dataset
 * without touching real accounts (which are never flagged). Run via
 * `npx convex run testUsers:cleanup`.
 */
export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const testUsersFound = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestData"), true))
      .collect();

    let deletedUsers = 0;
    for (const user of testUsersFound) {
      const [roles, wallets, cards] = await Promise.all([
        ctx.db.query("userRoles").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
        ctx.db.query("wallets").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
        ctx.db.query("cards").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ]);
      await Promise.all([
        ...roles.map((r) => ctx.db.delete(r._id)),
        ...wallets.map((w) => ctx.db.delete(w._id)),
        ...cards.map((c) => ctx.db.delete(c._id)),
      ]);
      await ctx.db.delete(user._id);
      deletedUsers++;
    }
    return { deletedUsers };
  },
});

/**
 * Marks a Supabase-backed user (see convex/supabaseAdmin.ts) as test data,
 * gives it a "personal" role and starter financials — the same shape every
 * other fixture in this file gets, just reached via Supabase's admin API
 * for identity instead of the local upsert-by-fixture loop above. Picked up
 * automatically by cleanup() since it only keys off isTestData.
 */
export const finalizeSsoTestAccount = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;
    if (!user.isTestData) {
      await ctx.db.patch(userId, { isTestData: true });
    }
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "personal"))
      .unique();
    if (!existingRole) {
      await ctx.db.insert("userRoles", {
        userId,
        role: "personal",
        kind: "individual" as const,
        status: "pending_verification" as const,
        createdAt: Date.now(),
      });
    }
    await provisionStarterFinancials(ctx, userId, "individual");
  },
});
