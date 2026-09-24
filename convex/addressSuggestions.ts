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

// Keyless fallback used when GOOGLE_MAPS_API_KEY is unset: Photon (komoot's
// OpenStreetMap search — free, no key, supports prefix/partial matching that
// Nominatim does not). Fair-use volume only; set the Google key for production.
type PhotonProps = {
  name?: string;
  street?: string;
  postcode?: string;
  district?: string;
  locality?: string;
  countrycode?: string;
};

async function photonSearch(q: string, country: string, highwayOnly: boolean): Promise<PhotonProps[]> {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "15");
    if (highwayOnly) url.searchParams.set("osm_tag", "highway");
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: { properties: PhotonProps }[] };
    return (data.features ?? [])
      .map((f) => f.properties)
      .filter((p) => !p.countrycode || p.countrycode.toLowerCase() === country.toLowerCase());
  } catch (err) {
    console.error("Photon address request failed:", err);
    return [];
  }
}

async function osmStreets(country: string, city: string, province: string | undefined, query: string): Promise<string[]> {
  const hits = await photonSearch(`${query} ${city} ${province ?? ""}`.trim(), country, true);
  const names = hits.map((h) => h.name ?? h.street).filter((n): n is string => !!n);
  return Array.from(new Set(names)).slice(0, 6);
}

async function osmPostalCodes(
  country: string,
  city: string,
  province: string | undefined,
): Promise<{ postalCode: string; area?: string }[]> {
  const hits = await photonSearch(`${city} ${province ?? ""}`.trim(), country, false);
  const seen = new Map<string, string | undefined>();
  for (const h of hits) {
    if (h.postcode && !seen.has(h.postcode)) seen.set(h.postcode, h.district ?? h.locality);
  }
  return Array.from(seen.entries())
    .map(([postalCode, area]) => ({ postalCode, area }))
    .slice(0, 8);
}

// ---------------------------------------------------------------------------
// Live OpenStreetMap lookup of a city's postal codes and areas (keyless).
// Nominatim resolves the city to an OSM area, then Overpass lists the
// postal-code boundaries, addr:postcode values and named suburbs /
// quarters / neighbourhoods inside it. Both services require an identifying
// User-Agent (their usage policy) and are shared public infrastructure:
// requests are small, time-boxed and retried once, and any failure degrades
// to the older Photon search below rather than throwing. Countries that have
// no postal-code system (e.g. much of Central Africa) return area names only
// (postalCode ""), which the forms treat as "pick an area".
// ---------------------------------------------------------------------------
const OSM_UA = "PayRus/1.0 (support@payrus.app)";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

interface OverpassElement { tags?: Record<string, string> }

async function overpass(query: string): Promise<OverpassElement[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "User-Agent": OSM_UA, Accept: "*/*", "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(22000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { elements?: OverpassElement[] };
      return data.elements ?? [];
    } catch {
      /* timeout / overloaded server — retry once */
    }
  }
  return [];
}

