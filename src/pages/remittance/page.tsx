import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeftRight, Globe, TrendingUp, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import TransactionReceipt from "@/components/ui/transaction-receipt.tsx";
import { commissionFor, midMarketConvert } from "@/convex/fx.ts";
import { useCurrentAppUser } from "@/hooks/use-current-app-user.ts";
import { useApplyWalletTransferMutation } from "@/hooks/use-backend.ts";

// Launch-phase priority corridors lead the list: XAF (CEMAC — Cameroon, Congo-Brazzaville,
// CAR/Bangui, Gabon, Chad, Eq. Guinea) and AOA (Angola). AED and CNY are visible for
// completeness but are not launch-priority corridors. Rates themselves come from
// convex/fx.ts (the same source of truth applyTransaction uses server-side) —
// this list only supplies display metadata (name/flag) per currency.
const currencies = [
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "XAF", name: "Franc CFA (CEMAC)", flag: "🌍" },
  { code: "AOA", name: "Angolan Kwanza", flag: "🇦🇴" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "CDF", name: "Franc Congolais", flag: "🇨🇩" },
  { code: "XOF", name: "Franc CFA (UEMOA)", flag: "🌍" },
  { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
];

const corridorPairs: [string, string, string][] = [
  ["🇪🇺 EUR", "EUR", "XAF"], ["🇺🇸 USD", "USD", "XAF"],
  ["🇪🇺 EUR", "EUR", "AOA"], ["🇺🇸 USD", "USD", "AOA"],
  ["🇺🇸 USD", "USD", "CDF"], ["🇪🇺 EUR", "EUR", "CDF"],
  ["🇺🇸 USD", "USD", "NGN"], ["🇺🇸 USD", "USD", "KES"],
  ["🇺🇸 USD", "USD", "AED"], ["🇺🇸 USD", "USD", "CNY"],
];
const flagFor = (code: string) => currencies.find(c => c.code === code)?.flag ?? "🏳️";
const corridors = corridorPairs.map(([fromLabel, from, to]) => ({
  from: fromLabel,
  to: `${flagFor(to)} ${to}`,
  rate: midMarketConvert(1, from, to).toLocaleString(undefined, { maximumFractionDigits: 2 }),
}));

type Step = "form" | "confirm" | "success";

