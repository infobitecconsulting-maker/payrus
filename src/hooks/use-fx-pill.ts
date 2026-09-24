import { useQuery } from "@tanstack/react-query";
import { getCurrencyForCountry, getLastFxRateUpdate, listCurrenciesByCode } from "@/lib/backend.ts";
import { useCurrentAppUser } from "./use-current-app-user.ts";

export const FX_CURRENCY_STORAGE_KEY = "payrus_fx_currency";

export function getPreferredFxCurrency(): string | null {
  try {
    return localStorage.getItem(FX_CURRENCY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPreferredFxCurrency(code: string | null): void {
  try {
    if (code) localStorage.setItem(FX_CURRENCY_STORAGE_KEY, code);
    else localStorage.removeItem(FX_CURRENCY_STORAGE_KEY);
    window.dispatchEvent(new Event("payrus-fx-currency"));
  } catch {
    /* ignore */
  }
}

export interface FxPair { code: string; rate: number }

// Live FX for the header pill: the user's own currency (Settings choice, else
// the currency of the country they registered in, else the country of the
// browser language when signed out) expressed against USD and EUR.
// Rates are the platform's live table (currencies.rate_per_usd, refreshed by
// the scheduled job; see convex/fxRates.ts), not a client-side fetch.
export function useFxPill() {
  const user = useCurrentAppUser();
  const preferred = getPreferredFxCurrency();
  const region = (typeof navigator !== "undefined" ? navigator.language : "").split("-")[1]?.toUpperCase();

  const regionCurrency = useQuery({
    queryKey: ["countryCurrency", region],
    queryFn: () => getCurrencyForCountry(region!),
    enabled: !preferred && !user?.defaultCurrency && !!region,
    staleTime: Infinity,
  }).data;

  const local = preferred ?? user?.defaultCurrency ?? regionCurrency ?? "USD";
  const codes = Array.from(new Set([local, "USD", "EUR"]));

  const rates = useQuery({
    queryKey: ["fxPillRates", codes.join(",")],
    queryFn: () => listCurrenciesByCode(codes),
    refetchInterval: 5 * 60 * 1000,
  }).data;
  const lastUpdate = useQuery({ queryKey: ["lastFxRateUpdate"], queryFn: getLastFxRateUpdate, refetchInterval: 5 * 60 * 1000 }).data;

  const perUsd = (code: string) => (code === "USD" ? 1 : rates?.find((r) => r.code === code)?.ratePerUsd ?? null);
  const localPerUsd = perUsd(local);

  const pairs: FxPair[] = [];
  if (localPerUsd) {
    for (const base of ["USD", "EUR"]) {
      if (base === local) continue;
      const basePerUsd = perUsd(base);
      if (basePerUsd) pairs.push({ code: base, rate: localPerUsd / basePerUsd });
    }
  }
  return { local, pairs, updatedAt: lastUpdate?.fetchedAt ?? null, ready: !!rates };
}
