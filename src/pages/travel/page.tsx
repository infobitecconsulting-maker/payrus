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
    amenities: ["WiFi", "Repas", "Divertissement"],
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
    amenities: ["Repas", "Divertissement"],
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
    amenities: ["Repas", "USB"],
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
    amenities: ["WiFi", "Repas", "Divertissement", "USB"],
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
    amenities: ["WiFi", "Repas", "Divertissement", "USB"],
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
    amenities: ["WiFi", "Piscine", "Spa", "Restaurant", "Bar"],
    distance: "Centre-ville",
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
    amenities: ["WiFi", "Piscine", "Restaurant", "Salle de conf."],
    distance: "2 km du centre",
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
    amenities: ["WiFi", "Restaurant", "Parking", "Climatisation"],
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
    amenities: ["WiFi", "Piscine", "Spa", "Restaurant", "Gym", "Bar"],
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
    amenities: ["WiFi", "Piscine", "Spa", "Restaurant", "Casino"],
    distance: "Cocody, 1 km",
    payrusMember: true,
    discount: 18,
    category: "Luxe",
  },
];

const REVIEWS: UserReview[] = [
  { id: "r1", user: "Mvutu E.", flag: "🇨🇩", rating: 5, comment: "Ethiopian Airlines — excellent service, repas délicieux. Vol direct très appréciable!", date: "12 nov 2024", type: "flight", entity: "Ethiopian Airlines" },
  { id: "r2", user: "Laeticia B.", flag: "🇨🇬", rating: 5, comment: "Kempinski Fleuve Congo — vue sur le fleuve magnifique, service impeccable. Réservé via PayRus, -15% !", date: "8 nov 2024", type: "hotel", entity: "Kempinski Hotel Fleuve Congo" },
  { id: "r3", user: "Diallo M.", flag: "🇸🇳", rating: 4, comment: "Turkish Airlines depuis KIN, correspondance Istanbul parfaite. WiFi fonctionnel tout le vol.", date: "5 nov 2024", type: "flight", entity: "Turkish Airlines" },
  { id: "r4", user: "Amara K.", flag: "🇨🇮", rating: 5, comment: "Sofitel Ivoire — événement d'entreprise organisé via PayRus. Facturation directe sur compte corporate.", date: "2 nov 2024", type: "hotel", entity: "Sofitel Abidjan Hôtel Ivoire" },
  { id: "r5", user: "Père T.", flag: "🇰🇪", rating: 4, comment: "Kenya Airways KIN-NBO, ponctuel et agréable. Idéal pour le transit vers l'Asie via Nairobi.", date: "28 oct 2024", type: "flight", entity: "Kenya Airways" },
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
              <h3 className="text-sm font-bold text-foreground">Paiement en 3 fois</h3>
              <p className="text-[11px] text-muted-foreground">PayRus Pay Later — sans frais cachés</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-6 space-y-5">
              {/* Flight summary */}
              <div className="rounded-2xl bg-secondary/50 p-4">
                <div className="text-[11px] text-muted-foreground mb-1">Billet sélectionné</div>
                <div className="text-sm font-semibold text-foreground">{item}</div>
                <div className="text-xl font-black text-primary font-mono mt-1">{formatCurrency(price, currency)}</div>
              </div>

              {/* 3 Terms */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-3">Votre plan de paiement</div>
                <div className="space-y-2">
                  {[
                    { label: "Maintenant", amount: term1, date: "Aujourd'hui", badge: "bg-primary/15 text-primary border-primary/25" },
                    { label: "Dans 30 jours", amount: term2, date: "12 déc 2024", badge: "bg-secondary border-border text-muted-foreground" },
                    { label: "Dans 60 jours", amount: term3, date: "11 jan 2025", badge: "bg-secondary border-border text-muted-foreground" },
                  ].map((t, i) => (
                    <div key={i} className={cn("flex items-center justify-between px-4 py-3 rounded-xl border", t.badge)}>
                      <div>
                        <div className="text-xs font-semibold">{t.label}</div>
                        <div className="text-[10px] opacity-70">{t.date}</div>
                      </div>
                      <div className="text-sm font-black font-mono">{formatCurrency(t.amount, currency)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-400/8 border border-amber-400/20">
                <Shield size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  Frais de service PayRus Pay Later : <span className="text-amber-400 font-semibold">{formatCurrency(fee, currency)}</span> — inclus dans la 1ère mensualité.
                </p>
              </div>

              <button onClick={() => setStep("confirm")}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
                Confirmer le paiement en 3 fois
              </button>
              <button onClick={onClose} className="w-full text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Annuler</button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-6 space-y-5">
              <div className="text-sm text-muted-foreground">Confirmez votre paiement initial de</div>
              <div className="text-3xl font-black text-primary font-mono text-center py-4">{formatCurrency(term1 + fee, currency)}</div>
              <div className="text-[11px] text-muted-foreground text-center">Débité de votre solde PayRus maintenant</div>
              <button onClick={() => setStep("success")}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
                Payer {formatCurrency(term1 + fee, currency)} maintenant
              </button>
              <button onClick={() => setStep("choose")} className="w-full text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Retour</button>
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
                <div className="text-lg font-black text-foreground">Réservation confirmée !</div>
                <div className="text-sm text-muted-foreground mt-1">Vous recevrez votre billet par e-mail sous 5 minutes</div>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-4 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Référence</span>
                  <span className="font-mono font-semibold text-foreground">PYR-{Math.random().toString(36).slice(2, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">1ère mensualité</span>
                  <span className="font-semibold text-primary font-mono">{formatCurrency(term1 + fee, currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reste à payer</span>
                  <span className="font-semibold text-foreground font-mono">{formatCurrency(term2 + term3, currency)}</span>
                </div>
              </div>
              <button onClick={onClose} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors">
                Voir mes réservations
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
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <h3 className="text-sm font-bold text-foreground">Laisser un avis</h3>
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
        {rating > 0 && <span className="text-sm text-muted-foreground ml-2">{["", "Mauvais", "Médiocre", "Bien", "Très bien", "Excellent"][rating]}</span>}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Partagez votre expérience avec la communauté PayRus..."
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50"
      />
      <button
        onClick={() => { if (rating > 0 && comment.trim()) { onSubmit(); } else { toast.error("Veuillez noter et commenter."); } }}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
      >
        Publier l'avis
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
                <h1 className="text-lg font-bold text-foreground">Voyage & Style de vie</h1>
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">PayRus Travel</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Vols · Hôtels · Paiement en 3 fois · Avantages membres</p>
            </div>
          </div>
          {/* PayRus member badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5">
            <div className="rounded-lg bg-white px-2 py-1">
              <PayRusLogo className="h-5 w-auto" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-primary">Membre PayRus</div>
              <div className="text-[9px] text-muted-foreground">Jusqu'à 18% de réduction</div>
            </div>
          </div>
        </div>

        {/* PayRus benefits strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {[
            { icon: TrendingDown, text: "Meilleurs tarifs garantis", color: "text-primary" },
            { icon: CreditCard, text: "Paiement en 3 fois sans frais*", color: "text-blue-400" },
            { icon: Zap, text: "Confirmation instantanée", color: "text-amber-400" },
            { icon: Shield, text: "Protection acheteur incluse", color: "text-emerald-400" },
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
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">12 déc 2024</div>
                  </div>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
                    <Search size={14} /> Rechercher
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Users size={11} /> 1 passager
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Luggage size={11} /> Bagage inclus
                  </div>
                  <button className="flex items-center gap-1.5 text-[11px] text-primary hover:underline cursor-pointer">
                    <SlidersHorizontal size={11} /> Filtres avancés
                  </button>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["Tous", "Sans escale", "< 10h", "Moins cher", "Meilleures notes", "PayRus -5%+"].map((f, i) => (
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
                {FLIGHTS.map((flight, i) => (
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
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Direct</span>
                            )}
                            <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">{flight.class === "economy" ? "Économie" : "Affaires"}</span>
                            {flight.seatsLeft <= 5 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                {flight.seatsLeft} places restantes
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
                              <div className="text-[10px] text-muted-foreground">{flight.stops === 0 ? "Non-stop" : `${flight.stops} escale`}</div>
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
                              <div className="text-[10px] font-bold text-primary">-{flight.payrusDiscount}% membres</div>
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
                            {a === "WiFi" ? <Wifi size={9} /> : a === "Repas" ? <Utensils size={9} /> : <Zap size={9} />}
                            {a}
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
                                <CreditCard size={15} /> Payer en 3 fois
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); toast.success(`Billet ${flight.airline} réservé pour ${formatCurrency(flight.price, flight.currency)} !`); }}
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90 transition-colors"
                              >
                                Réserver maintenant <ArrowRight size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Shield size={11} className="text-emerald-400" />
                              Remboursement gratuit sous 24h · Protection acheteur PayRus incluse
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
                  <h2 className="text-sm font-bold text-foreground">Avis de la communauté PayRus</h2>
                  <button onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-[11px] text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                    <Star size={11} /> Laisser un avis
                  </button>
                </div>

                <AnimatePresence>
                  {showReviewForm && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <ReviewForm onSubmit={() => { setShowReviewForm(false); toast.success("Avis publié — merci !"); }} />
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
                          <div className="text-[10px] text-muted-foreground">{review.date}</div>
                        </div>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{review.comment}</p>
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
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">Destination</div>
                  </div>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">Arrivée</div>
                  </div>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="pl-8 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground cursor-pointer">Départ</div>
                  </div>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
                    <Search size={14} /> Rechercher
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
                    <div className="text-sm font-bold text-foreground">Hôtels partenaires PayRus</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Jusqu'à <span className="text-primary font-semibold">18% de réduction</span> pour les membres PayRus · Facture directe sur votre compte · Late checkout offert</div>
                  </div>
                  <Sparkles size={20} className="text-primary ml-auto shrink-0" />
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["Tous", "Partenaires PayRus", "Luxe 5★", "Affaires", "< 150$/nuit", "Piscine", "Spa"].map((f, i) => (
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
                {HOTELS.map((hotel, i) => (
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
                          <div className="text-[10px] text-muted-foreground">par nuit</div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-[11px] font-bold text-amber-400">{hotel.rating}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{hotel.reviewCount.toLocaleString()} avis</span>
                        <span className="text-[10px] text-muted-foreground">· {hotel.distance}</span>
                      </div>

                      {/* Amenities */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {hotel.amenities.slice(0, 4).map(a => (
                          <div key={a} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-[9px] text-muted-foreground border border-border">
                            {a === "WiFi" ? <Wifi size={8} /> : a === "Piscine" ? <Wind size={8} /> : a === "Restaurant" ? <Coffee size={8} /> : a === "Spa" ? <Sparkles size={8} /> : <BedDouble size={8} />}
                            {a}
                          </div>
                        ))}
                        {hotel.amenities.length > 4 && (
                          <span className="text-[9px] text-muted-foreground">+{hotel.amenities.length - 4}</span>
                        )}
                      </div>

                      {/* CTAs */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => toast.success(`${hotel.name} ajouté aux favoris!`)}
                          className="py-2 rounded-xl border border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                          <Globe size={12} /> Voir
                        </button>
                        <button
                          onClick={() => toast.success(`Réservation ${hotel.name} confirmée!`)}
                          className="py-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold cursor-pointer hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                          Réserver <ArrowUpRight size={12} />
                        </button>
                      </div>

                      {/* Member price */}
                      {hotel.payrusMember && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary">
                          <CheckCircle2 size={10} />
                          Prix membre: <span className="font-bold font-mono">${Math.round(hotel.pricePerNight * (1 - hotel.discount / 100))}/nuit</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Hotel Reviews */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">Avis hôtels — Communauté PayRus</h2>
                  <button onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-[11px] text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                    <Star size={11} /> Laisser un avis
                  </button>
                </div>

                <AnimatePresence>
                  {showReviewForm && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <ReviewForm onSubmit={() => { setShowReviewForm(false); toast.success("Avis publié — merci !"); }} />
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
                          <div className="text-[10px] text-muted-foreground">{review.date}</div>
                        </div>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">{review.comment}</p>
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
