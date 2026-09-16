import { createClient } from "@supabase/supabase-js";

// Supabase Auth is PayRus's identity layer — see convex/supabaseAuth.ts for
// how a Supabase session maps to a Convex `users` row. Convex still owns
// every other table. The default client already persists sessions to
// localStorage and auto-refreshes on its own; @supabase/ssr's cookie
// handling is for server-rendered apps and isn't needed here (this is a
// client-only Vite SPA).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// True once a real Supabase project is configured — callers should check
// this (or catch the auth error) rather than assume `supabase` is reachable,
// since the placeholder URL/key below only exists so createClient doesn't
// throw before real credentials are set.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);
