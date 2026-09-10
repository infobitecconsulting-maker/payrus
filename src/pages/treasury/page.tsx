import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, ArrowLeftRight, Clock, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/ui/page-header.tsx";
import { useProfile } from "@/contexts/profile-context.tsx";

const WEEKLY_COLLECTIONS = [
  { day: "M", amount: 40 }, { day: "T", amount: 62 }, { day: "W", amount: 55 },
  { day: "T", amount: 78 }, { day: "F", amount: 96 }, { day: "S", amount: 71 },
  { day: "S", amount: 84 },
];

export default function Treasury() {
  const { t } = useTranslation("common");
  const { profile } = useProfile();
  const currency = profile?.currency ?? "EUR";

  const kpis = [
    { key: "collected", icon: TrendingUp, value: "62 800", suffix: currency },
    { key: "volume", icon: ArrowLeftRight, value: "1 284", suffix: "" },
    { key: "avgSettle", icon: Clock, value: "18", suffix: "h" },
    { key: "failRate", icon: AlertTriangle, value: "0.4", suffix: "%" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader title={t("treasury.title")} subtitle={t("treasury.intro")} className="mb-5" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpis.map(k => (
          <div key={k.key} className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <k.icon size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">{t(`treasury.${k.key}`)}</span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {k.value}<span className="text-xs font-normal text-muted-foreground ml-1">{k.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card border border-border p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t("treasury.chartTitle")}</h2>
          <span className="text-[10px] text-muted-foreground">{t("treasury.last7days")}</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={WEEKLY_COLLECTIONS} barGap={4}>
            <XAxis dataKey="day" tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip cursor={{ fill: "oklch(0.48 0.14 155 / 0.08)" }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="amount" fill="oklch(0.48 0.14 155)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-4">
        <p className="text-xs text-muted-foreground">{t("treasury.settlementNote")}</p>
      </div>
    </div>
  );
}
