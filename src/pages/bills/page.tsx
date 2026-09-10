import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Droplet, Tv, Smartphone, Wifi, Pause } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import PageHeader from "@/components/ui/page-header.tsx";
import TransactionReceipt from "@/components/ui/transaction-receipt.tsx";

const BILLERS = [
  { id: "seeg", name: "SEEG — Water", meta: "Libreville · due in 3 days", amount: "18 400", currency: "XAF", icon: Droplet, autoPay: false, paused: false },
  { id: "canal", name: "Canal+ Gabon", meta: "Monthly subscription", amount: "22 500", currency: "XAF", icon: Tv, autoPay: true, paused: false },
  { id: "airtel", name: "Airtel Airtime", meta: "Kinshasa · +243 •• 41", amount: "12 000", currency: "CDF", icon: Smartphone, autoPay: false, paused: false },
  { id: "unitel", name: "Unitel Angola", meta: "Luanda · data bundle", amount: "4 900", currency: "AOA", icon: Wifi, autoPay: false, paused: false },
  { id: "orange", name: "Orange CI Internet", meta: "Paused", amount: "—", currency: "", icon: Wifi, autoPay: false, paused: true },
];

export default function Bills() {
  const { t } = useTranslation("common");
  const [autoPay, setAutoPay] = useState<Record<string, boolean>>(
    Object.fromEntries(BILLERS.map(b => [b.id, b.autoPay])),
  );
  const [paying, setPaying] = useState<(typeof BILLERS)[number] | null>(null);
  const [reference, setReference] = useState("");

  const handlePay = (biller: (typeof BILLERS)[number]) => {
    setReference(`BILL-${Date.now().toString().slice(-10)}`);
    setPaying(biller);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeader title={t("bills.title")} subtitle={t("bills.intro")} className="mb-5" />

      <div className="space-y-2">
        {BILLERS.map(b => (
          <div key={b.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
              b.paused ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary",
            )}>
              {b.paused ? <Pause size={18} /> : <b.icon size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{b.name}</div>
              <div className="text-xs text-muted-foreground truncate">{b.meta}</div>
            </div>
            <div className="text-right shrink-0 space-y-1.5">
              {!b.paused && (
                <div className="text-sm font-bold font-mono text-foreground">{b.amount} <span className="text-xs font-normal text-muted-foreground">{b.currency}</span></div>
              )}
              {!b.paused && (
                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handlePay(b)}>{t("bills.pay")}</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-card border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">{t("bills.autoPayTitle")}</h2>
        {BILLERS.filter(b => !b.paused).map(b => (
          <div key={b.id} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{b.name}</span>
            <Switch checked={autoPay[b.id]} onCheckedChange={v => setAutoPay(a => ({ ...a, [b.id]: v }))} />
          </div>
        ))}
      </div>

      {paying && (
        <TransactionReceipt
          type="bill"
          amount={paying.amount}
          currency={paying.currency}
          recipient={paying.name}
          reference={reference}
          date={new Date().toLocaleString()}
          onClose={() => setPaying(null)}
          onNewTransaction={() => setPaying(null)}
        />
      )}
    </div>
  );
}
