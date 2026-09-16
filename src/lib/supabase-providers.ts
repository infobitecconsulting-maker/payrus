import { supabase } from "@/lib/supabase-client.ts";

// Supabase's own OAuth flow (supabase.auth.signInWithOAuth) replaces the old
// hand-rolled Google Identity Services / Facebook SDK popup dance — the
// frontend never sees a provider token at all now, Supabase's backend
// verifies everything server-side. This means the button click just
// redirects the whole page to the provider and back; there is no synchronous
// success/failure to react to here (see src/pages/auth-callback/page.tsx,
// which is where the resulting session actually gets turned into a Convex
// user and routed).
export type OAuthProviderId = "google" | "facebook" | "github" | "apple" | "azure";

// No licensed brand logos are bundled in this app — an initial badge keeps
// each option identifiable without using a trademarked logo (same
// convention as the rest of this auth flow).
export const OAUTH_PROVIDERS: { id: OAuthProviderId; label: string; initial: string; bg: string }[] = [
  { id: "google", label: "Google", initial: "G", bg: "#EA4335" },
  { id: "facebook", label: "Facebook", initial: "f", bg: "#1877F2" },
  { id: "github", label: "GitHub", initial: "H", bg: "#181717" },
  { id: "apple", label: "Apple", initial: "A", bg: "#000000" },
  { id: "azure", label: "Microsoft", initial: "M", bg: "#0078D4" },
];

export function authCallbackUrl(base: string): string {
  return `${window.location.origin}${base}/auth/callback`;
}

// Kicks off the redirect. A provider that isn't enabled in the Supabase
// dashboard doesn't fail here — there's no client-side check, so the browser
// leaves immediately either way and Supabase bounces back to redirectTo with
// an error param on failure (handled by the callback page). This throws only
// for genuinely local problems (e.g. network failure before the redirect
// even starts).
export async function signInWithOAuthProvider(provider: OAuthProviderId, base: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: authCallbackUrl(base) },
  });
  if (error) throw error;
}
