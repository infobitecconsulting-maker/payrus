# PayRus App

PayRus is a pan-African / CEMAC fintech super-app: multi-currency wallets,
remittance, P2P, cards, payment links, POS, payouts, savings, groups and more,
with a profile system that shows each user only the features their role needs.
This repository is the **consumer web app**.
Its operations counterpart is the
[PayRus Console](https://github.com/infobitecconsulting-maker/PayRus-Console);
both run on the **same Supabase backend**, so a transaction committed in one is
visible in the other.

Stack: Vite 7 · React 19 · TypeScript · react-router v7 · Tailwind CSS v4 ·
shadcn/ui · i18next (EN / FR / PT / ES) · Supabase (Postgres + Auth) ·
Convex (address autosuggest, file storage, FX-rate fetch/cron only).

## Quick start

```bash
pnpm install
cp .env.example .env     # fill in the Supabase values below
pnpm dev                 # http://localhost:5173
```

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Type-check (`tsc -b`) and production build |
| `pnpm test` | Vitest (Convex + frontend projects) |
| `pnpm lint` | ESLint |
| `pnpm regression` | Cross-app regression guard (see below) |
| `pnpm prettier-check` / `prettier-fix` | Formatting |

`npx convex dev` must be running for the Convex-backed features (address
suggestions, KYC uploads, FX rate refresh).

### Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `.env` | Supabase project; the anon key is public by design |
| `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` | `.env` | Convex deployment |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Convex env (`npx convex env set`) | Server-side admin provisioning — **a real secret, never in `.env` or any `VITE_` var** |
| `GOOGLE_MAPS_API_KEY` | Convex env (optional) | Google address autosuggest. Unset, autosuggest falls back to free OpenStreetMap (Photon) results |

OAuth / SSO providers are configured in the Supabase dashboard, not in code.

## Architecture

- **Supabase Postgres is the system of record.** Users, roles, wallets,
  transfers, cards, notifications, payment links, disputes, savings, audit and
  configuration live in Postgres, reached through `src/lib/backend.ts`
  (supabase-js queries and `supabase.rpc(...)`) and wrapped by React Query hooks
  in `src/hooks/use-backend.ts`. Money-moving and admin operations are
  security-definer RPCs; row-level security keeps private tables hidden from
  anonymous callers. Schema, RPCs and seed data live in the sibling
  `supabase/` workspace folder (migrations `0001`–`0037`), which is **not part
  of this repository**.
- **One identity for both apps.** Supabase Auth sessions (password, magic link,
  phone OTP, OAuth, SAML SSO) are shared with the Console. Every sign-in calls
  `upsert_supabase_user`, which links the auth identity to a `public.users`
  row. The live session is re-validated on load; logout ends it.
- **Profiles and access are data.** `role_definitions` is the one role
  vocabulary both apps read. `profile_features` decides which of 16 features
  each profile sees in this app's navigation, and `console_role_tabs` does the
  same for the Console's tabs. A super administrator edits both from
  *Admin → Roles & Access*; changes apply on the next load in either app.
  Admins always keep full access so a bad edit cannot lock them out.
- **Locale-prefixed routes.** Every route lives under `/:lng` (`/en/wallet`).
  Supported locales and helpers are in `src/i18n.ts`; strings are in
  `src/locales/<lng>/common.json`.
- **Profile simulation.** `src/contexts/profile-context.tsx` holds the active
  profile (persisted locally); `AppLayout.tsx` uses it, plus live features from
  the database, to gate navigation and pages.

Convex is legacy and intentionally small: address autosuggest
(`convex/addressSuggestions.ts`), KYC/registration file storage, and the FX
rate fetch cron.

## Security

- **Two-factor authentication (TOTP)** is real, not a toggle. A user with a
  verified authenticator factor must enter a code at sign-in and before sending
  money; **admin/staff screens require an enrolled factor and a verified
  session**. Enrol in *Settings → Security*. A factor enrolled here also protects
  the Console.
- Admin actions are password-gated in the database and written to an
  append-only audit log.
- Availability badges (Live / Limited / Sandbox / Demo) come from the
  capability registry, never hard-coded; no registry row means "Demo".
- The status indicator in the top bar is a live probe of the backend, not static
  text.

## Regression guard

`pnpm regression` (`scripts/regression-check.mjs`) is read-only and fails the run
if any of these break, across **both** apps:

- routes present in the live prototype (payrus.cards) and the spec disappear;
- a table or RPC used by either app is missing from the shared backend;
- anonymous callers can read private data;
- a role loses its core features or console tabs, or a role is unusable on one
  platform;
- MFA, staff gating, live status, demo-content separation or registry-driven
  badges are removed.

Run it, plus `pnpm lint && pnpm test && pnpm build`, before merging. See
[docs/regression-and-traceability.md](docs/regression-and-traceability.md) for
the checks and the spec coverage table.

## Repository layout

```
src/
  pages/            one folder per route (dashboard, wallet, remittance, admin, ...)
  components/       ui primitives, mfa, providers, landing
  lib/              backend.ts (Supabase), mfa.ts, capability.ts, supabase-client.ts
  hooks/            use-backend.ts (React Query), use-system-status.ts, ...
  contexts/         profile-context.tsx
  locales/          en / fr / pt / es
convex/             address autosuggest, storage, FX cron
scripts/            regression-check.mjs
docs/               regression + spec traceability
```

`src/components/landing/*` and `src/data/payrus-landing-content.ts` are an
early landing-page scaffold merged from the repository's first commits; they are
not wired into the running app.

## Status and roadmap

Most feature pages run on real Supabase data. Not yet built: passkeys and device
binding, amount/risk-adaptive step-up, a server-side monitoring feed for the
status page, and capability-registry rows for real partner approvals. Partner
capabilities (cards, POS, mobile-money rails) remain simulated until contracted.

Requirements baseline: *PayRus Requirements Specification v2.0* (16 Sep 2026).

## Android tooling

`install_android_system_image.cmd` installs the Android 36 emulator image and
SDK tools on Windows (uses the `android sdk` CLI).
