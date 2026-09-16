const STORAGE_KEY = "payrus_local_user_id";

/**
 * Identity for a visitor signed in through PayRus's own username/password
 * auth (convex/localAuth.ts) — a real `users` row exists for them, but there
 * is no OIDC token, so this id is how the rest of the app knows who they are.
 * Cleared on logout so the next person on this browser doesn't inherit it.
 */
export function getLocalUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLocalUserId(userId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, userId);
  } catch {
    /* ignore */
  }
}

export function clearLocalUserId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
