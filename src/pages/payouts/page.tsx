import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import PageHeader from "@/components/ui/page-header.tsx";

const PAYOUTS = [
  { name: "Batch #4471", meta: "142 transfers · GIMAC", amount: "8 420 000", currency: "XAF", status: "settled" },
  { name: "Batch #4470", meta: "96 transfers · M-Pesa CDF", amount: "31 900 000", currency: "CDF", status: "settled" },
  { name: "Card acquiring", meta: "Yesterday · net of 1.4%", amount: "2 118 000", currency: "XAF", status: "settled" },
  { name: "EUR corridor sweep", meta: "SEPA · 14:00 cut-off", amount: "38 400", currency: "EUR", status: "pending" },
  { name: "USD corridor sweep", meta: "Kinshasa · accepted on all channels", amount: "24 100", currency: "USD", status: "pending" },
  { name: "AOA corridor sweep", meta: "Luanda · Multicaixa Express", amount: "9 640 000", currency: "AOA", status: "pending" },
  { name: "Agent float reconciliation", meta: "31 agents · open", amount: "1 042 000", currency: "XAF", status: "open" },
];

const STATUS_STYLE: Record<string, string> = {
  settled: "bg-primary/10 text-primary",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  open: "bg-secondary text-muted-foreground",
};

export default function Payouts() {
  const { t } = useTranslation("common");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeader title={t("payouts.title")} subtitle={t("payouts.intro")} className="mb-5" />

      <div className="space-y-2">
        {PAYOUTS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Banknote size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.meta}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold font-mono text-foreground">{p.amount} <span className="text-xs font-normal text-muted-foreground">{p.currency}</span></div>
              <span className={cn("inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize", STATUS_STYLE[p.status])}>
                {t(`payouts.status.${p.status}`)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
