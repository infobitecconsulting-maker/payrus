import { useQuery } from "@tanstack/react-query";

// PRS-OPS-010: the status indicator must reflect real monitoring, never a static
// "Systems operational". This probes the two backend services every screen
// depends on (Postgres REST API + Auth) from the client and grades the result.
// It is a real measurement, but only a client-side view — the authoritative
// status page/monitoring lives with ops; this never claims more than it measured.
export type SystemState = "checking" | "operational" | "degraded" | "down";
export interface SystemStatus { state: SystemState; latencyMs?: number; checkedAt?: number }

const DEGRADED_MS = 2000;

async function probe(): Promise<SystemStatus> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return { state: "down", checkedAt: Date.now() };
  const headers = { apikey: key };
  const started = performance.now();
  try {
    const [rest, auth] = await Promise.all([
      fetch(`${url}/rest/v1/currencies?select=code&limit=1`, { headers, cache: "no-store" }),
      fetch(`${url}/auth/v1/health`, { headers, cache: "no-store" }),
    ]);
    const latencyMs = Math.round(performance.now() - started);
    if (rest.status >= 500 || auth.status >= 500) return { state: "down", latencyMs, checkedAt: Date.now() };
    if (!rest.ok || !auth.ok || latencyMs > DEGRADED_MS) return { state: "degraded", latencyMs, checkedAt: Date.now() };
    return { state: "operational", latencyMs, checkedAt: Date.now() };
  } catch {
    return { state: "down", checkedAt: Date.now() };
  }
}

export function useSystemStatus(): SystemStatus {
  const { data } = useQuery({ queryKey: ["system-status"], queryFn: probe, refetchInterval: 60_000, staleTime: 30_000, retry: false });
  return data ?? { state: "checking" };
}
