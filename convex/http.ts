import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// The only HTTP routes in this app so far. ops-console — a separate app with
// no Convex client of its own — hits these with a bare `fetch` to reuse
// App/'s AI-backed address-suggestion actions (convex/addressSuggestions.ts),
// the same way it already shares App/'s Supabase project rather than
// standing up its own backend. httpAction handlers run in the default
// (non-Node) runtime, so these delegate to the actual Node-runtime actions
// via ctx.runAction rather than calling their Anthropic-SDK logic directly.
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
    if (
      typeof country !== "string" || typeof city !== "string" ||
      typeof province !== "string" || typeof query !== "string"
    ) {
      return json({ suggestions: [] }, 400);
    }
    const result = await ctx.runAction(api.addressSuggestions.suggestStreets, { country, city, province, query });
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
    if (typeof country !== "string" || typeof city !== "string" || typeof province !== "string") {
      return json({ suggestions: [] }, 400);
    }
    const result = await ctx.runAction(api.addressSuggestions.suggestPostalCodes, { country, city, province });
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

export default http;
