import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet, Building2, Users, Bitcoin, CreditCard, Smartphone,
  ChevronRight, ArrowLeft, CheckCircle, Copy, AlertCircle, Shield
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/ui/page-header.tsx";
import TransactionReceipt from "@/components/ui/transaction-receipt.tsx";

type TopUpMethod = "bank" | "agent" | "crypto" | "card" | "mobile";
type Step = "balance" | "method" | "details" | "confirm" | "success";

export default function WalletPage() {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<Step>("balance");
  const [method, setMethod] = useState<TopUpMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [txReference] = useState(() => `TOP-${Date.now().toString().slice(-10)}`);

  // Simulated wallet balance
  const walletBalance = 247500;

  const methods: {
    id: TopUpMethod;
    label: string;
    sub: string;
    icon: typeof Building2;
    color: string;
    fee: string;
    time: string;
  }[] = [
    {
      id: "bank",
      label: t("wallet.methodBank"),
      sub: t("wallet.methodBankSub"),
      icon: Building2,
      color: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
      fee: "0%",
      time: t("wallet.time24h"),
    },
    {
      id: "agent",
      label: t("wallet.methodAgent"),
      sub: t("wallet.methodAgentSub"),
      icon: Users,
      color: "bg-primary/10 text-primary border-primary/30",
      fee: "1%",
      time: t("wallet.timeInstant"),
    },
    {
      id: "crypto",
      label: t("wallet.methodCrypto"),
      sub: t("wallet.methodCryptoSub"),
      icon: Bitcoin,
      color: "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      fee: "0.5%",
      time: t("wallet.time10min"),
    },
    {
      id: "card",
      label: t("wallet.methodCard"),
      sub: t("wallet.methodCardSub"),
      icon: CreditCard,
      color: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30",
      fee: "2.5%",
      time: t("wallet.timeInstant"),
    },
    {
      id: "mobile",
      label: t("wallet.methodMobile"),
      sub: t("wallet.methodMobileSub"),
      icon: Smartphone,
      color: "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
      fee: "1.5%",
      time: t("wallet.timeInstant"),
    },
  ];

  const selectedMethod = methods.find(m => m.id === method);

  const handleConfirm = () => {
    setStep("success");
    toast.success(t("common.success"));
  };

  const goBack = () => {
    if (step === "confirm") setStep("details");
    else if (step === "details") setStep("method");
    else if (step === "method") setStep("balance");
    else setStep("balance");
  };

  const reset = () => {
    setStep("balance");
    setMethod(null);
    setAmount("");
  };

  // Bank transfer details (simulated)
  const bankDetails = {
    bankName: "BSIC Central African Rep.",
    accountName: "PayRus SAS",
    accountNumber: "CF 0900 1234 5678 9012 34",
    reference: txReference,
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeader title={t("wallet.title")} className="mb-4 md:mb-6" />

      {/* Wallet balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Wallet size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t("wallet.balance")}</p>
              <p className="text-2xl font-black font-mono text-foreground">XAF {walletBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            <Shield size={12} />
            {t("wallet.secured")}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{t("wallet.lastTopUp")}: 08 Aug 2026</span>
          <span className="text-border">|</span>
          <span>{t("wallet.status")}: <span className="text-primary font-semibold">{t("wallet.active")}</span></span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP: Balance overview & top-up CTA */}
        {step === "balance" && (
          <motion.div key="balance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <Button onClick={() => setStep("method")} className="w-full h-12 text-base font-bold cursor-pointer">
              <Wallet size={18} className="mr-2" />
              {t("wallet.topUp")}
            </Button>

            {/* Recent top-ups */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <h3 className="font-semibold text-sm text-foreground mb-3">{t("wallet.recentTopUps")}</h3>
              <div className="space-y-2.5">
                {[
                  { method: t("wallet.methodMobile"), amount: "+XAF 50,000", date: "08 Aug", status: "success" },
                  { method: t("wallet.methodBank"), amount: "+XAF 150,000", date: "02 Aug", status: "success" },
                  { method: t("wallet.methodAgent"), amount: "+XAF 25,000", date: "28 Jul", status: "success" },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.method}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-primary">{tx.amount}</p>
                      <p className="text-[10px] text-primary">{t("wallet.completed")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP: Choose top-up method */}
        {step === "method" && (
          <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={goBack} className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer">
                <ArrowLeft size={16} className="text-muted-foreground" />
              </button>
              <div>
                <h2 className="font-bold text-foreground">{t("wallet.chooseMethod")}</h2>
                <p className="text-xs text-muted-foreground">{t("wallet.chooseMethodSub")}</p>
              </div>
            </div>
            {methods.map((m) => (
              <button key={m.id} onClick={() => { setMethod(m.id); setStep("details"); }} className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-all text-left cursor-pointer border-border">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", m.color)}>
                  <m.icon size={22} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.sub}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-foreground">{m.fee}</div>
                  <div className="text-[10px] text-muted-foreground">{m.time}</div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        )}

        {/* STEP: Enter amount + method-specific details */}
        {step === "details" && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={goBack} className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer">
                <ArrowLeft size={16} className="text-muted-foreground" />
              </button>
              {selectedMethod && (
                <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium", selectedMethod.color)}>
                  <selectedMethod.icon size={15} />
                  {selectedMethod.label}
                </div>
              )}
            </div>

            {/* Amount input */}
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <label className="text-sm font-medium text-foreground">{t("wallet.enterAmount")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">XAF</span>
                <Input
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="pl-14 h-14 text-2xl font-mono font-bold bg-secondary border-border"
                />
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[5000, 10000, 25000, 50000, 100000].map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-mono font-bold hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
              {selectedMethod && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-secondary/60 mt-2">
                  <span className="text-muted-foreground">{t("wallet.fee")}</span>
                  <span className="font-mono font-semibold text-foreground">{selectedMethod.fee} — {amount ? `XAF ${Math.round(parseFloat(amount || "0") * parseFloat(selectedMethod.fee) / 100).toLocaleString()}` : "XAF 0"}</span>
                </div>
              )}
            </div>

            {/* Method-specific instructions */}
            {method === "bank" && (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Building2 size={14} className="text-blue-500" />
                  {t("wallet.bankInstructions")}
                </h3>
                <div className="space-y-2">
                  {Object.entries(bankDetails).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-foreground">{val}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(val); toast.success(t("wallet.copied")); }}
                          className="text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">{t("wallet.bankNote")}</p>
                </div>
              </div>
            )}

            {method === "agent" && (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Users size={14} className="text-primary" />
                  {t("wallet.agentInstructions")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("wallet.agentDesc")}</p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs font-mono font-bold text-primary">{t("wallet.agentCode")}: {txReference}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(txReference); toast.success(t("wallet.copied")); }}
                    className="text-muted-foreground hover:text-primary cursor-pointer"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            )}

            {method === "crypto" && (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Bitcoin size={14} className="text-amber-500" />
                  {t("wallet.cryptoInstructions")}
                </h3>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("wallet.cryptoNetwork")}: Tron (TRC-20)</p>
                  <p className="text-xs font-mono font-medium text-foreground break-all">TPayRus7xKj...9cDf4Wm</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <AlertCircle size={12} className="text-amber-500" />
                  {t("wallet.cryptoNote")}
                </div>
              </div>
            )}

            {method === "card" && (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <CreditCard size={14} className="text-violet-500" />
                  {t("wallet.cardInstructions")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("wallet.cardDesc")}</p>
              </div>
            )}

            {method === "mobile" && (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Smartphone size={14} className="text-orange-500" />
                  {t("wallet.mobileInstructions")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("wallet.mobileDesc")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {["Orange Money", "MTN MoMo", "Airtel Money"].map(op => (
                    <button key={op} className="p-2.5 rounded-xl bg-secondary border border-border text-xs font-medium text-center hover:border-primary/50 transition-colors cursor-pointer">
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => { if (!amount || parseFloat(amount) <= 0) { toast.error(t("wallet.enterValidAmount")); return; } setStep("confirm"); }}
              className="w-full h-12 text-base font-bold cursor-pointer"
            >
              {t("wallet.continue")}
            </Button>
          </motion.div>
        )}

        {/* STEP: Confirm */}
        {step === "confirm" && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={goBack} className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer">
                <ArrowLeft size={16} className="text-muted-foreground" />
              </button>
              <h2 className="font-bold text-foreground">{t("wallet.confirmTopUp")}</h2>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-1">{t("wallet.topUpAmount")}</p>
                <p className="text-3xl font-black font-mono text-foreground">XAF {parseFloat(amount || "0").toLocaleString()}</p>
              </div>
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("wallet.via")}</span>
                  <span className="font-medium text-foreground">{selectedMethod?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("wallet.fee")}</span>
                  <span className="font-mono font-medium text-foreground">{selectedMethod?.fee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("wallet.estimatedTime")}</span>
                  <span className="font-medium text-foreground">{selectedMethod?.time}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground font-semibold">{t("wallet.reference")}</span>
                  <span className="font-mono font-bold text-primary">{txReference}</span>
                </div>
              </div>
            </div>
            <Button onClick={handleConfirm} className="w-full h-12 text-base font-bold cursor-pointer">
              {t("wallet.confirmAndTopUp")}
            </Button>
          </motion.div>
        )}

        {/* STEP: Success */}
        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <TransactionReceipt
              type="payment"
              reference={txReference}
              amount={parseFloat(amount || "0").toLocaleString()}
              currency="XAF"
              method={selectedMethod?.label ?? ""}
              recipient="PayRus Wallet"
              date={new Date().toLocaleString()}
              onClose={reset}
              onNewTransaction={reset}
            />
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
                <CheckCircle size={16} />
                {t("wallet.successMessage")}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
