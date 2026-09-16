import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { getLocalUserId } from "@/lib/local-user.ts";

/**
 * Resolves "who is this visitor" for PayRus's own database-only auth
 * (convex/localAuth.ts) — there is no OIDC token to derive identity from, so
 * the local user id (set at login/registration, see src/lib/local-user.ts)
 * is looked up directly by id.
 */
export function useCurrentAppUser() {
  const localUserId = getLocalUserId();
  return useQuery(
    api.users.getById,
    localUserId ? { userId: localUserId as Id<"users"> } : "skip",
  );
}
