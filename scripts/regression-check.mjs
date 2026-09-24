#!/usr/bin/env node
// No-regression / shared-backend guard for App/ and ops-console/.
//
// Run:  pnpm regression      (from App/)
//
// Static checks (no network): every route the live prototype (payrus.cards)
// exposes still exists in App/, and every console tab key is a known key.
// Live checks (read-only, anon key, no writes): every table and RPC that
// EITHER frontend calls exists in the one shared Supabase backend, RLS still
// hides private data from anonymous callers, and the role/profile visibility
// catalogues (console_role_tabs, profile_features) still satisfy the
// invariants below. Invariants (not an exact snapshot) so a supadmin editing
// visibility in the Roles & Access panel is never flagged as a regression.
//
// Exit code 1 on any failure so it can gate CI / pre-commit.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const consoleRoot = join(appRoot, "..", "ops-console");

let failures = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const fail = (m) => {
  failures++;
  console.log(`  FAIL  ${m}`);
};
const section = (t) => console.log(`\n${t}`);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)) out.push(p);
  }
  return out;
}
const sources = [...walk(join(appRoot, "src")), ...walk(join(consoleRoot, "src"))];
const allText = sources.map((p) => readFileSync(p, "utf8")).join("\n");

// --- 1. Route parity with the live prototype -------------------------------
section("Routes (live prototype payrus.cards must remain a subset of App/)");
const appTsx = readFileSync(join(appRoot, "src", "App.tsx"), "utf8");
const PROTOTYPE_ROUTES = ["dashboard", "payments", "wallet", "remittance", "transactions", "cards", "investor", "admin", "profile"];
// Spec-driven routes added since the prototype; guarded so they are not silently dropped.
const SPEC_ROUTES = ["p2p", "organisation", "register-customer", "notifications", "settings", "gov", "api-hub", "treasury", "payouts", "payment-links", "pos", "disputes", "bills", "signin", "register", "recover", "reset-password"];
for (const r of [...PROTOTYPE_ROUTES, ...SPEC_ROUTES]) {
  appTsx.includes(`path="${r}"`) ? ok(`/${r}`) : fail(`route /${r} missing from App/src/App.tsx`);
}

// --- 2. Console tab keys ----------------------------------------------------
section("Console tab keys");
const types = readFileSync(join(consoleRoot, "src", "types.ts"), "utf8");
const TAB_KEYS = ["overview", "transactions", "payouts", "merchants", "agents", "mandates", "grants", "members"];
for (const k of TAB_KEYS) types.includes(`"${k}"`) ? ok(k) : fail(`TabKey "${k}" missing from ops-console/src/types.ts`);

