// Reverse geocoding for the live-location features: turns a browser position
// into a country / city / area so the apps can (a) pre-fill the registration
// address and (b) set a signed-in user's transaction currency to the country
// they are currently in. Coordinates are rounded to ~100 m before leaving this
// server and are neither logged nor stored; only the resulting country code is
// ever saved (users.location_country, supabase/migrations/0028).
//
// Uses OpenStreetMap's Nominatim (keyless). Its usage policy requires an
// identifying User-Agent and light volume, which is why this runs server-side
// (a browser cannot set User-Agent) and is only called on explicit consent /
// login, never in a loop.
const OSM_UA = "PayRus/1.0 (support@payrus.app)";

export interface ReverseGeocodeResult {
  country: string;
  city?: string;
  province?: string;
  postalCode?: string;
  area?: string;
}

export async function reverseGeocodePosition(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(round(lat)));
    url.searchParams.set("lon", String(round(lng)));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("zoom", "14");
    url.searchParams.set("addressdetails", "1");
    const res = await fetch(url, { headers: { "User-Agent": OSM_UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address;
    if (!a?.country_code) return null;
    return {
      country: a.country_code.toUpperCase(),
      city: a.city ?? a.town ?? a.village ?? a.municipality ?? a.county,
      province: a.state ?? a.region ?? a.province ?? a.state_district,
      postalCode: a.postcode,
      area: a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district,
    };
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return null;
  }
}
