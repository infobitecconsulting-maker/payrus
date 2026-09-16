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

**Stack:** Vite + React 19 + TypeScript, react-router-dom v7, Tailwind CSS v4, shadcn/ui (`new-york` style, Radix primitives), i18next, Convex (backend), Supabase Auth for authentication.

**This is a UI-first demo/prototype app, not a fully wired backend app.** Identity is handled by Supabase Auth (`src/lib/supabase-client.ts`): password sign-in/sign-up, OAuth (Google, Facebook, GitHub live; Apple and Microsoft coded but unconfigured), magic link, phone/SMS OTP (coded, needs a Twilio account), and SAML Enterprise SSO (coded, needs a paid Supabase plan) — see `src/pages/signin`, `register`, `recover`, `reset-password`, and `auth-callback`. Every sign-in path routes through `convex/supabaseAuth.ts`'s `upsertSupabaseUser`, which links the Supabase identity (`tokenIdentifier: "supabase:<uuid>"`) to a `users` row and syncs KYC/profile-type fields (`convex/schema.ts`, `convex/users.ts`). Convex itself never sees a Supabase session or auth token — the frontend resolves identity client-side and passes `userId` explicitly into Convex calls (see `src/hooks/use-current-app-user.ts`) rather than via `ctx.auth`. The 27 feature pages under `src/pages/*/page.tsx` (payments, remittance, cards, p2p, groups, gov, savings, invest, treasury, pos, etc.) are almost entirely self-contained: they render hardcoded/mock data and do not call Convex. Only `AppLayout.tsx`, the auth pages above, and `pages/profile/page.tsx` touch `convex/react`. When extending a feature page, follow the existing pattern (local mock data shaped per profile type) unless the task explicitly calls for wiring real backend state — in which case the Convex layer (schema + functions) will need to grow from its current shape.

**Locale-prefixed routing:** every app route is nested under `/:lng` (`src/App.tsx`). `LocaleWrapper` validates the locale segment and redirects; the root `/` redirects to `/${SAVED_OR_DEFAULT_LOCALE}`. Supported locales (`en`, `fr`, `pt`, `es`) and locale-path helpers live in `src/i18n.ts`. The language switcher (`src/components/ui/locale-switcher.tsx`, plus a second copy embedded in Settings → Appearance) is driven generically off `SUPPORTED_LOCALES`/`SUPPORTED_LOCALES_ARRAY` — adding a locale means adding an entry there and a matching `src/locales/<lng>/common.json`, no other code changes needed. Translation JSON lives under `src/locales/<lng>/*.json` and is auto-loaded via `import.meta.glob`; default namespace is `"common"`.

**Provider stack** (`src/components/providers/default.tsx`): `ConvexProvider` (plain — no auth wiring, since Convex identity is resolved client-side rather than via `ctx.auth`) → `QueryClientProvider` → `TooltipProvider` → `ThemeProvider` → `ProfileProvider`.

**Profile simulation is the core "multi-tenant" mechanic.** `src/contexts/profile-context.tsx` defines 13 `ProfileType`s (individual, business, corporate, ngo, government, state_entity, pension_fund, microfinance, cooperative, insurance, investment_fund, development_bank, admin), each with a hardcoded name/balance/currency. The active profile is chosen via the profile switcher and persisted to `localStorage` (`payrus_profile`) — independent of Convex/auth. `AppLayout.tsx` reads `profile.type` to gate navigation and page access (e.g. `isGovProfile`, `isFiProfile`, `isIndividual`), and redirects to `/profile` when no profile is selected (except for a small public-path allowlist). Pages that render profile-adaptive content (e.g. `src/pages/dashboard/page.tsx`) key their mock data off `ProfileType` via `Partial<Record<ProfileType, ...>>` maps.

**Path aliases** (defined in both `vite.config.ts` and `vitest.config.ts`): `@` → `src/`, `@/convex` → `convex/`.

**Domain:** PayRus is a fictional pan-African/CEMAC fintech super-app — content and mock data skew toward the Central African market (XAF/CDF currencies, RCA/CEMAC institutions).
