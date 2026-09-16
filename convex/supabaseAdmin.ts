"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TEST_USER_PASSWORD } from "./testUsers";
import { ADMIN_DEFAULT_PASSWORD } from "./admin";

// Admin-API-backed Convex actions — the 2nd+ actions in this codebase (the
// first, convex/oauth.ts, was removed once OAuth moved onto Supabase's own
// flow). Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY set via
// `npx convex env set` — the service role key is a real secret, kept only in
// Convex's own env store, never in any VITE_-prefixed var or frontend file.
// Both actions here are CLI-only (no frontend trigger), matching
// testUsers.seed's own convention.

function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — run `npx convex env set SUPABASE_URL ...` and `npx convex env set SUPABASE_SERVICE_ROLE_KEY ...` first.",
    );
  }
  // No browser session to persist/refresh in a Convex action — this client
  // authenticates purely via the service-role bearer token.
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Creates a Supabase Auth user for `email` if one doesn't already exist, or
// finds the existing one — safe to re-run. There's no admin.getUserByEmail,
// so a duplicate-email response falls back to paging through listUsers and
// matching by email.
async function findOrCreateSupabaseUser(
  admin: SupabaseClient, email: string, password: string, name: string,
): Promise<{ supabaseUserId: string; created: boolean }> {
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name },
  });
  if (!error) {
    return { supabaseUserId: data.user.id, created: true };
  }

  const isDuplicate =
    (error as { code?: string }).code === "email_exists" ||
    /already.*registered/i.test(error.message);
  if (!isDuplicate) throw error;

  let found: { id: string } | undefined;
  for (let page = 1; !found; page++) {
    const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (listError) throw listError;
    found = listed.users.find((u) => u.email === email);
    if (!found && listed.users.length < 200) break;
  }
  if (!found) {
    throw new Error(`Supabase reported ${email} as a duplicate but it couldn't be found via listUsers.`);
  }
  return { supabaseUserId: found.id, created: false };
}

// Provisions real, pre-confirmed Supabase Auth accounts for Google/Facebook-
// flavored demo identities. Run via
// `npx convex run supabaseAdmin:createSsoTestAccounts`.
const SSO_FIXTURES = [
  { email: "alex.morgan.google.demo@payrus-test.app", name: "Alex Morgan" },
  { email: "jordan.lee.facebook.demo@payrus-test.app", name: "Jordan Lee" },
];

export const createSsoTestAccounts = action({
  args: {},
  handler: async (ctx) => {
    const admin = getAdminClient();
    const results: { email: string; userId: string; created: boolean }[] = [];
    for (const fixture of SSO_FIXTURES) {
      const { supabaseUserId, created } = await findOrCreateSupabaseUser(
        admin, fixture.email, TEST_USER_PASSWORD, fixture.name,
      );
      const { userId } = await ctx.runMutation(api.supabaseAuth.upsertSupabaseUser, {
        supabaseUserId, email: fixture.email, name: fixture.name,
      });
      await ctx.runMutation(api.testUsers.finalizeSsoTestAccount, { userId });
      results.push({ email: fixture.email, userId, created });
    }
    return results;
  },
});

// Password auth moved fully onto Supabase Auth this session — every account
// created BEFORE that (testUsers.seed's fixtures, the admin bootstrap) only
// ever existed in Convex, never in Supabase, so none of them can actually
// sign in through the real /signin screen anymore even though their Convex
// rows (roles, wallets, cards) are intact. This backfills a real Supabase
// account for each, keyed by the SAME email already on file, so
// upsertSupabaseUser's by-email adoption path links it onto the existing
// Convex row instead of creating a duplicate — no data loss, just a working
// login again. Scoped deliberately to isTestData rows + the admin role only
// (never a stray/real account) so nobody's real account gets a shared demo
// password assigned to it. Run via
// `npx convex run supabaseAdmin:migrateExistingAccountsToSupabase` — needed
// once before integration test / UAT sessions that exercise role-specific
// features (merchant, ngo, agent, treasury, admin, ...) beyond the two
// "personal" SSO demo accounts above.
export const migrateExistingAccountsToSupabase = action({
  args: {},
  handler: async (ctx) => {
    const admin = getAdminClient();
    const records = await ctx.runQuery(api.admin.listUsers, {});

    const results: { email: string; userId: string; created: boolean; skipped?: string }[] = [];
    for (const { user, roles } of records) {
      if (user.tokenIdentifier.startsWith("supabase:")) continue; // already migrated
      if (!user.email) continue; // can't create a Supabase account without one

      const isAdmin = roles.some((r) => r.role === "admin");
      if (!user.isTestData && !isAdmin) continue; // never touch a real/stray account

      const password = isAdmin ? ADMIN_DEFAULT_PASSWORD : TEST_USER_PASSWORD;
      const { supabaseUserId, created } = await findOrCreateSupabaseUser(
        admin, user.email, password, user.name ?? user.email,
      );
      const { userId } = await ctx.runMutation(api.supabaseAuth.upsertSupabaseUser, {
        supabaseUserId, email: user.email, name: user.name ?? undefined,
      });
      results.push({ email: user.email, userId, created });
    }
    return results;
  },
});
