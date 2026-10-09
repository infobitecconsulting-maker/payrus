import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Globe2, Hotel, Plane, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { cn } from "@/lib/utils.ts";
import { useBookPartnerQuoteMutation } from "@/hooks/use-backend.ts";
import {
  PartnerSearchError, searchPartnerFlights, searchPartnerHotels,
  type BookTravelResult, type PartnerFlightOffer, type PartnerHotelOffer,
} from "@/lib/backend.ts";
import { addDaysISO, bookingErrorKey, formatDate, formatMoney, priceQuote, toAirportCode, todayISO } from "./travel-utils.ts";

export type PartnerOffer = { kind: "flight"; offer: PartnerFlightOffer } | { kind: "hotel"; offer: PartnerHotelOffer };

type Status = "idle" | "loading" | "done" | "error";

function errorKey(e: unknown): string {
  if (e instanceof PartnerSearchError) {
    switch (e.code) {
      case "not_configured": return "travel.live.notConfigured";
      case "rate_limited": return "travel.live.rateLimited";
      case "bad_input": return "travel.live.badInput";
      case "unauthorized": return "travel.signInRequired";
      default: return "travel.live.upstream";
    }
  }
  return "travel.live.upstream";
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  const { t } = useTranslation("common");
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3" data-testid="live-offers">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"><Globe2 size={16} className="text-primary" /></div>
        <div>
          <div className="text-sm font-bold text-foreground">{title}</div>
          <div className="text-[11px] text-muted-foreground">{t("travel.live.subtitle")}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function StatusLine({ status, error, count }: { status: Status; error: string | null; count: number }) {
  const { t } = useTranslation("common");
  if (status === "loading") return <div className="text-xs text-muted-foreground flex items-center gap-2" role="status"><RefreshCw size={12} className="animate-spin" /> {t("travel.live.searching")}</div>;
  if (status === "error" && error) return <div className="text-xs text-destructive" role="alert" data-testid="live-error">{t(error)}</div>;
  if (status === "done" && count === 0) return <div className="text-xs text-muted-foreground" data-testid="live-empty">{t("travel.live.noResults")}</div>;
  return null;
}

const badge = (label: string) => (
  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">{label}</span>
);

export function PartnerFlightSearch({ origin, destination, date, passengers, userId, onBook }: {
  origin: string; destination: string; date: string; passengers: number; userId: string | undefined; onBook: (o: PartnerOffer) => void;
}) {
  const { t, i18n } = useTranslation("common");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<PartnerFlightOffer[]>([]);

  async function search() {
    if (!userId) { toast.error(t("travel.signInRequired")); return; }
    const from = toAirportCode(origin);
    const to = toAirportCode(destination);
    if (!from || !to) { setStatus("error"); setError("travel.live.needCodes"); return; }
    setStatus("loading"); setError(null);
    try {
      setOffers(await searchPartnerFlights({ origin: from, destination: to, date, passengers }));
      setStatus("done");
    } catch (e) {
      setError(errorKey(e)); setStatus("error");
    }
  }

  return (
    <Panel title={t("travel.live.flightsTitle")}>
      <button type="button" onClick={() => void search()} disabled={status === "loading"}
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90 disabled:opacity-60">
        {t("travel.live.searchButton")}
      </button>
      <StatusLine status={status} error={error} count={offers.length} />
      <div className="space-y-2">
        {offers.map((o) => (
          <div key={o.quoteId} className="rounded-xl bg-card border border-border p-3 flex items-center justify-between gap-3" data-testid="live-flight">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-foreground"><Plane size={12} className="text-primary" /> {o.airline} · {o.origin}→{o.destination} {badge(t("travel.live.partnerBadge"))}</div>
              <div className="text-[11px] text-muted-foreground">{o.departure} → {o.arrival} · {o.duration} · {o.stops === 0 ? t("travel.nonStopLabel") : t("travel.stopsCount", { count: o.stops })} · {o.cabin === "business" ? t("travel.classBusiness") : t("travel.classEconomy")}</div>
              <div className="text-[10px] text-muted-foreground">{formatDate(o.departureDate, i18n.language)} · {t("travel.search.passengerCount", { count: o.passengers })}{o.seatsLeft !== null && o.seatsLeft <= 5 ? ` · ${t("travel.seatsRemaining", { count: o.seatsLeft })}` : ""}</div>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div className="text-base font-black font-mono" data-testid="live-price">{formatMoney(o.price, o.currency, i18n.language)}</div>
              <button type="button" onClick={() => onBook({ kind: "flight", offer: o })} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer">{t("travel.bookNowButton")}</button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function PartnerHotelSearch({ place, checkIn, checkOut, userId, onBook }: {
  place: string; checkIn: string; checkOut: string; userId: string | undefined; onBook: (o: PartnerOffer) => void;
}) {
  const { t, i18n } = useTranslation("common");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<PartnerHotelOffer[]>([]);

  async function search() {
    if (!userId) { toast.error(t("travel.signInRequired")); return; }
    if (place.trim().length < 2) { setStatus("error"); setError("travel.live.needPlace"); return; }
    setStatus("loading"); setError(null);
    try {
      setOffers(await searchPartnerHotels({ place: place.trim(), checkIn, checkOut, guests: 1 }));
      setStatus("done");
    } catch (e) {
      setError(errorKey(e)); setStatus("error");
    }
  }

  return (
    <Panel title={t("travel.live.hotelsTitle")}>
      <button type="button" onClick={() => void search()} disabled={status === "loading"}
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90 disabled:opacity-60">
        {t("travel.live.searchButton")}
      </button>
      <StatusLine status={status} error={error} count={offers.length} />
      <div className="space-y-2">
        {offers.map((o) => (
          <div key={o.quoteId} className="rounded-xl bg-card border border-border p-3 flex items-center justify-between gap-3" data-testid="live-hotel">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-foreground"><Hotel size={12} className="text-primary" /> {o.name} {badge(t("travel.live.partnerBadge"))}</div>
              <div className="text-[11px] text-muted-foreground truncate">{o.room || o.cityCode}</div>
              <div className="text-[10px] text-muted-foreground">{formatDate(o.checkIn, i18n.language)} → {formatDate(o.checkOut, i18n.language)} · {t("travel.search.nightsLabel", { count: o.nights })} · {formatMoney(o.perNight, o.currency, i18n.language)} {t("travel.perNight")}</div>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div className="text-base font-black font-mono" data-testid="live-price">{formatMoney(o.price, o.currency, i18n.language)}</div>
              <button type="button" onClick={() => onBook({ kind: "hotel", offer: o })} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer">{t("travel.reserveButton")}</button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function PartnerBookingDialog({ item, userId, onClose, onViewBookings }: {
  item: PartnerOffer; userId: string | undefined; onClose: () => void; onViewBookings: () => void;
}) {
  const { t, i18n } = useTranslation("common");
  const { lng } = useParams();
  const navigate = useNavigate();
  const book = useBookPartnerQuoteMutation();
  const [installments, setInstallments] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BookTravelResult | null>(null);
  const today = todayISO();

  const offer = item.offer;
  const title = item.kind === "flight" ? `${item.offer.airline} · ${item.offer.origin}→${item.offer.destination}` : item.offer.name;
  const detail = item.kind === "flight"
    ? `${formatDate(item.offer.departureDate, i18n.language)} · ${item.offer.departure} → ${item.offer.arrival} · ${t("travel.search.passengerCount", { count: item.offer.passengers })}`
    : `${formatDate(item.offer.checkIn, i18n.language)} → ${formatDate(item.offer.checkOut, i18n.language)} · ${t("travel.search.nightsLabel", { count: item.offer.nights })}`;
  const quote = priceQuote(offer.price, 1, 0, installments);
  const fmt = (n: number) => formatMoney(n, offer.currency, i18n.language);
  const plan = [
    { label: t("travel.splitPayment.termNow"), amount: quote.term1 + quote.fee, date: today },
    { label: t("travel.splitPayment.termIn30Days"), amount: quote.term2, date: addDaysISO(today, 30) },
    { label: t("travel.splitPayment.termIn60Days"), amount: quote.term3, date: addDaysISO(today, 60) },
  ];

  async function confirm() {
    if (!userId) return;
    setBusy(true);
    try {
      setResult(await book({ userId, quoteId: offer.quoteId, installments, note: title }));
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      toast.error(msg.includes("expired") ? t("travel.live.expired") : msg.includes("already booked") ? t("travel.live.alreadyBooked") : t(bookingErrorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden gap-0" data-testid="partner-booking-dialog">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center"><Globe2 size={15} className="text-primary" /></span>
            {result ? t("travel.splitPayment.successTitle") : t("travel.booking.title")}
          </DialogTitle>
          <DialogDescription className="text-[11px]">{title} · {t("travel.live.partnerBadge")}</DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-auto">
            <div className="rounded-xl bg-secondary px-3 py-2 text-xs text-foreground">{detail}</div>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("travel.booking.payMode")}>
              {[false, true].map((mode) => (
                <button key={String(mode)} type="button" role="radio" aria-checked={installments === mode} onClick={() => setInstallments(mode)}
                  className={cn("rounded-xl border px-3 py-2.5 text-left cursor-pointer transition-colors", installments === mode ? "border-primary bg-primary/10" : "border-border hover:border-primary/30")}>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">{mode ? <CreditCard size={12} /> : <Wallet size={12} />} {mode ? t("travel.payInThreeButton") : t("travel.booking.payInFull")}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{mode ? t("travel.booking.payInThreeHint") : t("travel.booking.payInFullHint")}</div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-secondary/50 p-4 space-y-1.5 text-xs" data-testid="price-breakdown">
              <div className="flex justify-between border-b border-border pb-1.5 text-sm font-bold"><span>{t("travel.booking.total")}</span><span className="font-mono text-primary" data-testid="booking-total">{fmt(quote.total)}</span></div>
              {installments && (
                <div className="pt-1 space-y-1.5">
                  {plan.map((p, i) => (
                    <div key={i} className="flex justify-between text-[11px]"><span className="text-muted-foreground">{p.label} · {formatDate(p.date, i18n.language)}</span><span className="font-mono font-semibold">{fmt(p.amount)}</span></div>
                  ))}
                  <div className="text-[10px] text-muted-foreground">{t("travel.splitPayment.feeNoticePrefix")} {fmt(quote.fee)} {t("travel.splitPayment.feeNoticeSuffix")}</div>
                </div>
              )}
              <div className="flex justify-between pt-1 text-[11px]"><span className="text-muted-foreground">{t("travel.booking.chargedNow")}</span><span className="font-mono font-bold">{fmt(quote.chargedNow)}</span></div>
            </div>

            <p className="text-[11px] text-muted-foreground">{t("travel.live.bookingNote")}</p>

            {userId ? (
              <button type="button" disabled={busy} onClick={() => void confirm()}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-60">
                {busy ? t("signin.checking") : t("travel.splitPayment.payNowButton", { amount: fmt(quote.chargedNow) })}
              </button>
            ) : (
              <button type="button" onClick={() => navigate(`/${lng ?? "en"}/signin`)} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer">{t("travel.booking.signInToBook")}</button>
            )}
            <button type="button" onClick={onClose} className="w-full text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t("common.cancel")}</button>
          </div>
        )}

        {result && (
          <div className="p-8 text-center space-y-5" data-testid="booking-success">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto"><CheckCircle2 size={32} className="text-primary" /></div>
            <div>
              <div className="text-lg font-black text-foreground">{t("travel.splitPayment.successTitle")}</div>
              <div className="text-sm text-muted-foreground mt-1">{t("travel.live.successSubtitle")}</div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("travel.splitPayment.reference")}</span><span className="font-mono font-semibold" data-testid="booking-reference">{result.reference}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("travel.booking.total")}</span><span className="font-mono font-semibold">{fmt(result.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("travel.booking.chargedNow")}</span><span className="font-mono font-semibold text-primary">{fmt(result.chargedNow)}</span></div>
            </div>
            <button type="button" onClick={() => { onClose(); onViewBookings(); }} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer">{t("travel.splitPayment.viewBookingsButton")}</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
