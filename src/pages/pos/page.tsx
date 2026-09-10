import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Nfc, QrCode, Smartphone, Delete } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import PageHeader from "@/components/ui/page-header.tsx";
import TransactionReceipt from "@/components/ui/transaction-receipt.tsx";
import { useProfile } from "@/contexts/profile-context.tsx";

type Rail = "tap" | "qr" | "mobile";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];
const ACQUIRING_FEE_RATE = 0.014;

export default function PointOfSale() {
  const { t } = useTranslation("common");
  const { profile } = useProfile();

  const [amount, setAmount] = useState("0");
  const [rail, setRail] = useState<Rail>("tap");
  const [charging, setCharging] = useState(false);
  const [charged, setCharged] = useState(false);
  const [txReference] = useState(() => `POS-${Date.now().toString().slice(-10)}`);

  const numeric = parseFloat(amount) || 0;
  const net = numeric * (1 - ACQUIRING_FEE_RATE);
  const currency = profile?.currency ?? "XAF";

  const press = (key: string) => {
    if (key === "back") {
      setAmount(a => (a.length > 1 ? a.slice(0, -1) : "0"));
      return;
    }
    if (key === "." && amount.includes(".")) return;
    setAmount(a => (a === "0" && key !== "." ? key : a + key));
  };

  const rails: { id: Rail; icon: typeof Nfc; label: string }[] = [
    { id: "tap", icon: Nfc, label: t("pos.tapCard") },
    { id: "qr", icon: QrCode, label: t("pos.showQr") },
    { id: "mobile", icon: Smartphone, label: t("pos.mobileMoney") },
  ];

  const handleCharge = () => {
    if (numeric <= 0) return;
    setCharging(true);
    setTimeout(() => {
      setCharging(false);
      setCharged(true);
    }, 700);
  };

  const reset = () => {
    setAmount("0");
    setCharged(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <PageHeader title={t("pos.title")} subtitle={profile?.name ?? t("pos.subtitle")} className="mb-5" />

      <div className="text-center py-6">
        <div className="text-4xl font-bold font-mono text-foreground tracking-tight">
          {numeric.toLocaleString()} <span className="text-xl text-muted-foreground">{currency}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t("pos.net")} <span className="font-semibold text-foreground">{net.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
        {KEYS.map(k => (
          <button
            key={k}
            onClick={() => press(k)}
            className="h-14 rounded-xl bg-card border border-border text-lg font-semibold text-foreground hover:bg-secondary active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            {k === "back" ? <Delete size={18} /> : k}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {rails.map(r => (
          <button
            key={r.id}
            onClick={() => setRail(r.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer",
              rail === r.id ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground",
            )}
          >
            <r.icon size={18} />
            {r.label}
          </button>
        ))}
      </div>

      <Button
        onClick={handleCharge}
        disabled={numeric <= 0 || charging}
        className="w-full h-12 text-base font-semibold rounded-xl"
      >
        {charging ? t("common.loading", { defaultValue: "..." }) : `${t("pos.charge")} ${numeric.toLocaleString()} ${currency}`}
      </Button>

      {charged && (
        <TransactionReceipt
          type="pos"
          amount={numeric.toLocaleString()}
          currency={currency}
          method={rails.find(r => r.id === rail)?.label}
          fee={`${(numeric * ACQUIRING_FEE_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`}
          reference={txReference}
          date={new Date().toLocaleString()}
          onClose={reset}
          onNewTransaction={reset}
        />
      )}
    </div>
  );
}
