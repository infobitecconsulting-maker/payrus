// Live-location helpers shared by the registration form and the signed-in
// "follow my location" feature. Privacy model:
//  - location is only requested after the user agrees (or has already granted
//    the browser permission) and can be turned off any time in Settings;
//  - coordinates are rounded and reverse-geocoded server-side (Convex
//    /reverseGeocode) and are never stored — only the resulting country code is
//    saved (users.location_country, migration 0028).

export const LOCATION_FOLLOW_KEY = "payrus_location_follow";
const LOCATION_CHECKED_KEY = "payrus_location_checked_at";
const RECHECK_MS = 6 * 60 * 60 * 1000;

export type LocationFollow = "on" | "off" | null;

export function getLocationFollow(): LocationFollow {
  try {
    const v = localStorage.getItem(LOCATION_FOLLOW_KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function setLocationFollow(value: "on" | "off"): void {
  try {
    localStorage.setItem(LOCATION_FOLLOW_KEY, value);
    window.dispatchEvent(new Event("payrus-location-follow"));
  } catch {
    /* ignore */
  }
}

export function locationCheckIsDue(): boolean {
  try {
    const last = Number(localStorage.getItem(LOCATION_CHECKED_KEY) ?? 0);
    return Date.now() - last > RECHECK_MS;
  } catch {
    return true;
  }
}

export function markLocationChecked(): void {
  try {
    localStorage.setItem(LOCATION_CHECKED_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export async function geolocationPermission(): Promise<PermissionState | "unsupported"> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "prompt";
  }
}

export function getBrowserPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable")),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export interface ReverseLocation {
  country: string;
  city?: string;
  province?: string;
  postalCode?: string;
  area?: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseLocation | null> {
  const site = import.meta.env.VITE_CONVEX_SITE_URL as string | undefined;
  if (!site) return null;
  try {
    const res = await fetch(`${site}/reverseGeocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { location: ReverseLocation | null }).location;
  } catch {
    return null;
  }
}
