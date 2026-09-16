import { ConvexProvider as ConvexReactProvider, ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL ?? "http://localhost:3000";
const convex = new ConvexReactClient(convexUrl);

// PayRus's own database-only auth (convex/localAuth.ts) never issues an OIDC
// token, so Convex functions are called unauthenticated and identity is
// resolved by passing a userId explicitly (see
// src/hooks/use-current-app-user.ts) rather than via ctx.auth.
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexReactProvider client={convex}>
      {children}
    </ConvexReactProvider>
  );
}
