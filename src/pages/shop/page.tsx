import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import {
  ShoppingBag, Star, Sparkles, ArrowUpRight, ChevronRight,
  Wallet, CreditCard, Smartphone, Nfc, Percent, Info,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import PageHeader from "@/components/ui/page-header.tsx";
import TransactionReceipt from "@/components/ui/transaction-receipt.tsx";
import { PayRusLogo } from "@/pages/layout/AppLayout.tsx";
import { api } from "@/convex/_generated/api.js";
import { getAnonId } from "@/lib/anon-id.ts";

type Category = "all" | "general" | "electronics" | "fashion" | "wholesale" | "local";
type Step = "browse" | "cart" | "method" | "confirm" | "success";
type ShopPaymentMethod = "wallet" | "card" | "apple_pay" | "google_pay" | "mobile";

interface Partner {
  id: string;
  name: string;
  category: Exclude<Category, "all">;
  emoji: string;
  promoted: boolean;
  discount?: number;
  rating: number;
  items: { name: string; price: number }[];
}

const PAYRUS_FEE_RATE = 0.015; // service fee charged to the user
const FX_SPREAD_RATE = 0.004; // PayRus's margin baked into the displayed XAF rate
const XAF_RATE = 601;
const PARTNER_COMMISSION_RATE = 0.02; // commission PayRus collects from the partner, not the user

export default function Shop() {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<Step>("browse");
  const [category, setCategory] = useState<Category>("all");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [method, setMethod] = useState<ShopPaymentMethod | null>(null);
  const [txReference] = useState(() => `SHOP-${Date.now().toString().slice(-10)}`);

  const categories: { id: Category; label: string }[] = [
    { id: "all", label: t("shop.category.all") },
    { id: "general", label: t("shop.category.general") },
    { id: "electronics", label: t("shop.category.electronics") },
    { id: "fashion", label: t("shop.category.fashion") },
    { id: "wholesale", label: t("shop.category.wholesale") },
    { id: "local", label: t("shop.category.local") },
  ];

  const partnersQuery = useQuery(api.marketplacePartners.list);
  const partners: Partner[] | undefined = partnersQuery
    ?.map((p): Partner => ({
      id: p.slug,
      name: p.name,
      category: p.category as Exclude<Category, "all">,
      emoji: p.emoji,
      promoted: p.promoted,
      discount: p.discountPercent,
      rating: p.rating,
      items: p.items,
    }))
    .sort((a, b) => Number(b.promoted) - Number(a.promoted));
  const visiblePartners = partners === undefined ? [] : category === "all" ? partners : partners.filter(p => p.category === category);
  const createOrder = useMutation(api.shopOrders.create);
  const ownerKey = useState(getAnonId)[0];

  const methods: { id: ShopPaymentMethod; label: string; icon: typeof Wallet; color: string }[] = [
    { id: "wallet", label: t("shop.methodWallet"), icon: Wallet, color: "bg-primary/10 text-primary border-primary/30" },
    { id: "card", label: t("shop.methodCard"), icon: CreditCard, color: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" },
    { id: "apple_pay", label: t("paymentMethods.applePay"), icon: Nfc, color: "bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30" },
    { id: "google_pay", label: t("paymentMethods.googlePay"), icon: Wallet, color: "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30" },
    { id: "mobile", label: t("shop.methodMobile"), icon: Smartphone, color: "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30" },
  ];
  const selectedMethod = methods.find(m => m.id === method);

  const subtotal = partner ? partner.items.reduce((sum, item) => sum + item.price, 0) : 0;
  const discountAmount = partner?.discount ? subtotal * (partner.discount / 100) : 0;
  const afterDiscount = subtotal - discountAmount;
  const payrusFee = afterDiscount * PAYRUS_FEE_RATE;
  const total = afterDiscount + payrusFee;
  const xafEquivalent = total * XAF_RATE * (1 + FX_SPREAD_RATE);
  const partnerCommission = afterDiscount * PARTNER_COMMISSION_RATE;

  const openPartner = (p: Partner) => { setPartner(p); setStep("cart"); };

  const goBack = () => {
    if (step === "confirm") setStep("method");
    else if (step === "method") setStep("cart");
    else if (step === "cart") setStep("browse");
    else setStep("browse");
  };

  const reset = () => { setStep("browse"); setPartner(null); setMethod(null); };

  const handleConfirm = () => {
    if (partner) {
      void createOrder({
        ownerKey,
        partnerSlug: partner.id,
        partnerName: partner.name,
        subtotal,
        discountAmount,
        payrusFee,
        partnerCommission,
        total,
        method: selectedMethod?.label ?? "",
        reference: txReference,
      });
    }
    setStep("success");
    toast.success(t("common.success"));
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {step === "browse" ? (
        <PageHeader title={t("shop.title")} subtitle={t("shop.subtitle")} showBack={false} className="mb-4 md:mb-6" />
      ) : step !== "success" ? (
        <PageHeader
          title={
            step === "cart" ? partner?.name
            : step === "method" ? t("shop.chooseMethod")
            : t("shop.confirmTitle")
          }
          onBack={goBack}
          className="mb-4 md:mb-6"
        />
      ) : null}

      <AnimatePresence mode="wait">
        {step === "browse" && (
          <motion.div key="browse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-5">
            {/* PayRus partners promo banner */}
            <div className="rounded-2xl overflow-hidden border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-2 shrink-0">
                  <PayRusLogo className="h-6 w-auto" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{t("shop.partnersBannerTitle")}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t("shop.partnersBannerDesc")}</div>
                </div>
                <Sparkles size={20} className="text-primary ml-auto shrink-0" />
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground -mt-2">
              <Info size={11} className="shrink-0" /> {t("shop.conceptNote")}
            </p>

            {/* Category filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer transition-colors",
                    category === c.id ? "bg-primary/15 text-primary border-primary/25" : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Partner grid */}
            {partners === undefined ? (
              <div className="py-10 text-center text-xs text-muted-foreground">{t("common.loading")}</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visiblePartners.map((p, i) => {
                const partnerSubtotal = p.items.reduce((sum, item) => sum + item.price, 0);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => openPartner(p)}
                    className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/25 transition-all group cursor-pointer"
                  >
                    <div className="relative h-28 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
                      <span className="text-5xl">{p.emoji}</span>
                      {p.promoted && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/90 backdrop-blur-sm">
                          <div className="rounded px-1 bg-white">
                            <PayRusLogo className="h-3 w-auto" />
                          </div>
                          <span className="text-[10px] font-bold text-primary-foreground">{t("shop.partnerBadge")}</span>
                        </div>
                      )}
                      {typeof p.discount === "number" && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/90 backdrop-blur-sm border border-border">
                          <Percent size={10} className="text-primary" />
                          <span className="text-[10px] font-bold text-primary">-{p.discount}%</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="text-sm font-bold text-foreground truncate">{p.name}</div>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 shrink-0">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-[11px] font-bold text-amber-700">{p.rating}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-3">{t(`shop.category.${p.category}`)}</div>
                      <button className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold cursor-pointer hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                        {t("shop.shopNow", { amount: partnerSubtotal.toFixed(2) })} <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            )}
          </motion.div>
        )}

        {step === "cart" && partner && (
          <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{partner.emoji}</span>
                <div>
                  <div className="font-bold text-foreground">{partner.name}</div>
                  <div className="text-xs text-muted-foreground">{t("shop.orderSummary")}</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {partner.items.map(item => (
                  <div key={item.name} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <span className="text-sm font-mono font-semibold text-foreground">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {partner.discount ? (
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-border text-sm">
                  <span className="text-primary font-medium">{t("shop.partnerDiscount", { pct: partner.discount })}</span>
                  <span className="font-mono font-semibold text-primary">-${discountAmount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                <span className="text-sm font-semibold text-foreground">{t("shop.subtotal")}</span>
                <span className="text-lg font-black font-mono text-foreground">${afterDiscount.toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={() => setStep("method")} className="w-full h-12 text-base font-bold cursor-pointer">
              <ShoppingBag size={18} className="mr-2" />
              {t("shop.payWithPayrus")}
            </Button>
          </motion.div>
        )}

        {step === "method" && (
          <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium mb-2">{t("shop.selectMethod")}</p>
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => { setMethod(m.id); setStep("confirm"); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-all text-left cursor-pointer border-border"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", m.color)}>
                  <m.icon size={22} />
                </div>
                <div className="flex-1 font-semibold text-foreground">{m.label}</div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        )}

        {step === "confirm" && partner && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="rounded-xl bg-card border border-border p-5 space-y-4">
              <div className="space-y-3 divide-y divide-border">
                {[
                  { label: t("shop.merchant"), value: partner.name },
                  { label: t("shop.method"), value: selectedMethod?.label ?? "" },
                  { label: t("shop.orderTotal"), value: `$${afterDiscount.toFixed(2)}` },
                  { label: t("shop.payrusFee"), value: `$${payrusFee.toFixed(2)}` },
                  { label: t("shop.equivalent"), value: `${Math.round(xafEquivalent).toLocaleString()} XAF` },
                  { label: t("shop.total"), value: `$${total.toFixed(2)}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between pt-3 first:pt-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className={cn("text-sm font-semibold", row.label === t("shop.total") ? "text-primary" : "text-foreground")}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-secondary/50">
              <Info size={14} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                {t("shop.commissionNote", { partner: partner.name, amount: partnerCommission.toFixed(2) })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="flex-1 h-12 rounded-xl">{t("common.cancel")}</Button>
              <Button onClick={handleConfirm} className="flex-1 h-12 text-base font-semibold rounded-xl">{t("shop.payNow")}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === "success" && partner && (
        <TransactionReceipt
          type="payment"
          amount={`$${total.toFixed(2)}`}
          currency="USD"
          convertedAmount={`${Math.round(xafEquivalent).toLocaleString()}`}
          convertedCurrency="XAF"
          recipient={partner.name}
          method={selectedMethod?.label}
          fee={`$${payrusFee.toFixed(2)}`}
          reference={txReference}
          date={new Date().toLocaleString()}
          onClose={reset}
          onNewTransaction={reset}
        />
      )}
    </div>
  );
}
