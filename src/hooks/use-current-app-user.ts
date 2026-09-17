import { useAppUserById } from "./use-backend.ts";
import { getLocalUserId } from "@/lib/local-user.ts";

/**
 * Resolves "who is this visitor" for PayRus's own database-only auth — a
 * real `users` row exists for them, but there is no OIDC token, so this id
 * (set at login/registration, see src/lib/local-user.ts) is how the rest of
 * the app knows who they are. Migrated from Convex's api.users.getById to
 * Supabase's `users` table (supabase/migrations/0001_init_schema.sql) —
 * same "look up by cached local id" shape, just a different backend.
 */
export function useCurrentAppUser() {
  const localUserId = getLocalUserId();
  return useAppUserById(localUserId ?? undefined);
}