// --- 3. Live shared backend --------------------------------------------------
function loadEnv() {
  const env = { ...process.env };
  for (const f of [".env", ".env.local"]) {
    const p = join(appRoot, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
const env = loadEnv();
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

if (!URL_ || !KEY) {
  section("Live backend");
  console.log("  skip  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set");
} else {
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  const get = (path) => fetch(`${URL_}/rest/v1/${path}`, { headers: H });

  const tables = [...new Set([...allText.matchAll(/\.from\(\s*["']([a-z_0-9]+)["']/g)].map((m) => m[1]))].sort();
  section(`Tables used by App/ + ops-console/ exist in the shared backend (${tables.length})`);
  const missingTables = [];
  await Promise.all(
    tables.map(async (t) => {
      const res = await get(`${t}?select=*&limit=0`);
      if (res.status === 404) missingTables.push(t);
    }),
  );
  missingTables.length ? missingTables.forEach((t) => fail(`table/view ${t} not found`)) : ok("all tables/views reachable");

  const rpcs = [...new Set([...allText.matchAll(/\.rpc\(\s*["']([a-z_0-9]+)["']/g)].map((m) => m[1]))].sort();
  section(`RPCs used by App/ + ops-console/ are defined in supabase/migrations (${rpcs.length})`);
  // Anonymous callers cannot see non-executable functions (PostgREST answers 404 for
  // them), so RPC existence is checked against the migration source of truth.
  const migDir = join(appRoot, "..", "supabase", "migrations");
  if (!existsSync(migDir)) console.log("  skip  supabase/migrations not found");
  else {
    const defined = new Set();
    for (const f of readdirSync(migDir).filter((n) => n.endsWith(".sql"))) {
      const sql = readFileSync(join(migDir, f), "utf8");
      for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_0-9]+)/gi)) defined.add(m[1].toLowerCase());
    }
    const missing = rpcs.filter((f) => !defined.has(f));
    missing.length ? missing.forEach((f) => fail(`rpc ${f} not defined in any migration`)) : ok("all RPCs defined");
  }

  section("RLS: anonymous callers must not read private data");
  for (const t of ["users", "user_roles", "wallet_views", "transfers", "cards", "notifications", "addresses", "api_keys"]) {
    const res = await get(`${t}?select=*&limit=1`);
    const body = res.ok ? await res.json() : [];
    Array.isArray(body) && body.length > 0 ? fail(`anon can read rows of ${t}`) : ok(`${t} hidden from anon`);
  }

  section("Role/profile visibility invariants (editable by supadmin, so not an exact snapshot)");
  const tabRows = await (await get("console_role_tabs?select=role,tab_key")).json();
  const tabs = {};
  for (const r of tabRows) (tabs[r.role] ??= new Set()).add(r.tab_key);
  for (const role of ["Personal", "Merchant", "Agent", "Treasury", "Institution", "NGO", "Group", "Other"]) {
    const s = tabs[role];
    if (!s) fail(`console role ${role} has no tabs`);
    else if (!s.has("overview") || !s.has("transactions")) fail(`console role ${role} lost overview/transactions`);
    else ok(`console ${role}: ${[...s].sort().join(",")}`);
  }
  const featRows = await (await get("profile_features?select=profile_type,feature_key")).json();
  const feats = {};
  for (const r of featRows) (feats[r.profile_type] ??= new Set()).add(r.feature_key);
  const need = {
    admin: ["admin_panel", "register_customer", "treasury_hub", "gov_hub", "api_hub", "payouts", "payment_links", "pos", "savings"],
    personal: ["savings", "p2p"],
    starter: ["savings", "p2p"],
    merchant: ["pos", "payment_links", "payouts"],
    agent: ["register_customer"],
    treasury: ["treasury_hub", "payouts", "api_hub"],
    public_institution: ["gov_hub"],
    ngo: ["fundraise", "payouts"],
    group: ["groups"],
  };
  for (const [profile, keys] of Object.entries(need)) {
    const missing = keys.filter((k) => !feats[profile]?.has(k));
    missing.length ? fail(`profile ${profile} lost features: ${missing.join(", ")}`) : ok(`profile ${profile} keeps core features`);
  }
  // Cross-platform: role_definitions is the one role vocabulary both apps read, so every
  // slug must resolve to visible features in App/ AND a console role that has tabs.
  const defs = await (await get("role_definitions?select=slug,console_role,is_admin")).json();
  for (const d of Array.isArray(defs) ? defs : []) {
    const appOk = d.is_admin || feats[d.slug]?.size > 0; // admin-tier (admin, superadmin) is gated by staff access, not profile_features
    const consoleOk = d.is_admin || tabs[d.console_role]?.size > 0;
    appOk && consoleOk ? ok(`role ${d.slug}: App features + console tabs (${d.console_role})`) : fail(`role ${d.slug} not usable on both platforms (app=${appOk}, console=${consoleOk})`);
  }
  for (const [profile, set] of Object.entries(feats)) {
    if (profile !== "admin" && set.has("admin_panel")) fail(`non-admin profile ${profile} has admin_panel`);
  }
}

console.log(failures ? `\n${failures} regression check(s) FAILED` : "\nAll regression checks passed");
process.exit(failures ? 1 : 0);
