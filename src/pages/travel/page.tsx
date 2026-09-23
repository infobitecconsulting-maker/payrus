import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import PageHeader from "@/components/ui/page-header.tsx";
import {
  Plane, Hotel, Star, MapPin, Clock, Wifi, Utensils, Car,
  ChevronRight, ChevronDown, Search, Calendar, Users, ArrowRight,
  ArrowUpRight, Shield, Zap, Heart, Filter, SlidersHorizontal,
  CheckCircle2, CreditCard, Sparkles, TrendingDown, Globe,
  Luggage, Coffee, BedDouble, Wind
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { PayRusLogo } from "@/pages/layout/AppLayout.tsx";
import { toast } from "sonner";
import { useCurrentAppUser } from "@/hooks/use-current-app-user.ts";
import { useBookTravelItemMutation, useFlights, useHotels } from "@/hooks/use-backend.ts";
import type { AppFlight, AppHotel } from "@/lib/backend.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

type SearchTab = "flights" | "hotels";
type FlightClass = "economy" | "business" | "first";

interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  logo: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  priceXAF: number;
  class: FlightClass;
  amenities: string[];
  seatsLeft: number;
  rating: number;
  payrusDiscount: number;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  priceXAF: number;
  image: string;
  amenities: string[];
  distance: string;
  payrusMember: boolean;
  discount: number;
  category: string;
}

