import { useTranslation } from "react-i18next";
import { Nfc, Wallet, CreditCard, Building2, Banknote } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";

export type LinkedMethodProvider = "apple_pay" | "google_pay" | "card" | "bank" | "mobile_money";

export const PAYMENT_PROVIDERS: { id: LinkedMethodProvider; icon: typeof Wallet; labelKey: string }[] = [
  { id: "apple_pay", icon: Nfc, labelKey: "paymentMethods.applePay" },
  { id: "google_pay", icon: Wallet, labelKey: "paymentMethods.googlePay" },
  { id: "card", icon: CreditCard, labelKey: "paymentMethods.card" },
  { id: "bank", icon: Building2, labelKey: "paymentMethods.bank" },
  { id: "mobile_money", icon: Banknote, labelKey: "paymentMethods.mobileMoney" },
];

export default function AddPaymentMethodSheet({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (provider: LinkedMethodProvider) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>{t("paymentMethods.addTitle")}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-2">
          <p className="text-xs text-muted-foreground mb-2">{t("paymentMethods.addSub")}</p>
          {PAYMENT_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAdd(p.id); onOpenChange(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <p.icon size={18} className="text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{t(p.labelKey)}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
