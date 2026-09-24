import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.ts";
import { useCapabilityLevel, type CapabilityLevel } from "@/lib/capability.ts";

const STYLE: Record<CapabilityLevel, string> = {
  live: "bg-primary/15 border-primary/30 text-primary",
  limited: "bg-amber-50 border-amber-200 text-amber-700",
  pilot: "bg-blue-50 border-blue-200 text-blue-700",
  sandbox: "bg-muted/60 border-border text-muted-foreground",
  demo: "bg-muted/60 border-border text-muted-foreground",
  disabled: "bg-destructive/10 border-destructive/30 text-destructive",
};

/** Availability badge sourced from the capability registry (PRS-BR-013) — see lib/capability.ts. */
export default function CapabilityBadge({ capability, country, className }: { capability: string; country?: string; className?: string }) {
  const { t } = useTranslation("common");
  const level = useCapabilityLevel(capability, country);
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", STYLE[level], className)} title={capability}>
      {t(`capability.${level}`)}
    </span>
  );
}
