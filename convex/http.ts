import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { assistEscalation } from "./aiSupportAssist.ts";
import { reverseGeocodePosition } from "./geolocate.ts";

// The only HTTP routes in this app so far. ops-console — a separate app with
// no Convex client of its own — hits these with a bare `fetch` to reuse
// App/'s Google-Maps-backed address-suggestion actions
// (convex/addressSuggestions.ts), the same way it already shares App/'s
// Supabase project rather than standing up its own backend. These delegate
// via ctx.runAction rather than importing the action's logic directly, which
// also happens to be exactly the seam that would matter again if a future
// change ever needed a Node-only package inside one of these actions.
const http = httpRouter();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function preflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

http.route({
  path: "/addressSuggestions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body: unknown = await request.json().catch(() => null);
    const { country, city, province, query } = (body ?? {}) as Record<string, unknown>;
    // Province is optional: country + city is enough to search.
    if (typeof country !== "string" || typeof city !== "string" || typeof query !== "string") {
      return json({ suggestions: [] }, 400);
    }
    const result = await ctx.runAction(api.addressSuggestions.suggestStreets, {
      country, city, query, province: typeof province === "string" && province ? province : undefined,
    });
    return json(result);
  }),
});

http.route({ path: "/addressSuggestions", method: "OPTIONS", handler: httpAction(async () => preflight()) });

http.route({
  path: "/postalCodeSuggestions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body: unknown = await request.json().catch(() => null);
    const { country, city, province } = (body ?? {}) as Record<string, unknown>;
    if (typeof country !== "string" || typeof city !== "string") {
      return json({ suggestions: [] }, 400);
    }
    const result = await ctx.runAction(api.addressSuggestions.suggestPostalCodes, {
      country, city, province: typeof province === "string" && province ? province : undefined,
    });
    return json(result);
  }),
});

http.route({ path: "/postalCodeSuggestions", method: "OPTIONS", handler: httpAction(async () => preflight()) });

// ops-console has no Convex client of its own, so it fetches an upload URL
// here instead of calling the (already doc-type-agnostic)
// generateRegistrationDocUploadUrl mutation directly — same reasoning as the
// two address-suggestion routes above. The client then POSTs the file bytes
// straight to the returned URL (standard Convex upload pattern), never
// through this route.
http.route({
  path: "/kycUploadUrl",
  method: "POST",
  handler: httpAction(async (ctx) => {
    const uploadUrl = await ctx.runMutation(api.userRoles.generateRegistrationDocUploadUrl, {});
    return json({ uploadUrl });
  }),
});

http.route({ path: "/kycUploadUrl", method: "OPTIONS", handler: httpAction(async () => preflight()) });

// On-demand trigger for the same live-FX-rate refresh the cron
// (convex/crons.ts) runs every 6 hours automatically — an admin "Refresh
// rates now" control (in either app) hits this instead of waiting for the
// schedule. Same ops-console-has-no-Convex-client reasoning as the routes
// above.
http.route({
  path: "/refreshFxRates",
  method: "POST",
  handler: httpAction(async (ctx) => {
    const result = await ctx.runAction(api.fxRates.refreshLiveFxRates, {});
    return json(result);
  }),
});

http.route({ path: "/refreshFxRates", method: "OPTIONS", handler: httpAction(async () => preflight()) });

// Reverse geocoding for the live-location features (convex/geolocate.ts):
// POST { lat, lng } -> { location: { country, city?, province?, postalCode?, area? } | null }.
http.route({
  path: "/reverseGeocode",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const body: unknown = await request.json().catch(() => null);
    const { lat, lng } = (body ?? {}) as Record<string, unknown>;
    if (typeof lat !== "number" || typeof lng !== "number") return json({ location: null }, 400);
    return json({ location: await reverseGeocodePosition(lat, lng) });
  }),
});

http.route({ path: "/reverseGeocode", method: "OPTIONS", handler: httpAction(async () => preflight()) });

// AI triage for support escalations (convex/aiSupportAssist.ts). Unlike the
// routes above this one is authenticated: the caller sends their own Supabase
// access token, and every database read/write is made WITH that token, so the
// caller's role permissions apply. 503 {error:"not_configured"} means no
// ANTHROPIC_API_KEY is set — the apps then use the in-database rules triage.
const AI_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

http.route({
  path: "/aiSupportAssist",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const respond = (body: unknown, status: number) =>
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...AI_CORS } });
    const token = /^Bearer (.+)$/.exec(request.headers.get("Authorization") ?? "")?.[1];
    if (!token) return respond({ error: "unauthorized" }, 401);
    const body: unknown = await request.json().catch(() => null);
    const escalationId = (body as Record<string, unknown> | null)?.escalationId;
    if (typeof escalationId !== "string" || !/^[0-9a-f-]{36}$/i.test(escalationId)) return respond({ error: "bad_request" }, 400);
    const result = await assistEscalation(escalationId, token);
    return respond(result.body, result.status);
  }),
});

http.route({ path: "/aiSupportAssist", method: "OPTIONS", handler: httpAction(async () => new Response(null, { status: 204, headers: AI_CORS })) });

export default http;
