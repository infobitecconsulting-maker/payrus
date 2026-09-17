import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

// First scheduled job in this app. Runs the live FX rate refresh
// (convex/fxRates.ts) every 6 hours — the provider's own data only changes
// once daily, and its terms say hourly polling is safe, so 6-hourly is a
// comfortable, low-traffic middle ground rather than either extreme.
const crons = cronJobs();

crons.interval(
  "refresh live FX rates",
  { hours: 6 },
  api.fxRates.refreshLiveFxRates,
);

export default crons;
