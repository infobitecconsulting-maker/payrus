# Regression guard and spec traceability

Baseline: *PayRus Requirements Specification v2.0* (16 Sep 2026) and the live
prototype at payrus.cards (routes: Dashboard, Pay, Wallet, Transfer, History,
Cards, Investor Deck, Admin; 13 profile types on the profile picker).

## Run before every merge

```bash
pnpm lint && pnpm test && pnpm build      # App/
pnpm regression                           # App/ — covers App AND ops-console
(cd ../ops-console && npx tsc -b && npx vite build)
```

`pnpm regression` (`scripts/regression-check.mjs`, read-only, anon key) fails if:

| Guard | What it protects |
|---|---|
| Route parity | every prototype route + spec route still exists in `App/src/App.tsx` |
| Console tab keys | the 8 `TabKey`s still exist in `ops-console/src/types.ts` |
| Tables | every `.from("x")` in App/ or ops-console/ exists in the one shared Supabase project |
| RPCs | every `.rpc("x")` in either app is defined in `supabase/migrations` |
| RLS | anon cannot read users, roles, wallets, transfers, cards, notifications, addresses, api_keys |
| Visibility invariants | each console role keeps overview+transactions; each profile keeps its core features; only `admin` has `admin_panel` (invariants, not a snapshot, so supadmin edits are not flagged) |
| Cross-platform roles | every `role_definitions` slug resolves to App features (or admin-tier staff access) AND a console role with tabs |

## Spec coverage (evidence: code + live DB, 2026-09-24)

| Area | Requirement | Status |
|---|---|---|
| IAM | PRS-IAM-008 Supabase Auth behind canonical id | Done (both apps, same session model) |
| IAM | PRS-IAM-002 profile selection, server-side entitlements | Done (`profile_features`, `console_role_tabs`, `role_definitions`, RLS) |
| IAM | PRS-IAM-009/010 SSO, social, magic link, phone OTP | Coded; SAML/SMS need paid plan / Twilio |
| IAM | PRS-IAM-003 MFA / step-up, PRS-IAM-005 device binding | **Gap** — no MFA/passkey/step-up in App or console |
| Wallet/Transfers | WAL-001..003, TRF-001..003 | Done on real data (wallets, quotes, transfers, idempotency) |
| Ops | PRS-OPS-003/006/009 queues, audit, four-eyes | Done (audit log, escalations, staff roles/permission matrix) |
| Ops | PRS-OPS-010 real status page | **Gap** — static "Systems operational" strings (`nav.systems`, `apiHub.liveStatus`) |
| UX | PRS-UX-001 EN+FR (+PT/ES) | Done |
| UX | PRS-UX-006 investor content separated from customer nav | **Gap** — Investor Deck is in main nav |
| Cards/Merchant/Business/Agent | PAY-*, BIZ-*, AGT-* | Pages wired to real data; partner-gated capabilities remain simulated |
| Capability registry | PRS-BR-013 badges from registry | **Partial** — registry table exists; UI badges not yet sourced from it |

Gaps are recorded, not fixed here: several (MFA, real status page, registry-driven
badges) need product decisions or partner input. None regress existing behaviour.
