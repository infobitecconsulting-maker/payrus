# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Where the code lives

This `App/` directory is the actual codebase. The parent `PayRUs/` folder is a OneDrive workspace containing planning docs (`.docx`/`.pdf`), a Claude Design canvas export (`design_import/`), and a Flutter experiment (`flutter_import/`) — none of that is part of this app. `PayRUs/dev.cmd` is a Windows launcher that sets up PATH and runs `pnpm -C App dev` from the parent folder.

## Commands

Run from `App/` (a pnpm workspace with a single package):

```bash
pnpm dev              # start Vite dev server (port 5173, or $PORT)
pnpm build            # tsc -b && vite build
pnpm test             # vitest run (both convex + frontend projects)
pnpm lint             # eslint .
pnpm prettier-check   # check formatting
pnpm prettier-fix     # apply formatting
```

Run a single test file or filter by name:

```bash
pnpm test -- src/pages/dashboard/page.test.tsx
pnpm exec vitest src/pages/dashboard/page.test.tsx   # watch mode
pnpm exec vitest run -t "test name"                  # filter by test name
```

Convex backend functions need `npx convex dev` running separately for local queries/mutations to resolve (the client connects to `VITE_CONVEX_URL` from `.env`). No test files exist yet in the repo; when adding one, place it under `convex/**/*.test.{ts,js}` (edge-runtime, `convex-test`) or `src/**/*.test.{ts,tsx}` (jsdom + Testing Library) per `vitest.config.ts`.

## Architecture

**Stack:** Vite + React 19 + TypeScript, react-router-dom v7, Tailwind CSS v4, shadcn/ui (`new-york` style, Radix primitives), i18next, Supabase Postgres (backend) + Supabase Auth (authentication). Convex is legacy — kept only for KYC/registration document uploads (Convex Storage) and address autosuggest (an HTTP action, internally proxied to Google Maps Platform); everything else described below as "Convex" in old comments has been migrated.

**The real backend is Supabase Postgres**, not a UI-only demo — see the sibling `supabase/` directory (not part of this git repo; a OneDrive-root folder with its own `migrations/0001`–`0015+` and `seed.sql`) for the schema and RPC functions. Identity is handled by Supabase Auth (`src/lib/supabase-client.ts`): password sign-in/sign-up, OAuth (Google, Facebook, GitHub live; Apple and Microsoft coded but unconfigured), magic link, phone/SMS OTP (coded, needs a Twilio account), and SAML Enterprise SSO (coded, needs a paid Supabase plan) — see `src/pages/signin`, `register`, `recover`, `reset-password`, and `auth-callback`. Every sign-in path calls `src/lib/backend.ts`'s `upsertSupabaseUser` (a `upsert_supabase_user` RPC), which links the Supabase identity (`auth_user_id`) to a `public.users` row. The frontend resolves identity client-side and passes `userId` explicitly into backend calls (see `src/hooks/use-current-app-user.ts`) rather than relying on RLS alone for every read. Most feature pages under `src/pages/*/page.tsx` now call real Supabase-backed data via `src/lib/backend.ts` (plain supabase-js queries + `supabase.rpc(...)` calls) and `src/hooks/use-backend.ts` (React Query wrapper hooks) — wallets/transfers, cards, notifications, payment links, admin, role/feature-access management, FX config, KYC. A shrinking number of pages (savings, invest, treasury, pos, bills, payouts, groups, disputes, travel, fundraise, gov, api-hub, games) are still fully hardcoded/mock — an ongoing migration effort; check a given page's imports for `use-backend.ts`/`backend.ts` before assuming either way. When extending a still-mock page, prefer wiring it to real Supabase data over adding more hardcoded content, following the patterns already established in `src/lib/backend.ts`/`src/hooks/use-backend.ts` (see their own header comments) and the money-movement pattern in `supabase/migrations/0005_wallet_view_quote_transfer.sql`/`0006_app_rpc_functions.sql`.

**Locale-prefixed routing:** every app route is nested under `/:lng` (`src/App.tsx`). `LocaleWrapper` validates the locale segment and redirects; the root `/` redirects to `/${SAVED_OR_DEFAULT_LOCALE}`. Supported locales (`en`, `fr`, `pt`, `es`) and locale-path helpers live in `src/i18n.ts`. The language switcher (`src/components/ui/locale-switcher.tsx`, plus a second copy embedded in Settings → Appearance) is driven generically off `SUPPORTED_LOCALES`/`SUPPORTED_LOCALES_ARRAY` — adding a locale means adding an entry there and a matching `src/locales/<lng>/common.json`, no other code changes needed. Translation JSON lives under `src/locales/<lng>/*.json` and is auto-loaded via `import.meta.glob`; default namespace is `"common"`.

**Provider stack** (`src/components/providers/default.tsx`): `ConvexProvider` (plain — no auth wiring, since Convex identity is resolved client-side rather than via `ctx.auth`) → `QueryClientProvider` → `TooltipProvider` → `ThemeProvider` → `ProfileProvider`.

**Profile simulation is the core "multi-tenant" mechanic.** `src/contexts/profile-context.tsx` defines 13 `ProfileType`s (individual, business, corporate, ngo, government, state_entity, pension_fund, microfinance, cooperative, insurance, investment_fund, development_bank, admin), each with a hardcoded name/balance/currency. The active profile is chosen via the profile switcher and persisted to `localStorage` (`payrus_profile`) — independent of Convex/auth. `AppLayout.tsx` reads `profile.type` to gate navigation and page access (e.g. `isGovProfile`, `isFiProfile`, `isIndividual`), and redirects to `/profile` when no profile is selected (except for a small public-path allowlist). Pages that render profile-adaptive content (e.g. `src/pages/dashboard/page.tsx`) key their mock data off `ProfileType` via `Partial<Record<ProfileType, ...>>` maps.

**Path aliases** (defined in both `vite.config.ts` and `vitest.config.ts`): `@` → `src/`, `@/convex` → `convex/`.

**Domain:** PayRus is a fictional pan-African/CEMAC fintech super-app — content and mock data skew toward the Central African market (XAF/CDF currencies, RCA/CEMAC institutions).