async function osmCityAnchor(country: string, city: string, province?: string): Promise<{ scope: string; target: string } | null> {
  const attempts = province && province !== city ? [`${city}, ${province}`, city] : [city];
  for (const q of attempts) {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("countrycodes", country.toLowerCase());
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      const res = await fetch(url, { headers: { "User-Agent": OSM_UA }, signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const hit = ((await res.json()) as { osm_type?: string; osm_id?: number; lat?: string; lon?: string }[])[0];
      if (!hit) continue;
      if (hit.osm_type === "relation" && hit.osm_id) return { scope: `area(${3600000000 + hit.osm_id})->.a;`, target: "(area.a)" };
      if (hit.osm_type === "way" && hit.osm_id) return { scope: `area(${2400000000 + hit.osm_id})->.a;`, target: "(area.a)" };
      if (hit.lat && hit.lon) return { scope: "", target: `(around:6000,${hit.lat},${hit.lon})` };
    } catch {
      /* try the next phrasing */
    }
  }
  return null;
}

// Real postal-code formats (ISO country -> pattern) for countries that have a
// postal system. Live map data is noisy — in countries with NO postal codes
// (much of Central Africa, for one) people tag junk like "0000" or "123" — so
// a code is only offered if it matches its country's real format; countries
// missing from this table get neighbourhood/area suggestions only.
const POSTAL_FORMATS: Record<string, RegExp> = {
  AD: /^AD\d{3}$/, AR: /^([A-Za-z]\d{4}[A-Za-z]{3}|\d{4})$/, AT: /^\d{4}$/, AU: /^\d{4}$/, BD: /^\d{4}$/, BE: /^\d{4}$/, BG: /^\d{4}$/,
  BR: /^\d{5}-?\d{3}$/, CA: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, CH: /^\d{4}$/, CL: /^\d{7}$/, CN: /^\d{6}$/, CO: /^\d{6}$/, CZ: /^\d{3} ?\d{2}$/,
  DE: /^\d{5}$/, DK: /^\d{4}$/, DZ: /^\d{5}$/, EE: /^\d{5}$/, EG: /^\d{5}$/, ES: /^\d{5}$/, ET: /^\d{4}$/, FI: /^\d{5}$/, FR: /^\d{5}$/,
  GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/, GR: /^\d{3} ?\d{2}$/, HR: /^\d{5}$/, HU: /^\d{4}$/, ID: /^\d{5}$/, IE: /^[A-Za-z]\d{2} ?[A-Za-z\d]{4}$/,
  IN: /^\d{6}$/, IT: /^\d{5}$/, JP: /^\d{3}-?\d{4}$/, KE: /^\d{5}$/, KR: /^\d{5}$/, LK: /^\d{5}$/, LT: /^(LT-)?\d{5}$/, LU: /^\d{4}$/, LV: /^(LV-)?\d{4}$/,
  MA: /^\d{5}$/, MG: /^\d{3}$/, MX: /^\d{5}$/, MY: /^\d{5}$/, NG: /^\d{6}$/, NL: /^\d{4} ?[A-Za-z]{2}$/, NO: /^\d{4}$/, NZ: /^\d{4}$/, PE: /^\d{5}$/,
  PH: /^\d{4}$/, PK: /^\d{5}$/, PL: /^\d{2}-\d{3}$/, PT: /^\d{4}-\d{3}$/, RO: /^\d{6}$/, RS: /^\d{5,6}$/, RU: /^\d{6}$/, SE: /^\d{3} ?\d{2}$/, SG: /^\d{6}$/,
  SI: /^\d{4}$/, SK: /^\d{3} ?\d{2}$/, SN: /^\d{5}$/, TH: /^\d{5}$/, TN: /^\d{4}$/, TR: /^\d{5}$/, UA: /^\d{5}$/, US: /^\d{5}(-\d{4})?$/, ZA: /^\d{4}$/,
};

function validPostalCode(country: string, code: string): boolean {
  const re = POSTAL_FORMATS[country.toUpperCase()];
  return !!re && re.test(code.trim());
}

async function osmPostalCodesAndAreas(country: string, city: string, province?: string): Promise<{ postalCode: string; area?: string }[]> {
  const anchor = await osmCityAnchor(country, city, province);
  if (!anchor) return [];
  const { scope, target } = anchor;
  const hasPostalSystem = country.toUpperCase() in POSTAL_FORMATS;

  // Both lookups run in parallel (they are independent) to keep the wait short.
  const [elements, sample] = await Promise.all([
    overpass(`[out:json][timeout:18];${scope}(relation["boundary"="postal_code"]${target};nwr["place"~"^(suburb|quarter|neighbourhood)$"]${target};);out tags 80;`),
    hasPostalSystem ? overpass(`[out:json][timeout:18];${scope}nwr["addr:postcode"]${target};out tags 150;`) : Promise.resolve([] as OverpassElement[]),
  ]);

  const codes = new Map<string, string | undefined>();
  const areas: string[] = [];
  for (const el of elements) {
    const t = el.tags ?? {};
    const code = t.postal_code ?? (t.boundary === "postal_code" ? t.ref : undefined) ?? t["addr:postcode"];
    if (code && validPostalCode(country, code) && !codes.has(code)) codes.set(code, t["addr:suburb"] ?? undefined);
    if (t.place && t.name && !areas.includes(t.name)) areas.push(t.name);
  }

  // Postal-code boundaries are rarely mapped everywhere: also count the
  // addr:postcode values found on addresses inside the city.
  const freq = new Map<string, { n: number; area?: string }>();
  for (const el of sample) {
    const t = el.tags ?? {};
    const code = t["addr:postcode"];
    if (!code || !validPostalCode(country, code)) continue;
    const cur = freq.get(code) ?? { n: 0, area: t["addr:suburb"] };
    cur.n += 1;
    freq.set(code, cur);
  }
  for (const [code, v] of Array.from(freq.entries()).sort((x, y) => y[1].n - x[1].n).slice(0, 10)) {
    if (!codes.has(code)) codes.set(code, v.area);
  }

  const out: { postalCode: string; area?: string }[] = Array.from(codes.entries())
    .sort((x, y) => x[0].localeCompare(y[0], undefined, { numeric: true }))
    .map(([postalCode, area]) => ({ postalCode, area }));
  for (const area of areas) {
    if (!out.some((o) => o.area === area)) out.push({ postalCode: "", area });
  }
  return out.slice(0, 14);
}

export async function generateStreetSuggestions(params: {
  country: string;
  city: string;
  province?: string;
  query: string;
}): Promise<string[]> {
  const apiKey = getApiKey();
  const query = params.query.trim();
  if (query.length < 2) return [];
  if (!apiKey) return osmStreets(params.country, params.city, params.province, query);

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    // Folding city+province into the input text (rather than a location
    // bias) is the simplest reliable way to steer the Legacy Autocomplete
    // API toward the right place when only a place name — not a lat/lng —
    // is known, which is all the registration form has at this point.
    url.searchParams.set("input", [query, params.city, params.province].filter(Boolean).join(", "));
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
  province?: string;
}): Promise<{ postalCode: string; area?: string }[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Keyless path: live OpenStreetMap postal codes + areas first, then the
    // older Photon search as a last resort.
    const live = await osmPostalCodesAndAreas(params.country, params.city, params.province);
    if (live.length > 0) return live;
    return osmPostalCodes(params.country, params.city, params.province);
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", [params.city, params.province, params.country].filter(Boolean).join(", "));
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
  args: { country: v.string(), city: v.string(), province: v.optional(v.string()), query: v.string() },
  handler: async (_ctx, args) => ({ suggestions: await generateStreetSuggestions(args) }),
});

export const suggestPostalCodes = action({
  args: { country: v.string(), city: v.string(), province: v.optional(v.string()) },
  handler: async (_ctx, args) => ({ suggestions: await generatePostalCodeSuggestions(args) }),
});
