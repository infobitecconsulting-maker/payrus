import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Minus, Plus, Shield, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { cn } from "@/lib/utils.ts";
import { useBookTravelMutation } from "@/hooks/use-backend.ts";
import type { AppFlight, AppHotel, BookTravelResult } from "@/lib/backend.ts";
import { addDaysISO, bookingErrorKey, formatDate, formatMoney, priceQuote, todayISO } from "./travel-utils.ts";

export type TravelItem = { kind: "flight"; flight: AppFlight } | { kind: "hotel"; hotel: AppHotel };

interface Props {
  item: TravelItem;
  userId: string | undefined;
  initialInstallments: boolean;
  initialDate: string;
  initialPassengers: number;
  initialNights: number;
  onClose: () => void;
  onViewBookings: () => void;
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="-" disabled={value <= min} onClick={() => onChange(value - 1)}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center cursor-pointer disabled:opacity-40 hover:bg-card">
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-bold font-mono" data-testid="stepper-value">{value}</span>
        <button type="button" aria-label="+" disabled={value >= max} onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center cursor-pointer disabled:opacity-40 hover:bg-card">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function BookingDialog({ item, userId, initialInstallments, initialDate, initialPassengers, initialNights, onClose, onViewBookings }: Props) {
  const { t, i18n } = useTranslation("common");
  const { lng } = useParams();
  const navigate = useNavigate();
  const book = useBookTravelMutation();
  const isFlight = item.kind === "flight";
  const today = todayISO();

  const [date, setDate] = useState(initialDate >= today ? initialDate : today);
  const [count, setCount] = useState(initialPassengers);
  const [nights, setNights] = useState(initialNights);
  const [installments, setInstallments] = useState(initialInstallments);
  const [step, setStep] = useState<"form" | "success">("form");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BookTravelResult | null>(null);

  const unit = isFlight ? item.flight.price : item.hotel.pricePerNight;
  const currency = isFlight ? item.flight.currency : item.hotel.currency;
  const discountPct = isFlight ? item.flight.memberDiscountPercent : item.hotel.memberDiscountPercent;
  const units = isFlight ? count : nights;
  const title = isFlight ? `${item.flight.airline} · ${item.flight.origin}→${item.flight.destination}` : item.hotel.name;
  const seatsLeft = isFlight ? item.flight.seatsLeft : Infinity;
  const maxPassengers = isFlight ? Math.min(9, Math.max(seatsLeft, 1)) : 9;
  const quote = useMemo(() => priceQuote(unit, units, discountPct, installments), [unit, units, discountPct, installments]);
  const soldOut = isFlight && seatsLeft < count;
  const dateInvalid = date < today;
  const fmt = (n: number) => formatMoney(n, currency, i18n.language);

  const plan = [
    { label: t("travel.splitPayment.termNow"), amount: quote.term1 + quote.fee, date: today },
    { label: t("travel.splitPayment.termIn30Days"), amount: quote.term2, date: addDaysISO(today, 30) },
    { label: t("travel.splitPayment.termIn60Days"), amount: quote.term3, date: addDaysISO(today, 60) },
  ];

