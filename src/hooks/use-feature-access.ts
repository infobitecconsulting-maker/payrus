import { useProfile } from "@/contexts/profile-context.tsx";
import { useProfileFeatures } from "@/hooks/use-backend.ts";

// Whether the signed-in profile may use a feature — the same rule the navigation uses (DB-driven profile_features, admin bypass).
// Anything clickable stays active unless this says the profile or role is restricted.
export function useFeatureAccess() {
  const { profile } = useProfile();
  const features = useProfileFeatures(profile?.type ?? undefined);
  const isAdmin = profile?.type === "admin";
  return {
    // A feature that is not gated (no key) is always open. While the feature list loads, gated items stay closed (fail-closed, like the menu).
    can: (key?: string) => !key || isAdmin || (features ?? []).includes(key),
    loading: !!profile && !isAdmin && features === undefined,
  };
}