interface UserReview {
  id: string;
  user: string;
  flag: string;
  rating: number;
  comment: string;
  date: string;
  type: "flight" | "hotel";
  entity: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const FLIGHTS: Flight[] = [
  {
    id: "f1",
    airline: "Air France",
    airlineCode: "AF",
    logo: "✈️",
    origin: "KIN",
    destination: "CDG",
    departure: "23:15",
    arrival: "09:30+1",
    duration: "10h 15m",
    stops: 0,
    price: 847,
    currency: "USD",
    priceXAF: 508_200,
    class: "economy",
    amenities: ["travel.amenity.wifi", "travel.amenity.meal", "travel.amenity.entertainment"],
    seatsLeft: 4,
    rating: 4.3,
    payrusDiscount: 7,
  },
  {
    id: "f2",
    airline: "Ethiopian Airlines",
    airlineCode: "ET",
    logo: "🛫",
    origin: "KIN",
    destination: "CDG",
    departure: "08:40",
    arrival: "21:05",
    duration: "12h 25m",
    stops: 1,
    price: 612,
    currency: "USD",
    priceXAF: 367_200,
    class: "economy",
    amenities: ["travel.amenity.meal", "travel.amenity.entertainment"],
    seatsLeft: 12,
    rating: 4.5,
    payrusDiscount: 5,
  },
  {
    id: "f3",
    airline: "Kenya Airways",
    airlineCode: "KQ",
    logo: "🦁",
    origin: "KIN",
    destination: "NBO",
    departure: "11:30",
    arrival: "14:55",
    duration: "3h 25m",
    stops: 0,
    price: 290,
    currency: "USD",
    priceXAF: 174_000,
    class: "economy",
    amenities: ["travel.amenity.meal", "USB"],
    seatsLeft: 8,
    rating: 4.2,
    payrusDiscount: 6,
  },
  {
    id: "f4",
    airline: "Brussels Airlines",
    airlineCode: "SN",
    logo: "🇧🇪",
    origin: "KIN",
    destination: "BRU",
    departure: "15:00",
    arrival: "22:45",
    duration: "9h 45m",
    stops: 0,
    price: 920,
    currency: "USD",
    priceXAF: 552_000,
    class: "economy",
    amenities: ["travel.amenity.wifi", "travel.amenity.meal", "travel.amenity.entertainment", "USB"],
    seatsLeft: 2,
    rating: 4.0,
    payrusDiscount: 8,
  },
  {
    id: "f5",
    airline: "Turkish Airlines",
    airlineCode: "TK",
    logo: "🌙",
    origin: "KIN",
    destination: "IST",
    departure: "02:20",
    arrival: "12:40",
    duration: "10h 20m",
    stops: 0,
    price: 710,
    currency: "USD",
    priceXAF: 426_000,
    class: "economy",
    amenities: ["travel.amenity.wifi", "travel.amenity.meal", "travel.amenity.entertainment", "USB"],
    seatsLeft: 18,
    rating: 4.6,
    payrusDiscount: 5,
  },
];

const HOTELS: Hotel[] = [
  {
    id: "h1",
    name: "Kempinski Hotel Fleuve Congo",
    location: "Kinshasa, RDC",
    stars: 5,
    rating: 4.8,
    reviewCount: 1240,
    pricePerNight: 185,
    currency: "USD",
    priceXAF: 111_000,
    image: "🏨",
    amenities: ["travel.amenity.wifi", "travel.amenity.pool", "Spa", "Restaurant", "Bar"],
    distance: "travel.distance.cityCenter",
    payrusMember: true,
    discount: 15,
    category: "Luxe",
  },
  {
    id: "h2",
    name: "Radisson Blu M'Bamou Palace",
    location: "Brazzaville, Congo",
    stars: 5,
    rating: 4.7,
    reviewCount: 876,
    pricePerNight: 155,
    currency: "USD",
    priceXAF: 93_000,
    image: "🌴",
    amenities: ["travel.amenity.wifi", "travel.amenity.pool", "Restaurant", "travel.amenity.conferenceRoom"],
    distance: "travel.distance.2kmFromCenter",
    payrusMember: true,
    discount: 12,
    category: "Luxe",
  },
  {
    id: "h3",
    name: "Hôtel Sultani",
    location: "Kinshasa, RDC",
    stars: 4,
    rating: 4.4,
    reviewCount: 592,
    pricePerNight: 95,
    currency: "USD",
    priceXAF: 57_000,
    image: "🏩",
    amenities: ["travel.amenity.wifi", "Restaurant", "Parking", "travel.amenity.ac"],
    distance: "Gombe, 500m",
    payrusMember: false,
    discount: 0,
    category: "Affaires",
  },
  {
    id: "h4",
    name: "Serena Hotel Nairobi",
    location: "Nairobi, Kenya",
    stars: 5,
    rating: 4.9,
    reviewCount: 2100,
    pricePerNight: 210,
    currency: "USD",
    priceXAF: 126_000,
    image: "🦒",
    amenities: ["travel.amenity.wifi", "travel.amenity.pool", "Spa", "Restaurant", "Gym", "Bar"],
    distance: "Parc Uhuru",
    payrusMember: true,
    discount: 10,
    category: "Luxe",
  },
  {
    id: "h5",
    name: "Sofitel Abidjan Hôtel Ivoire",
    location: "Abidjan, Côte d'Ivoire",
    stars: 5,
    rating: 4.6,
    reviewCount: 1580,
    pricePerNight: 172,
    currency: "USD",
    priceXAF: 103_200,
    image: "🌺",
    amenities: ["travel.amenity.wifi", "travel.amenity.pool", "Spa", "Restaurant", "Casino"],
    distance: "Cocody, 1 km",
    payrusMember: true,
    discount: 18,
    category: "Luxe",
  },
];

// Real flights/hotels (supabase/migrations/0018) are a plainer catalog
// (no amenities/seatsLeft/rating/discount) — mapped into the same rich
// Flight/Hotel shape the existing browse UI already renders, with
// reasonable decorative placeholders for the fields the real schema
// doesn't track, so no JSX below needs to branch on real-vs-mock.
function toDisplayFlight(f: AppFlight): Flight {
  return {
    id: f.id, airline: f.airline, airlineCode: f.airline.slice(0, 2).toUpperCase(), logo: "✈️",
    origin: f.origin, destination: f.destination, departure: f.departure, arrival: f.arrival, duration: f.duration,
    stops: 0, price: f.price, currency: f.currency, priceXAF: f.price, class: f.class as FlightClass,
    amenities: [], seatsLeft: 9, rating: 4.5, payrusDiscount: 0,
  };
}

function toDisplayHotel(h: AppHotel): Hotel {
  return {
    id: h.id, name: h.name, location: h.location, stars: h.stars, rating: 4.5, reviewCount: 0,
    pricePerNight: h.pricePerNight, currency: h.currency, priceXAF: h.pricePerNight, image: "🏨",
    amenities: [], distance: "", payrusMember: false, discount: 0, category: "Standard",
  };
}

const REVIEWS: UserReview[] = [
  { id: "r1", user: "Mvutu E.", flag: "🇨🇩", rating: 5, comment: "travel.review.r1", date: "travel.review.r1Date", type: "flight", entity: "Ethiopian Airlines" },
  { id: "r2", user: "Laeticia B.", flag: "🇨🇬", rating: 5, comment: "travel.review.r2", date: "travel.review.r2Date", type: "hotel", entity: "Kempinski Hotel Fleuve Congo" },
  { id: "r3", user: "Diallo M.", flag: "🇸🇳", rating: 4, comment: "travel.review.r3", date: "travel.review.r3Date", type: "flight", entity: "Turkish Airlines" },
  { id: "r4", user: "Amara K.", flag: "🇨🇮", rating: 5, comment: "travel.review.r4", date: "travel.review.r4Date", type: "hotel", entity: "Sofitel Abidjan Hôtel Ivoire" },
  { id: "r5", user: "Père T.", flag: "🇰🇪", rating: 4, comment: "travel.review.r5", date: "travel.review.r5Date", type: "flight", entity: "Kenya Airways" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toLocaleString()}`;
  if (currency === "XAF") return `${amount.toLocaleString()} XAF`;
  return `${amount.toLocaleString()} ${currency}`;
}

function StarsDisplay({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < count ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
      ))}
    </div>
  );
}

// ── Split Payment Modal ────────────────────────────────────────────────────────

interface SplitPaymentModalProps {
  price: number;
  currency: string;
  item: string;
  onClose: () => void;
}

function SplitPaymentModal({ price, currency, item, onClose }: SplitPaymentModalProps) {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<"choose" | "confirm" | "success">("choose");
  const term1 = Math.round(price * 0.34);
  const term2 = Math.round(price * 0.33);
  const term3 = price - term1 - term2;
  const fee = Math.round(price * 0.025);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <CreditCard size={15} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{t("travel.splitPayment.title")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("travel.splitPayment.subtitle")}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-6 space-y-5">
              {/* Flight summary */}
              <div className="rounded-2xl bg-secondary/50 p-4">
                <div className="text-[11px] text-muted-foreground mb-1">{t("travel.splitPayment.selectedTicket")}</div>
                <div className="text-sm font-semibold text-foreground">{item}</div>
                <div className="text-xl font-black text-primary font-mono mt-1">{formatCurrency(price, currency)}</div>
              </div>

              {/* 3 Terms */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-3">{t("travel.splitPayment.yourPlan")}</div>
                <div className="space-y-2">
                  {[
                    { label: t("travel.splitPayment.termNow"), amount: term1, date: t("common.today"), badge: "bg-primary/15 text-primary border-primary/25" },
                    { label: t("travel.splitPayment.termIn30Days"), amount: term2, date: "Dec 12, 2024", badge: "bg-secondary border-border text-muted-foreground" },
                    { label: t("travel.splitPayment.termIn60Days"), amount: term3, date: "Jan 11, 2025", badge: "bg-secondary border-border text-muted-foreground" },
                  ].map((term, i) => (
                    <div key={i} className={cn("flex items-center justify-between px-4 py-3 rounded-xl border", term.badge)}>
                      <div>
                        <div className="text-xs font-semibold">{term.label}</div>
                        <div className="text-[10px] opacity-70">{term.date}</div>
                      </div>
                      <div className="text-sm font-black font-mono">{formatCurrency(term.amount, currency)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Shield size={13} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  {t("travel.splitPayment.feeNoticePrefix")} <span className="text-amber-700 font-semibold">{formatCurrency(fee, currency)}</span> {t("travel.splitPayment.feeNoticeSuffix")}
                </p>
              </div>

              <button onClick={() => setStep("confirm")}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
                {t("travel.splitPayment.confirmButton")}
              </button>
              <button onClick={onClose} className="w-full text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t("common.cancel")}</button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-6 space-y-5">
              <div className="text-sm text-muted-foreground">{t("travel.splitPayment.confirmInitialLabel")}</div>
              <div className="text-3xl font-black text-primary font-mono text-center py-4">{formatCurrency(term1 + fee, currency)}</div>
              <div className="text-[11px] text-muted-foreground text-center">{t("travel.splitPayment.debitedNow")}</div>
              <button onClick={() => setStep("success")}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
                {t("travel.splitPayment.payNowButton", { amount: formatCurrency(term1 + fee, currency) })}
              </button>
              <button onClick={() => setStep("choose")} className="w-full text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t("common.back")}</button>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="p-8 text-center space-y-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-primary" />
              </motion.div>
              <div>
                <div className="text-lg font-black text-foreground">{t("travel.splitPayment.successTitle")}</div>
                <div className="text-sm text-muted-foreground mt-1">{t("travel.splitPayment.successSubtitle")}</div>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-4 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("travel.splitPayment.reference")}</span>
                  <span className="font-mono font-semibold text-foreground">PYR-{Math.random().toString(36).slice(2, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("travel.splitPayment.firstInstallment")}</span>
                  <span className="font-semibold text-primary font-mono">{formatCurrency(term1 + fee, currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("travel.splitPayment.remainingBalance")}</span>
                  <span className="font-semibold text-foreground font-mono">{formatCurrency(term2 + term3, currency)}</span>
                </div>
              </div>
              <button onClick={onClose} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
                {t("travel.splitPayment.viewBookingsButton")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Review Form ────────────────────────────────────────────────────────────────

function ReviewForm({ onSubmit }: { onSubmit: () => void }) {
  const { t } = useTranslation("common");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const ratingLabels = t("travel.reviewForm.ratingLabels", { returnObjects: true }) as string[];

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <h3 className="text-sm font-bold text-foreground">{t("travel.leaveReview")}</h3>
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i}
            onMouseEnter={() => setHoveredStar(i + 1)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(i + 1)}
            className="cursor-pointer transition-transform hover:scale-125">
            <Star size={24} className={i < (hoveredStar || rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-muted-foreground ml-2">{ratingLabels[rating]}</span>}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder={t("travel.reviewForm.placeholder")}
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50"
      />
      <button
        onClick={() => { if (rating > 0 && comment.trim()) { onSubmit(); } else { toast.error(t("travel.reviewForm.toastError")); } }}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
      >
        {t("travel.reviewForm.submitButton")}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TravelPage() {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<SearchTab>("flights");
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [splitPaymentFor, setSplitPaymentFor] = useState<{ price: number; currency: string; item: string } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [booking, setBooking] = useState<string | null>(null);

  const currentUser = useCurrentAppUser();
  const realFlights = useFlights();
  const realHotels = useHotels();
  const bookTravelItem = useBookTravelItemMutation();

  // Real catalog once signed in with data to show; anonymous/no-data
  // visitors keep the existing rich mock catalog — same fallback
  // convention used throughout this migration.
  const hasRealFlights = !!currentUser && !!realFlights && realFlights.length > 0;
  const hasRealHotels = !!currentUser && !!realHotels && realHotels.length > 0;
  const displayFlights: Flight[] = hasRealFlights ? realFlights.map(toDisplayFlight) : FLIGHTS;
  const displayHotels: Hotel[] = hasRealHotels ? realHotels.map(toDisplayHotel) : HOTELS;

  async function handleBookFlight(flight: Flight) {
    const showToast = () => toast.success(t("travel.flightBookedToast", { airline: flight.airline, price: formatCurrency(flight.price, flight.currency) }));
    if (!currentUser || !hasRealFlights) { showToast(); return; }
    setBooking(flight.id);
    try {
      await bookTravelItem({ userId: currentUser.id, kind: "flight", itemId: flight.id, note: `${flight.airline} ${flight.origin}→${flight.destination}` });
      showToast();
    } catch {
      toast.error(t("travel.bookingFailed"));
    } finally {
      setBooking(null);
    }
  }

  async function handleBookHotel(hotel: Hotel) {
    const showToast = () => toast.success(t("travel.hotelBookedToast", { name: hotel.name }));
    if (!currentUser || !hasRealHotels) { showToast(); return; }
    setBooking(hotel.id);
    try {
      await bookTravelItem({ userId: currentUser.id, kind: "hotel", itemId: hotel.id, note: hotel.name });
      showToast();
    } catch {
      toast.error(t("travel.bookingFailed"));
    } finally {
      setBooking(null);
    }
  }

  const toggleLike = (id: string) => {
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back navigation */}
      <div className="px-5 pt-5 pb-0 shrink-0">
        <PageHeader title={t("travel.title")} className="mb-4 md:mb-6" />
      </div>
      {/* ── Header ── */}
      <div className="px-5 pt-0 pb-4 border-b border-border bg-sidebar/40 shrink-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Plane size={20} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">{t("travel.heading")}</h1>
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">PayRus Travel</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("travel.subheading")}</p>
            </div>
          </div>
          {/* PayRus member badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5">
            <div className="rounded-lg bg-white px-2 py-1">
              <PayRusLogo className="h-5 w-auto" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-primary">{t("travel.memberBadge")}</div>
              <div className="text-[9px] text-muted-foreground">{t("travel.upTo18Discount")}</div>
            </div>
          </div>
        </div>

        {/* PayRus benefits strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {[
            { icon: TrendingDown, text: t("travel.benefits.bestRates"), color: "text-primary" },
            { icon: CreditCard, text: t("travel.benefits.splitPaymentNoFees"), color: "text-blue-700" },
            { icon: Zap, text: t("travel.benefits.instantConfirmation"), color: "text-amber-700" },
            { icon: Shield, text: t("travel.benefits.buyerProtection"), color: "text-emerald-700" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border whitespace-nowrap shrink-0">
              <b.icon size={12} className={b.color} />
              <span className="text-[11px] text-muted-foreground">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <div className="flex gap-1 mt-3">
          {([
            { id: "flights" as const, label: t("travel.tabFlights"), icon: Plane },
            { id: "hotels" as const, label: t("travel.tabHotels"), icon: Hotel },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                activeTab === tab.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}>
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">

          {/* ── Flights ── */}
          {activeTab === "flights" && (
            <motion.div key="flights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="p-4 md:p-5 space-y-5 max-w-4xl mx-auto">

              {/* Search bar */}
              <div className="rounded-2xl bg-card border border-border p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm font-medium text-foreground cursor-pointer">KIN · Kinshasa</div>
                  </div>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-primary/30 text-sm font-medium text-foreground cursor-pointer">CDG · Paris</div>
                  </div>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">Dec 12, 2024</div>
                  </div>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
                    <Search size={14} /> {t("travel.searchButton")}
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Users size={11} /> {t("travel.onePassenger")}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Luggage size={11} /> {t("travel.baggageIncluded")}
                  </div>
                  <button className="flex items-center gap-1.5 text-[11px] text-primary hover:underline cursor-pointer">
                    <SlidersHorizontal size={11} /> {t("travel.advancedFilters")}
                  </button>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[t("travel.filters.all"), t("travel.filters.nonStop"), t("travel.filters.under10h"), t("travel.filters.cheapest"), t("travel.filters.topRated"), t("travel.filters.payrusDiscount")].map((f, i) => (
                  <button key={f} className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer transition-colors",
                    i === 0 ? "bg-primary/15 text-primary border-primary/25" : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Flight results */}
              <div className="space-y-3">
                {displayFlights.map((flight, i) => (
                  <motion.div key={flight.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className={cn(
                      "rounded-2xl bg-card border overflow-hidden transition-all cursor-pointer group",
                      selectedFlight?.id === flight.id ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border hover:border-primary/25"
                    )}
                    onClick={() => setSelectedFlight(selectedFlight?.id === flight.id ? null : flight)}>

                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Airline */}
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">{flight.logo}</div>

                        {/* Route info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-foreground">{flight.airline}</span>
                            {flight.stops === 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{t("travel.direct")}</span>
                            )}
                            <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">{flight.class === "economy" ? t("travel.classEconomy") : t("travel.classBusiness")}</span>
                            {flight.seatsLeft <= 5 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                {t("travel.seatsRemaining", { count: flight.seatsLeft })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Departure */}
                            <div className="text-center">
                              <div className="text-xl font-black text-foreground font-mono">{flight.departure}</div>
                              <div className="text-[10px] text-muted-foreground font-medium">{flight.origin}</div>
                            </div>

                            {/* Duration */}
                            <div className="flex-1 flex flex-col items-center gap-1">
                              <div className="text-[10px] text-muted-foreground">{flight.duration}</div>
                              <div className="relative w-full flex items-center">
                                <div className="w-full h-px bg-border" />
                                <Plane size={12} className="absolute left-1/2 -translate-x-1/2 -translate-y-px text-primary" />
                              </div>
                              <div className="text-[10px] text-muted-foreground">{flight.stops === 0 ? t("travel.nonStopLabel") : t("travel.stopsCount", { count: flight.stops })}</div>
                            </div>

                            {/* Arrival */}
                            <div className="text-center">
                              <div className="text-xl font-black text-foreground font-mono">{flight.arrival}</div>
                              <div className="text-[10px] text-muted-foreground font-medium">{flight.destination}</div>
                            </div>
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-2">
                          <button onClick={e => { e.stopPropagation(); toggleLike(flight.id); }}
                            className="cursor-pointer transition-colors">
                            <Heart size={15} className={likedItems.has(flight.id) ? "text-red-400 fill-red-400" : "text-muted-foreground"} />
                          </button>
                          <div>
                            {flight.payrusDiscount > 0 && (
                              <div className="text-[10px] font-bold text-primary">{t("travel.membersDiscount", { pct: flight.payrusDiscount })}</div>
                            )}
                            <div className="text-xl font-black text-foreground font-mono">{formatCurrency(flight.price, flight.currency)}</div>
                            <div className="text-[10px] text-muted-foreground">{formatCurrency(flight.priceXAF, "XAF")}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            <span className="text-[11px] font-semibold text-foreground">{flight.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {flight.amenities.map(a => (
                          <div key={a} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary border border-border text-[10px] text-muted-foreground">
                            {a === "travel.amenity.wifi" ? <Wifi size={9} /> : a === "travel.amenity.meal" ? <Utensils size={9} /> : <Zap size={9} />}
                            {t(a)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expanded CTA */}
                    <AnimatePresence>
                      {selectedFlight?.id === flight.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={e => { e.stopPropagation(); setSplitPaymentFor({ price: flight.price, currency: flight.currency, item: `${flight.airline} · ${flight.origin}→${flight.destination}` }); }}
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-primary/30 bg-primary/5 text-primary text-sm font-bold cursor-pointer hover:bg-primary/15 transition-colors"
                              >
                                <CreditCard size={15} /> {t("travel.payInThreeButton")}
                              </button>
                              <button
                                disabled={booking === flight.id}
                                onClick={e => { e.stopPropagation(); void handleBookFlight(flight); }}
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-60"
                              >
                                {booking === flight.id ? t("signin.checking") : t("travel.bookNowButton")} <ArrowRight size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Shield size={11} className="text-emerald-700" />
                              {t("travel.freeRefundNotice")}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Reviews section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">{t("travel.reviewsHeadingFlights")}</h2>
                  <button onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-[11px] text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                    <Star size={11} /> {t("travel.leaveReview")}
                  </button>
                </div>

                <AnimatePresence>
                  {showReviewForm && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <ReviewForm onSubmit={() => { setShowReviewForm(false); toast.success(t("travel.reviewPublishedToast")); }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {REVIEWS.filter(r => r.type === "flight").map((review, i) => (
                    <motion.div key={review.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl bg-card border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base">{review.flag}</div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">{review.user}</div>
                            <div className="text-[10px] text-muted-foreground">{review.entity}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarsDisplay count={review.rating} />
                          <div className="text-[10px] text-muted-foreground">{t(review.date)}</div>
                        </div>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{t(review.comment)}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Hotels ── */}
          {activeTab === "hotels" && (
            <motion.div key="hotels" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="p-4 md:p-5 space-y-5 max-w-4xl mx-auto">

              {/* Search bar */}
              <div className="rounded-2xl bg-card border border-border p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">{t("travel.destinationPlaceholder")}</div>
                  </div>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">{t("travel.checkInPlaceholder")}</div>
                  </div>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">{t("travel.checkOutPlaceholder")}</div>
                  </div>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
                    <Search size={14} /> {t("travel.searchButton")}
                  </button>
                </div>
              </div>

              {/* PayRus member benefit banner */}
              <div className="rounded-2xl overflow-hidden border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 shrink-0">
                    <PayRusLogo className="h-6 w-auto" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{t("travel.partnerHotelsTitle")}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{t("travel.partnerHotelsPrefix")} <span className="text-primary font-semibold">{t("travel.partnerHotelsHighlight")}</span> {t("travel.partnerHotelsSuffix")}</div>
                  </div>
                  <Sparkles size={20} className="text-primary ml-auto shrink-0" />
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[t("travel.filters.all"), t("travel.filters.payrusPartners"), t("travel.filters.luxury5star"), t("travel.filters.business"), t("travel.filters.under150"), t("travel.filters.pool"), t("travel.filters.spa")].map((f, i) => (
                  <button key={f} className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer transition-colors",
                    i === 0 ? "bg-primary/15 text-primary border-primary/25" : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Hotel grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayHotels.map((hotel, i) => (
                  <motion.div key={hotel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/25 transition-all group cursor-pointer">

                    {/* Image area */}
                    <div className="relative h-36 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
                      <span className="text-5xl">{hotel.image}</span>
                      {/* Like */}
                      <button onClick={() => toggleLike(hotel.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-card transition-colors">
                        <Heart size={14} className={likedItems.has(hotel.id) ? "text-red-400 fill-red-400" : "text-muted-foreground"} />
                      </button>
                      {/* PayRus badge */}
                      {hotel.payrusMember && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/90 backdrop-blur-sm">
                          <div className="rounded px-1 bg-white">
                            <PayRusLogo className="h-3 w-auto" />
                          </div>
                          <span className="text-[10px] font-bold text-primary-foreground">-{hotel.discount}%</span>
                        </div>
                      )}
                      {/* Stars */}
                      <div className="absolute bottom-3 left-3">
                        <StarsDisplay count={hotel.stars} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-foreground truncate">{hotel.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground truncate">{hotel.location}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-black text-foreground font-mono">${hotel.pricePerNight}</div>
                          <div className="text-[10px] text-muted-foreground">{t("travel.perNight")}</div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-[11px] font-bold text-amber-700">{hotel.rating}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{t("travel.reviewsCountLabel", { count: hotel.reviewCount.toLocaleString() })}</span>
                        <span className="text-[10px] text-muted-foreground">· {t(hotel.distance)}</span>
                      </div>

                      {/* Amenities */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {hotel.amenities.slice(0, 4).map(a => (
                          <div key={a} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-[9px] text-muted-foreground border border-border">
                            {a === "travel.amenity.wifi" ? <Wifi size={8} /> : a === "travel.amenity.pool" ? <Wind size={8} /> : a === "Restaurant" ? <Coffee size={8} /> : a === "Spa" ? <Sparkles size={8} /> : <BedDouble size={8} />}
                            {t(a)}
                          </div>
                        ))}
                        {hotel.amenities.length > 4 && (
                          <span className="text-[9px] text-muted-foreground">+{hotel.amenities.length - 4}</span>
                        )}
                      </div>

                      {/* CTAs */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => toast.success(t("travel.addedToFavoritesToast", { name: hotel.name }))}
                          className="py-2 rounded-xl border border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                          <Globe size={12} /> {t("travel.viewButton")}
                        </button>
                        <button
                          disabled={booking === hotel.id}
                          onClick={() => void handleBookHotel(hotel)}
                          className="py-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold cursor-pointer hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                          {booking === hotel.id ? t("signin.checking") : t("travel.reserveButton")} <ArrowUpRight size={12} />
                        </button>
                      </div>

                      {/* Member price */}
                      {hotel.payrusMember && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary">
                          <CheckCircle2 size={10} />
                          {t("travel.memberPrice")} <span className="font-bold font-mono">${Math.round(hotel.pricePerNight * (1 - hotel.discount / 100))}/{t("travel.nightAbbrev")}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Hotel Reviews */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">{t("travel.reviewsHeadingHotels")}</h2>
                  <button onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-[11px] text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                    <Star size={11} /> {t("travel.leaveReview")}
                  </button>
                </div>

                <AnimatePresence>
                  {showReviewForm && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <ReviewForm onSubmit={() => { setShowReviewForm(false); toast.success(t("travel.reviewPublishedToast")); }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {REVIEWS.filter(r => r.type === "hotel").map((review, i) => (
                    <motion.div key={review.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl bg-card border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base">{review.flag}</div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">{review.user}</div>
                            <div className="text-[10px] text-muted-foreground">{review.entity}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarsDisplay count={review.rating} />
                          <div className="text-[10px] text-muted-foreground">{t(review.date)}</div>
                        </div>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{t(review.comment)}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Split Payment Modal */}
      <AnimatePresence>
        {splitPaymentFor && (
          <SplitPaymentModal
            {...splitPaymentFor}
            onClose={() => setSplitPaymentFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