  async function confirm() {
    if (!userId) return;
    setBusy(true);
    try {
      const res = await book({
        userId, kind: item.kind, itemId: isFlight ? item.flight.id : item.hotel.id, travelDate: date,
        nights: isFlight ? 1 : nights, passengers: count, installments, note: title,
      });
      setResult(res);
      setStep("success");
    } catch (e) {
      toast.error(t(bookingErrorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden gap-0" data-testid="booking-dialog">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center"><CreditCard size={15} className="text-primary" /></span>
            {step === "success" ? t("travel.splitPayment.successTitle") : t("travel.booking.title")}
          </DialogTitle>
          <DialogDescription className="text-[11px]">{title}</DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-auto">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-muted-foreground">{isFlight ? t("travel.booking.departureDate") : t("travel.booking.checkInDate")}</span>
                <input id="travel-booking-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm" />
              </label>
              <div className="col-span-2 sm:col-span-1 flex items-end">
                <Stepper label={isFlight ? t("travel.booking.passengers") : t("travel.booking.guests")} value={count} min={1} max={maxPassengers} onChange={setCount} />
              </div>
              {!isFlight && (
                <div className="col-span-2">
                  <Stepper label={t("travel.booking.nights")} value={nights} min={1} max={60} onChange={setNights} />
                </div>
              )}
            </div>

            {/* Pay in full / pay in three */}
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("travel.booking.payMode")}>
              {[false, true].map((mode) => (
                <button key={String(mode)} type="button" role="radio" aria-checked={installments === mode} onClick={() => setInstallments(mode)}
                  className={cn("rounded-xl border px-3 py-2.5 text-left cursor-pointer transition-colors",
                    installments === mode ? "border-primary bg-primary/10" : "border-border hover:border-primary/30")}>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    {mode ? <CreditCard size={12} /> : <Wallet size={12} />} {mode ? t("travel.payInThreeButton") : t("travel.booking.payInFull")}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{mode ? t("travel.booking.payInThreeHint") : t("travel.booking.payInFullHint")}</div>
                </button>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl bg-secondary/50 p-4 space-y-1.5 text-xs" data-testid="price-breakdown">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{fmt(unit)} × {units}{isFlight ? "" : ` ${t("travel.nightAbbrev")}`}</span>
                <span className="font-mono">{fmt(quote.base)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>{t("travel.membersDiscount", { pct: discountPct })}</span>
                  <span className="font-mono">−{fmt(quote.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold">
                <span>{t("travel.booking.total")}</span>
                <span className="font-mono text-primary" data-testid="booking-total">{fmt(quote.total)}</span>
              </div>
              {installments && (
                <div className="pt-2 space-y-1.5">
                  {plan.map((p, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{p.label} · {formatDate(p.date, i18n.language)}</span>
                      <span className="font-mono font-semibold">{fmt(p.amount)}</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground">{t("travel.splitPayment.feeNoticePrefix")} {fmt(quote.fee)} {t("travel.splitPayment.feeNoticeSuffix")}</div>
                </div>
              )}
              <div className="flex justify-between pt-1 text-[11px]">
                <span className="text-muted-foreground">{t("travel.booking.chargedNow")}</span>
                <span className="font-mono font-bold">{fmt(quote.chargedNow)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Shield size={12} className="text-emerald-700 shrink-0 mt-0.5" />
              {t("travel.booking.cancelPolicy")}
            </div>

            {soldOut && <p className="text-xs text-destructive" role="alert">{t("travel.error.soldOut")}</p>}
            {dateInvalid && <p className="text-xs text-destructive" role="alert">{t("travel.error.pastDate")}</p>}

            {userId ? (
              <button type="button" disabled={busy || soldOut || dateInvalid} onClick={() => void confirm()}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-60">
                {busy ? t("signin.checking") : t("travel.splitPayment.payNowButton", { amount: fmt(quote.chargedNow) })}
              </button>
            ) : (
              <button type="button" onClick={() => navigate(`/${lng ?? "en"}/signin`)}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
                {t("travel.booking.signInToBook")}
              </button>
            )}
            <button type="button" onClick={onClose} className="w-full text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t("common.cancel")}</button>
          </div>
        )}

        {step === "success" && result && (
          <div className="p-8 text-center space-y-5" data-testid="booking-success">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <div>
              <div className="text-lg font-black text-foreground">{t("travel.splitPayment.successTitle")}</div>
              <div className="text-sm text-muted-foreground mt-1">{t("travel.booking.successSubtitle")}</div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("travel.splitPayment.reference")}</span><span className="font-mono font-semibold" data-testid="booking-reference">{result.reference}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("travel.booking.total")}</span><span className="font-mono font-semibold">{fmt(result.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("travel.booking.chargedNow")}</span><span className="font-mono font-semibold text-primary">{fmt(result.chargedNow)}</span></div>
              {result.installments && (
                <div className="flex justify-between"><span className="text-muted-foreground">{t("travel.splitPayment.remainingBalance")}</span><span className="font-mono font-semibold">{fmt(Math.round((result.amount - (result.chargedNow - Math.round(result.amount * 2.5) / 100)) * 100) / 100)}</span></div>
              )}
            </div>
            <button type="button" onClick={() => { onClose(); onViewBookings(); }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
              {t("travel.splitPayment.viewBookingsButton")}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

