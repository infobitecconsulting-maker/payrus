import { AuthConfig } from "convex/server";

// Convex auth is not used by this app: identity comes from the Supabase session and no
// function reads ctx.auth. The former OIDC provider needed HERCULES_OIDC_* variables that
// are not set on this deployment, which blocked every deploy, so no provider is registered.
export default { providers: [] } satisfies AuthConfig;
