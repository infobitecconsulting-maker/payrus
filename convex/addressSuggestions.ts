import { v } from "convex/values";
import { action } from "./_generated/server";

// Address autosuggest for the registration form (src/pages/register/page.tsx,
// and ops-console's mirror of it via the HTTP routes in convex/http.ts) — no
// licensed street/postal database is wired into this demo (see
// addressRegister.ts's own note on why one isn't fabricated wholesale as
// static data), so this calls Google Maps Platform's real address APIs
// instead. Two independent lookups:
//   - suggestPostalCodes: fires once country+city+province are all chosen,
//     before the user types anything. Uses the Geocoding API.
//   - suggestStreets: fires as the user types in the street field. Uses the
//     Places Autocomplete API.
// Needs GOOGLE_MAPS_API_KEY set via `npx convex env set GOOGLE_MAPS_API_KEY
// ...` (a key with "Places API" and "Geocoding API" enabled on a Google Cloud
// project — both are covered by Google's standard monthly free credit for
// normal demo-level volume, but the project still needs billing enabled to
// activate that credit) — an unset key degrades to an empty suggestion list
// rather than throwing, same convention the previous Anthropic-backed version
// used, and the same convention isSupabaseConfigured uses on the frontend.
// Plain `fetch` against Google's REST endpoints needs no Node-only package,
// so unlike the previous implementation this file does NOT need "use node".

function getApiKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY ?? null;
}

export async function generateStreetSuggestions(params: {
  country: string;
  city: string;
  province: string;
  query: string;
}): Promise<string[]> {
  const apiKey = getApiKey();
  const query = params.query.trim();
  if (!apiKey || query.length < 2) return [];

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    // Folding city+province into the input text (rather than a location
    // bias) is the simplest reliable way to steer the Legacy Autocomplete
    // API toward the right place when only a place name — not a lat/lng —
    // is known, which is all the registration form has at this point.
    url.searchParams.set("input", `${query}, ${params.city}, ${params.province}`);
    url.searchParams.set("types", "address");
    url.searchParams.set("components", `country:${params.country.toLowerCase()}`);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      predictions?: { structured_formatting?: { main_text?: string }; description?: string }[];
    };
    if (data.status !== "OK") {
      if (data.status !== "ZERO_RESULTS") console.error("Places Autocomplete request failed:", data.status);
      return [];
    }

    const names = (data.predictions ?? [])
      .map((p) => p.structured_formatting?.main_text ?? p.description?.split(",")[0])
      .filter((name): name is string => !!name);
    return Array.from(new Set(names)).slice(0, 6);
  } catch (err) {
    console.error("Street suggestion request failed:", err);
    return [];
  }
}

export async function generatePostalCodeSuggestions(params: {
  country: string;
  city: string;
  province: string;
}): Promise<{ postalCode: string; area?: string }[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", `${params.city}, ${params.province}, ${params.country}`);
    url.searchParams.set("components", `country:${params.country.toLowerCase()}`);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      results?: { address_components: { long_name: string; types: string[] }[] }[];
    };
    if (data.status !== "OK") {
      if (data.status !== "ZERO_RESULTS") console.error("Geocoding request failed:", data.status);
      return [];
    }

    // A bare "city, province, country" geocode often resolves to a single
    // locality-level result with no postal_code component at all — real
    // postal codes are frequently assigned per-street or per-district, not
    // per-city, especially for larger multi-zone cities (this genuinely has
    // no answer for e.g. Paris as a whole, only for a specific arrondissement
    // or street within it). That's a real property of postal systems, not a
    // bug: this returns whatever Google actually knows, which can honestly be
    // an empty list — the form already treats postal code as optional.
    const seen = new Map<string, string | undefined>();
    for (const result of data.results ?? []) {
      const components = result.address_components;
      const postalCode = components.find((c) => c.types.includes("postal_code"))?.long_name;
      if (!postalCode || seen.has(postalCode)) continue;
      const area = components.find(
        (c) =>
          c.types.includes("sublocality") ||
          c.types.includes("sublocality_level_1") ||
          c.types.includes("neighborhood"),
      )?.long_name;
      seen.set(postalCode, area);
    }
    return Array.from(seen.entries())
      .map(([postalCode, area]) => ({ postalCode, area }))
      .slice(0, 8);
  } catch (err) {
    console.error("Postal code suggestion request failed:", err);
    return [];
  }
}

// Called directly by the frontend (useAction) and, via ctx.runAction, by the
// plain HTTP routes in convex/http.ts, which is what lets ops-console (no
// Convex client of its own) reuse this logic too.
export const suggestStreets = action({
  args: { country: v.string(), city: v.string(), province: v.string(), query: v.string() },
  handler: async (_ctx, args) => ({ suggestions: await generateStreetSuggestions(args) }),
});

export const suggestPostalCodes = action({
  args: { country: v.string(), city: v.string(), province: v.string() },
  handler: async (_ctx, args) => ({ suggestions: await generatePostalCodeSuggestions(args) }),
});
