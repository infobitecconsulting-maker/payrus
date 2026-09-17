import { action } from "./_generated/server";

// Automated live FX rate lookups. Fetches from open.er-api.com — genuinely
// free (no signup, no API key, no billing account, unlike e.g. Google Maps
// Platform), covers 166 currencies including every one PayRus actually
// needs (XAF/XOF/CDF/AOA/NGN/GHS/RWF/ZAR/ETB/KES alongside USD/EUR/GBP/etc
// — verified directly against the live endpoint, not assumed from docs).
// Updates once daily upstream; safe to poll hourly per the provider's own
// terms, so the cron below (see convex/crons.ts) checks every 6 hours,
// comfortably under that limit while staying reasonably fresh. Attribution
// is required by the provider's terms: "Rates By Exchange Rate API"
// (https://www.exchangerate-api.com) — shown in Settings/About, see
// App/src/pages/settings/page.tsx.
//
// This writes into Supabase (`public.currencies.rate_per_usd`), not Convex
// — Supabase is this project's actual source of truth for currency/FX data
// (supabase/migrations/0001, 0013). Convex has no supabase-js dependency and
// doesn't need one here: a bare `fetch` against Supabase's PostgREST RPC
// endpoint is enough for a single bulk call. The URL + anon key below are
// the exact same public, non-secret values already shipped in every
// frontend bundle (App/.env's VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) —
// hardcoding them here is no less secure than their existing exposure in
// client-side JS; nothing sensitive is ever handled in this file.
const SUPABASE_URL = "https://iqbsxyltixztmysqsbig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_F5j6JBm34JwQKJjbouvEBg_-KyCxYWv";
const PROVIDER_URL = "https://open.er-api.com/v6/latest/USD";
const PROVIDER_SOURCE = "open.er-api.com";

interface FxRateRefreshResult {
  updated: number;
  source: string;
  error?: string;
}

export async function fetchAndApplyLiveRates(): Promise<FxRateRefreshResult> {
  const providerRes = await fetch(PROVIDER_URL);
  if (!providerRes.ok) {
    throw new Error(`FX rate provider request failed: ${providerRes.status}`);
  }
  const data = (await providerRes.json()) as { result?: string; rates?: Record<string, number> };
  if (data.result !== "success" || !data.rates) {
    throw new Error(`FX rate provider returned an error result: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/apply_live_fx_rates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_rates: data.rates, p_source: PROVIDER_SOURCE }),
  });
  if (!rpcRes.ok) {
    throw new Error(`apply_live_fx_rates RPC failed: ${rpcRes.status} ${await rpcRes.text()}`);
  }
  const updated = (await rpcRes.json()) as number;
  return { updated, source: PROVIDER_SOURCE };
}

// Called by the cron (convex/crons.ts) and, via ctx.runAction, by the
// on-demand HTTP route in convex/http.ts — same "backend action + thin HTTP
// wrapper" shape as addressSuggestions.ts, so ops-console (and an admin
// "Refresh rates now" button in either app) can trigger a fetch on demand
// too, not just on the schedule.
// Reading "last updated" back doesn't need a Convex round trip — both
// frontends already have a direct Supabase client of their own and can
// query fx_rate_updates themselves (App/src/lib/backend.ts's
// getLastFxRateUpdate). This action is only for the part that genuinely
// needs a backend: fetching from an external provider and writing the
// result.
export const refreshLiveFxRates = action({
  args: {},
  handler: async (): Promise<FxRateRefreshResult> => {
    try {
      return await fetchAndApplyLiveRates();
    } catch (err) {
      console.error("Live FX rate refresh failed:", err);
      return { updated: 0, source: PROVIDER_SOURCE, error: String(err) };
    }
  },
});