export default function Remittance() {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<Step>("form");
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("XAF");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const currentUser = useCurrentAppUser();
  const applyTransaction = useApplyWalletTransferMutation();
  const [sending, setSending] = useState(false);

  const fromCurr = currencies.find(c => c.code === fromCurrency)!;
  const toCurr = currencies.find(c => c.code === toCurrency)!;
  const numAmt = parseFloat(amount) || 0;
  const convertedAmount = amount ? midMarketConvert(numAmt, fromCurrency, toCurrency).toFixed(2) : "0.00";
  const fxRate = midMarketConvert(1, fromCurrency, toCurrency).toFixed(4);
  const fee = commissionFor(numAmt);

  const swap = () => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); };
  const handleSend = () => { if (!amount || !recipient) { toast.error(t("common.error")); return; } setStep("confirm"); };
  const [txReference, setTxReference] = useState(() => `REF-${Date.now().toString().slice(-10)}`);

  const handleConfirm = async () => {
    if (!currentUser) {
      // Anonymous preview — no real wallet to debit, keep the existing demo flow.
      setStep("success");
      toast.success(t("common.success"));
      return;
    }
    setSending(true);
    try {
      const result = await applyTransaction({ userId: currentUser.id, amount: numAmt, currency: fromCurrency, type: "remittance", note: recipient || undefined });
      setTxReference(result.reference);
      setStep("success");
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSending(false);
    }
  };

  const reset = () => { setStep("form"); setAmount(""); setRecipient(""); setRecipientAccount(""); };

  const confirmRows = [
    { label: t("remittance.youSend"), value: `${amount} ${fromCurrency}` },
    { label: t("remittance.theyReceive"), value: `${parseFloat(convertedAmount).toLocaleString()} ${toCurrency}` },
    { label: t("remittance.rate"), value: `1 ${fromCurrency} = ${fxRate} ${toCurrency}` },
    { label: t("remittance.fee"), value: `${fromCurrency} ${fee.toFixed(2)}` },
    { label: t("remittance.recipient"), value: recipient || "—" },
    { label: t("remittance.delivery"), value: t("remittance.instant") },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        {step !== "form" && (
          <button onClick={() => setStep("form")} className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("remittance.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("remittance.subtitle")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={14} className="text-accent" />
          <span className="text-xs font-medium text-muted-foreground">{t("remittance.liveRates")}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {corridors.map(c => (
            <div key={c.from + c.to} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{c.from} → {c.to}</span>
              <span className="font-mono font-semibold text-foreground">{c.rate}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <h2 className="font-semibold text-foreground">{t("remittance.converterTitle")}</h2>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("remittance.youSend")}</label>
                <div className="flex gap-2">
                  <button onClick={() => setShowFromPicker(!showFromPicker)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <span className="text-lg">{fromCurr.flag}</span>
                    <span className="text-sm font-semibold text-foreground">{fromCurrency}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                  <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" className="flex-1 bg-secondary border-border font-mono font-bold" />
                </div>
                {showFromPicker && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-popover p-2 grid grid-cols-2 gap-1 shadow-xl z-10">
                    {currencies.filter(c => c.code !== toCurrency).map(c => (
                      <button key={c.code} onClick={() => { setFromCurrency(c.code); setShowFromPicker(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-sm text-left cursor-pointer">
                        <span>{c.flag}</span><span className="font-medium">{c.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
              <div className="flex items-center justify-center">
                <button onClick={swap} className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <ArrowLeftRight size={15} className="text-primary" />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("remittance.theyReceive")}</label>
                <div className="flex gap-2">
                  <button onClick={() => setShowToPicker(!showToPicker)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <span className="text-lg">{toCurr.flag}</span>
                    <span className="text-sm font-semibold text-foreground">{toCurrency}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                  <div className="flex-1 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 font-mono font-bold text-primary">
                    {parseFloat(convertedAmount).toLocaleString()}
                  </div>
                </div>
                {showToPicker && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-popover p-2 grid grid-cols-2 gap-1 shadow-xl z-10">
                    {currencies.filter(c => c.code !== fromCurrency).map(c => (
                      <button key={c.code} onClick={() => { setToCurrency(c.code); setShowToPicker(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-sm text-left cursor-pointer">
                        <span>{c.flag}</span><span className="font-medium">{c.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp size={12} className="text-primary" />
                  {t("remittance.exchangeRate")}
                </div>
                <span className="font-mono font-semibold text-foreground">1 {fromCurrency} = {fxRate} {toCurrency}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <h2 className="font-semibold text-foreground">{t("remittance.recipientTitle")}</h2>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("remittance.fullName")}</label>
                <Input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={t("remittance.fullNamePlaceholder")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("remittance.accountPhone")}</label>
                <Input value={recipientAccount} onChange={e => setRecipientAccount(e.target.value)} placeholder={t("remittance.accountPhonePlaceholder")} className="bg-secondary border-border" />
              </div>
            </div>
            <Button onClick={handleSend} className="w-full h-12 text-base font-semibold rounded-xl">{t("remittance.reviewTransfer")}</Button>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <h2 className="font-semibold text-foreground text-lg">{t("remittance.reviewTitle")}</h2>
              <div className="space-y-3 divide-y divide-border">
                {confirmRows.map(row => (
                  <div key={row.label} className="flex justify-between pt-3 first:pt-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className={cn("text-sm font-semibold", row.label === t("remittance.theyReceive") ? "text-primary" : "text-foreground")}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="flex-1 h-12 rounded-xl">{t("common.cancel")}</Button>
              <Button onClick={() => void handleConfirm()} disabled={sending} className="flex-1 h-12 text-base font-semibold rounded-xl">{sending ? t("signin.checking") : t("remittance.confirmSend")}</Button>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <TransactionReceipt
              type="remittance"
              amount={amount}
              currency={fromCurrency}
              convertedAmount={parseFloat(convertedAmount).toLocaleString()}
              convertedCurrency={toCurrency}
              recipient={recipient || undefined}
              method={`${fromCurrency} → ${toCurrency}`}
              fee={`${fromCurrency} ${fee.toFixed(2)}`}
              reference={txReference}
              date={new Date().toLocaleString()}
              onClose={reset}
              onNewTransaction={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
