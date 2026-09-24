import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { useLocationCurrency } from "@/hooks/use-location-currency.ts";

// Asked once per browser, only for signed-in users. "Allow" is the click that
// triggers the browser's own location prompt; "Not now" is remembered and the
// choice can be reversed in Settings > Appearance.
export default function LocationConsentBanner() {
  const { t } = useTranslation("common");
  const { needsConsent, busy, allow, decline } = useLocationCurrency();
  if (!needsConsent) return null;
  return (
    <div role="region" aria-label={t("location.bannerTitle")} className="flex items-center gap-3 flex-wrap px-4 py-2.5 border-b border-primary/20 bg-primary/5">
      <MapPin size={16} className="text-primary shrink-0" />
      <div className="flex-1 min-w-[200px]">
        <div className="text-xs font-semibold text-foreground">{t("location.bannerTitle")}</div>
        <div className="text-[11px] text-muted-foreground">{t("location.bannerBody")}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={allow} disabled={busy} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer disabled:opacity-60">{t("location.allow")}</button>
        <button onClick={decline} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted-foreground cursor-pointer">{t("location.notNow")}</button>
      </div>
    </div>
  );
}
