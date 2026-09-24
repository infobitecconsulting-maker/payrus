import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFxPill } from "@/hooks/use-fx-pill.ts";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: n >= 100 ? 2 : 4 });

export default function FxRatePill() {
  const { t } = useTranslation("common");
  const [, force] = useState(0);
  const { local, pairs, updatedAt, ready } = useFxPill();

  useEffect(() => {
    const onChange = () => force((n) => n + 1);
    window.addEventListener("payrus-fx-currency", onChange);
    return () => window.removeEventListener("payrus-fx-currency", onChange);
  }, []);

  const title = updatedAt ? t("fx.pill.title", { time: new Date(updatedAt).toLocaleString() }) : t("fx.pill.titleNoTime");

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/25"
      title={title}
      aria-label={title}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
      <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">{t("fx.pill.live")}</span>
      {!ready && <span className="text-[10px] text-amber-600 dark:text-amber-300/70">…</span>}
      {ready && pairs.length === 0 && <span className="text-[10px] text-amber-600 dark:text-amber-300/70">{t("fx.pill.unavailable")}</span>}
      {pairs.map((p) => (
        <span key={p.code} className="text-[10px] font-mono text-amber-700 dark:text-amber-300 whitespace-nowrap">
          1 {p.code} = {fmt(p.rate)} {local}
        </span>
      ))}
    </div>
  );
}
