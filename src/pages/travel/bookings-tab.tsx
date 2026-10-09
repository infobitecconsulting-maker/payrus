import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, Heart, Hotel, Plane, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { useCancelTravelBookingMutation } from "@/hooks/use-backend.ts";
import type { AppFlight, AppHotel, AppTravelBookingRecord, AppTravelInstallmentPlanWithInstallments } from "@/lib/backend.ts";
import { errorMessage, formatDate, formatMoney, round2, todayISO } from "./travel-utils.ts";

interface Props {
  userId: string;
  bookings: AppTravelBookingRecord[] | undefined;
  plans: AppTravelInstallmentPlanWithInstallments[] | undefined;
}

export function BookingsTab({ userId, bookings, plans }: Props) {
  const { t, i18n } = useTranslation("common");
  const cancel = useCancelTravelBookingMutation();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const today = todayISO();

  async function doCancel(b: AppTravelBookingRecord) {
    setBusy(b.id);
    try {
      const res = await cancel({ userId, bookingId: b.id });
      toast.success(t("travel.bookings.cancelledToast", { amount: formatMoney(res.refunded, res.currency, i18n.language) }));
      setConfirming(null);
    } catch (e) {
      toast.error(errorMessage(e) || t("travel.bookings.cancelFailed"));
    } finally {
      setBusy(null);
    }
  }

  if (!bookings) return <div className="text-center py-16 text-muted-foreground text-sm">{t("signin.checking")}</div>;
  if (bookings.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm" data-testid="no-bookings">{t("travel.noBookingsYet")}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-foreground">{t("travel.myBookings")}</h2>
        <p className="text-[11px] text-muted-foreground">{t("travel.myBookingsSubtitle")}</p>
      </div>
      {bookings.map((b) => {
        const plan = plans?.find((p) => p.bookingId === b.id);
        const active = plan?.installments.filter((i) => i.status !== "cancelled") ?? [];
        const paidCount = active.filter((i) => i.status === "paid").length;
        const paidSum = round2((plan?.installments ?? []).filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0));
        const refundEstimate = plan ? Math.max(round2(paidSum - plan.feeAmount), 0) : b.amount;
        const cancelled = b.status === "cancelled";
        const canCancel = !cancelled && (!b.travelDate || b.travelDate > today);
        const fmt = (n: number) => formatMoney(n, b.currency, i18n.language);
        const Icon = b.kind === "flight" ? Plane : Hotel;
        return (
          <div key={b.id} className={cn("rounded-2xl bg-card border p-4 space-y-3", cancelled ? "border-border opacity-80" : "border-border")} data-testid="booking-card" data-status={b.status}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Icon size={16} className="text-primary" /></div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">{b.title || b.reference}{b.source !== "payrus" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 shrink-0">{t("travel.live.partnerBadge")}</span>}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{b.reference}</div>
                </div>
              </div>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full shrink-0", cancelled ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-primary")}>
                {t(`travel.bookings.status.${b.status}`)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div><div className="text-muted-foreground">{b.kind === "flight" ? t("travel.booking.departureDate") : t("travel.booking.checkInDate")}</div><div className="font-semibold">{formatDate(b.travelDate, i18n.language)}</div></div>
              {b.kind === "hotel" && <div><div className="text-muted-foreground">{t("travel.booking.nights")}</div><div className="font-semibold">{b.nights}</div></div>}
              <div><div className="text-muted-foreground">{b.kind === "flight" ? t("travel.booking.passengers") : t("travel.booking.guests")}</div><div className="font-semibold">{b.passengers}</div></div>
              <div><div className="text-muted-foreground">{t("travel.booking.total")}</div><div className="font-semibold font-mono">{fmt(b.amount)}</div></div>
            </div>

            {plan && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{t("travel.splitPayment.title")}</span>
                  <span className="font-black text-primary">{t("travel.installmentsPaidOf", { paid: paidCount, total: active.length || plan.installments.length })}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${active.length ? Math.round((paidCount / active.length) * 100) : 0}%` }} />
                </div>
                {plan.installments.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center",
                        inst.status === "paid" ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground")}>
                        {inst.status === "paid" ? <CheckCircle2 size={12} /> : inst.status === "cancelled" ? <XCircle size={11} /> : <Clock size={11} />}
                      </div>
                      <span className={cn("text-muted-foreground", inst.status === "cancelled" && "line-through")}>{t("travel.installmentSeq", { seq: inst.seq })} · {formatDate(inst.dueDate, i18n.language)}</span>
                    </div>
                    <span className={cn("font-bold font-mono", inst.status === "paid" ? "text-primary" : "text-foreground", inst.status === "cancelled" && "line-through text-muted-foreground")}>{fmt(inst.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {cancelled && (
              <div className="text-[11px] text-muted-foreground">
                {t("travel.bookings.refundedLine", { amount: fmt(b.refundedAmount) })}
              </div>
            )}

            {canCancel && confirming !== b.id && (
              <button type="button" onClick={() => setConfirming(b.id)}
                className="text-[12px] font-semibold text-destructive hover:underline cursor-pointer">{t("travel.bookings.cancel")}</button>
            )}
            {canCancel && confirming === b.id && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2" role="alertdialog" aria-label={t("travel.bookings.cancel")}>
                <p className="text-[12px] text-foreground">{t("travel.bookings.confirmCancel", { amount: fmt(refundEstimate) })}</p>
                <p className="text-[10px] text-muted-foreground">{t("travel.bookings.refundNote")}</p>
                <div className="flex gap-2">
                  <button type="button" disabled={busy === b.id} onClick={() => void doCancel(b)}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold cursor-pointer disabled:opacity-60">
                    {busy === b.id ? t("signin.checking") : t("travel.bookings.confirmCancelButton")}
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold cursor-pointer">{t("travel.bookings.keep")}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SavedProps {
  flights: AppFlight[];
  hotels: AppHotel[];
  favorites: string[];
  onToggle: (kind: "flight" | "hotel", id: string) => void;
  onBookFlight: (f: AppFlight) => void;
  onViewHotel: (h: AppHotel) => void;
}

export function SavedTab({ flights, hotels, favorites, onToggle, onBookFlight, onViewHotel }: SavedProps) {
  const { t, i18n } = useTranslation("common");
  const savedFlights = flights.filter((f) => favorites.includes(`flight:${f.id}`));
  const savedHotels = hotels.filter((h) => favorites.includes(`hotel:${h.id}`));
  if (savedFlights.length + savedHotels.length === 0) {
    return <div className="text-center py-16 text-muted-foreground text-sm" data-testid="no-saved">{t("travel.savedEmpty")}</div>;
  }
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-foreground">{t("travel.tabSaved")}</h2>
      {savedFlights.map((f) => (
        <div key={f.id} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between gap-3" data-testid="saved-item">
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{f.airline} · {f.origin}→{f.destination}</div>
            <div className="text-[11px] text-muted-foreground">{f.departure} · {f.duration} · {formatMoney(f.price, f.currency, i18n.language)}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" aria-label={t("travel.favorites.toggle")} onClick={() => onToggle("flight", f.id)} className="cursor-pointer"><Heart size={16} className="text-red-400 fill-red-400" /></button>
            <button type="button" onClick={() => onBookFlight(f)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer">{t("travel.bookNowButton")}</button>
          </div>
        </div>
      ))}
      {savedHotels.map((h) => (
        <div key={h.id} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between gap-3" data-testid="saved-item">
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{h.name}</div>
            <div className="text-[11px] text-muted-foreground">{h.location} · {formatMoney(h.pricePerNight, h.currency, i18n.language)} {t("travel.perNight")}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" aria-label={t("travel.favorites.toggle")} onClick={() => onToggle("hotel", h.id)} className="cursor-pointer"><Heart size={16} className="text-red-400 fill-red-400" /></button>
            <button type="button" onClick={() => onViewHotel(h)} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold cursor-pointer">{t("travel.viewButton")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
