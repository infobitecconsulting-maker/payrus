const STORAGE_KEY = "payrus_anon_id";

/**
 * A stable id for this browser, independent of the mock profile-switching
 * mechanic (profile-context.tsx) — so a visitor's linked payment methods
 * and shop orders stay theirs regardless of which profile type they're
 * previewing, without requiring real sign-in.
 */
export function getAnonId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return "anon";
  }
}
