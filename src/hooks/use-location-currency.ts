import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getCurrencyForCountry, updateMyLocation } from "@/lib/backend.ts";
import {
  geolocationPermission, getBrowserPosition, getLocationFollow, locationCheckIsDue, markLocationChecked,
  reverseGeocode, setLocationFollow,
} from "@/lib/location.ts";
import { useCurrentAppUser } from "./use-current-app-user.ts";

// While a user is signed in and has allowed it, resolve the country they are
// currently in and store it, so their transaction currency follows the country
// they are in. Runs at most every 6 hours per browser. The first time, the
// browser permission prompt is only triggered from an explicit "Allow" click.
let refreshInFlight = false;

export function useLocationCurrency() {
  const user = useCurrentAppUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation("common");
  const [needsConsent, setNeedsConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (announce: boolean) => {
    if (!user || refreshInFlight) return;
    refreshInFlight = true;
    setBusy(true);
    try {
      const pos = await getBrowserPosition();
      const place = await reverseGeocode(pos.lat, pos.lng);
      markLocationChecked();
      if (!place) {
        if (announce) toast.error(t("location.failed"));
        return;
      }
      if (place.country !== user.locationCountry) {
        const updated = await updateMyLocation(place.country);
        await queryClient.invalidateQueries({ queryKey: ["sessionAppUser"] });
        const currency = updated.locationCurrency ?? (await getCurrencyForCountry(place.country));
        toast.success(t("location.updated", { country: place.country, currency: currency ?? user.defaultCurrency ?? "" }));
      } else if (announce) {
        toast.success(t("location.unchanged", { country: place.country }));
      }
    } catch (e) {
      if (announce) toast.error(t(e instanceof Error && e.message === "denied" ? "location.denied" : "location.failed"));
      if (e instanceof Error && e.message === "denied") setLocationFollow("off");
    } finally {
      refreshInFlight = false;
      setBusy(false);
    }
  }, [user, queryClient, t]);

  useEffect(() => {
    if (!user) {
      setNeedsConsent(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const follow = getLocationFollow();
      if (follow === "off") return;
      const permission = await geolocationPermission();
      if (cancelled || permission === "unsupported" || permission === "denied") return;
      if (follow === "on" || permission === "granted") {
        if (locationCheckIsDue() || !user.locationCountry) void refresh(false);
      } else {
        setNeedsConsent(true);
      }
    })();
    return () => { cancelled = true; };
    // Re-evaluate on user identity, not on every refresh() identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const allow = useCallback(() => {
    setLocationFollow("on");
    setNeedsConsent(false);
    void refresh(true);
  }, [refresh]);

  const decline = useCallback(() => {
    setLocationFollow("off");
    setNeedsConsent(false);
  }, []);

  return { needsConsent, busy, allow, decline, refresh };
}
