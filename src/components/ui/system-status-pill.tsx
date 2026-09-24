import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.ts";
import { useSystemStatus, type SystemState } from "@/hooks/use-system-status.ts";

const DOT: Record<SystemState, string> = {
  checking: "bg-muted-foreground",
  operational: "bg-primary animate-pulse",
  degraded: "bg-amber-500",
  down: "bg-destructive",
};

/** Live backend health (see use-system-status.ts) — replaces the old static "Systems operational" text. */
export default function SystemStatusPill({ className, label }: { className?: string; label?: "short" | "long" }) {
  const { t } = useTranslation("common");
  const { state, latencyMs } = useSystemStatus();
  const text =
    state === "operational" ? t(label === "long" ? "apiHub.liveStatus" : "nav.systems") : t(`nav.systemsState.${state}`);
  return (
    <div
      className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border", state === "down" ? "bg-destructive/5 border-destructive/30" : state === "degraded" ? "bg-amber-500/5 border-amber-500/30" : "bg-primary/5 border-primary/20", className)}
      title={latencyMs !== undefined ? `${latencyMs} ms` : undefined}
      role="status"
    >
      <div className={cn("w-2 h-2 rounded-full", DOT[state])} />
      <span className="text-xs font-medium text-foreground">{text}</span>
    </div>
  );
}
