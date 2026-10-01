import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

// Scheduled jobs.
const crons = cronJobs();

// Live FX rate refresh (convex/fxRates.ts) every 6 hours — the provider's own
// data only changes once daily, and its terms say hourly polling is safe, so
// 6-hourly is a comfortable, low-traffic middle ground rather than either extreme.
crons.interval(
  "refresh live FX rates",
  { hours: 6 },
  api.fxRates.refreshLiveFxRates,
);

// Webhook delivery worker (convex/webhookDispatcher.ts): drains the outbox that
// the institutional-module triggers fill (supabase/migrations/0058).
crons.interval(
  "deliver webhooks",
  { minutes: 1 },
  internal.webhookDispatcher.dispatchWebhooks,
);

export default crons;
