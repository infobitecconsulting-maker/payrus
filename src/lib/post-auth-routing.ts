import type { NavigateFunction } from "react-router-dom";
import { getDefaultProfile, type ProfileData, type ProfileType } from "@/contexts/profile-context.tsx";

export interface ExistingRole {
  role: string;
  complete: boolean;
  kind?: "individual" | "organisation";
  orgName?: string;
}

// The generic per-role templates in profile-context.tsx (e.g. "Jean Dupont"
// for personal) are placeholders for the anonymous preview path — a real
// account should always show its own name, and a real organisation role its
// own registered orgName, never the demo template.
export function applyRealName(profile: ProfileData, role: ExistingRole, displayName?: string) {
  if (role.kind === "organisation" && role.orgName) {
    profile.name = role.orgName;
  } else if (displayName) {
    profile.name = displayName;
  }
}

/**
 * Shared "where does this identity land?" logic for both login
 * (signin/page.tsx) and registration (register/page.tsx) — no roles yet
 * goes to onboarding, one role activates it directly, several roles goes to
 * the role picker instead of guessing. `displayName` is the account's real
 * name, applied to the resulting profile instead of the generic template.
 */
export function routeAfterIdentity(params: {
  userId: string;
  roles: ExistingRole[];
  navigate: NavigateFunction;
  base: string;
  setProfile: (profile: ProfileData) => void;
  displayName?: string;
}) {
  const { userId, roles, navigate, base, setProfile, displayName } = params;
  if (roles.length === 0) {
    // Still pass the identity along — without it, profile/page.tsx falls
    // back to its ctx.auth-derived "anonymous preview" path, which silently
    // fails to persist anything for an identity that has no OIDC token (the
    // database-only email sign-in path).
    navigate(`${base}/profile`, { state: { existingUserId: userId, existingRoles: [] } });
    return;
  }
  if (roles.length === 1) {
    const profile = getDefaultProfile(roles[0].role as ProfileType);
    applyRealName(profile, roles[0], displayName);
    setProfile(profile);
    navigate(base, { replace: true });
    return;
  }
  navigate(`${base}/profile`, { state: { existingUserId: userId, existingRoles: roles } });
}
