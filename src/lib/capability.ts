import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client.ts";

// PRS-BR-013 / PRS-PAY-012: a LIVE (or any availability) badge is only ever
// derived from public.capability_registry_current (migration 0004) — never
// hard-coded. Fail-closed: a capability with no registry row is "demo".
export type CapabilityLevel = "live" | "limited" | "pilot" | "sandbox" | "demo" | "disabled";

interface RegistryRow {
  capability_key: string;
  country: string | null;
  currency: string | null;
  profile_type: string | null;
  env: "demo" | "sandbox" | "pilot" | "production";
  status: "disabled" | "sandbox" | "limited" | "enabled";
}

const ENV_RANK: Record<RegistryRow["env"], number> = { production: 3, pilot: 2, sandbox: 1, demo: 0 };

export function useCapabilityRegistry() {
  return useQuery({
    queryKey: ["capability-registry-current"],
    staleTime: 60_000,
    queryFn: async (): Promise<RegistryRow[]> => {
      const { data, error } = await supabase
        .from("capability_registry_current")
        .select("capability_key,country,currency,profile_type,env,status");
      if (error) throw new Error(error.message);
      return (data ?? []) as RegistryRow[];
    },
  });
}

export function levelOf(rows: RegistryRow[] | undefined, key: string, country?: string): CapabilityLevel {
  const match = (rows ?? []).filter(
    (r) => r.capability_key === key && (country ? r.country === country || r.country === null : true),
  );
  if (match.length === 0) return "demo";
  // The highest environment that is actually configured wins ("production" over "pilot" ...).
  const top = match.reduce((a, b) => (ENV_RANK[b.env] > ENV_RANK[a.env] ? b : a));
  if (top.status === "disabled") return "disabled";
  if (top.env === "production") return top.status === "enabled" ? "live" : "limited";
  if (top.env === "pilot") return "pilot";
  return top.status === "limited" ? "limited" : "sandbox";
}

export function useCapabilityLevel(key: string, country?: string): CapabilityLevel {
  const { data } = useCapabilityRegistry();
  return levelOf(data, key, country);
}

/** Regional-indicator flag emoji → ISO 3166-1 alpha-2 (e.g. 🇨🇫 → "CF"). */
export function flagToIso(flag: string): string | undefined {
  const cps = Array.from(flag).map((c) => c.codePointAt(0)!);
  if (cps.length !== 2 || cps.some((c) => c < 0x1f1e6 || c > 0x1f1ff)) return undefined;
  return String.fromCharCode(...cps.map((c) => c - 0x1f1e6 + 65));
}
