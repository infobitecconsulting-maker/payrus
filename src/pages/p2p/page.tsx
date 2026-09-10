"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import PageHeader from "@/components/ui/page-header.tsx";
import {
  Search, QrCode, UserPlus, ArrowRight, Star, Clock, Globe, Shield,
  Smartphone, Banknote, ChevronDown, CheckCircle, Send, X, ChevronRight,
  Building2, Users, MapPin, Wifi, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";
import { PayRusLogo } from "@/pages/layout/AppLayout.tsx";

/* ─── Types ───────────────────────────────────────────── */
type Step = "search" | "amount" | "confirm" | "success";

type PayRusUser = {
  id: string;
  name: string;
  username: string;
  country: string;
  countryCode: string;
  flag: string;
  avatar: string;
  currency: string;
  verified: boolean;
  online: boolean;
  role?: string;
};

/* ─── Mock PayRus network users ────────────────────────── */
const PAYRUS_USERS: PayRusUser[] = [
  { id: "u1", name: "Amara Koné", username: "@amara.kone", country: "RDC", countryCode: "CD", flag: "🇨🇩", avatar: "AK", currency: "CDF", verified: true, online: true },
  { id: "u2", name: "Jean Makoko", username: "@jean.makoko", country: "Congo-B", countryCode: "CG", flag: "🇨🇬", avatar: "JM", currency: "XAF", verified: true, online: false },
  { id: "u3", name: "Alice Umuhu", username: "@alice.umuhu", country: "Rwanda", countryCode: "RW", flag: "🇷🇼", avatar: "AU", currency: "RWF", verified: true, online: true },
  { id: "u4", name: "Paulo Damba", username: "@paulo.damba", country: "Angola", countryCode: "AO", flag: "🇦🇴", avatar: "PD", currency: "AOA", verified: false, online: true },
  { id: "u5", name: "Fatou Diallo", username: "@fatou.diallo", country: "Sénégal", countryCode: "SN", flag: "🇸🇳", avatar: "FD", currency: "XOF", verified: true, online: false },
  { id: "u6", name: "Chioma Obi", username: "@chioma.obi", country: "Nigeria", countryCode: "NG", flag: "🇳🇬", avatar: "CO", currency: "NGN", verified: true, online: true },
  { id: "u7", name: "Kwame Asante", username: "@kwame.asante", country: "Ghana", countryCode: "GH", flag: "🇬🇭", avatar: "KA", currency: "GHS", verified: true, online: false },
  { id: "u8", name: "Naledi Dlamini", username: "@naledi.dl", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦", avatar: "ND", currency: "ZAR", verified: true, online: false },
  { id: "u9", name: "Yohannes Tesfaye", username: "@yohannes.t", country: "Éthiopie", countryCode: "ET", flag: "🇪🇹", avatar: "YT", currency: "ETB", verified: false, online: true },
  { id: "u10", name: "Mariame Touré", username: "@mariame.toure", country: "France (Diaspora)", countryCode: "FR", flag: "🇫🇷", avatar: "MT", currency: "EUR", verified: true, online: true, role: "Diaspora" },
  { id: "u11", name: "Samuel Mensah", username: "@samuel.gh", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧", avatar: "SM", currency: "GBP", verified: true, online: false, role: "Diaspora" },
  { id: "u12", name: "Aïcha Ndiaye", username: "@aicha.ndiaye", country: "Canada", countryCode: "CA", flag: "🇨🇦", avatar: "AN", currency: "CAD", verified: true, online: true, role: "Diaspora" },
  { id: "u13", name: "Régis Nguimbi", username: "@regis.nguimbi", country: "Gabon", countryCode: "GA", flag: "🇬🇦", avatar: "RN", currency: "XAF", verified: true, online: true },
  { id: "u14", name: "Solange Bekono", username: "@solange.bekono", country: "Cameroun", countryCode: "CM", flag: "🇨🇲", avatar: "SB", currency: "XAF", verified: true, online: false },
  { id: "u15", name: "Ibrahim Adoum", username: "@ibrahim.adoum", country: "Tchad", countryCode: "TD", flag: "🇹🇩", avatar: "IA", currency: "XAF", verified: false, online: true },
];

const RECENT_IDS = ["u1", "u2", "u13", "u14", "u5"];

const CURRENCIES = ["CDF", "XAF", "USD", "EUR", "NGN", "GHS", "KES", "RWF", "XOF"];

const AVATAR_COLORS: Record<string, string> = {
  AK: "bg-purple-600", JM: "bg-teal-600", AU: "bg-pink-600", PD: "bg-orange-600",
  FD: "bg-emerald-600", CO: "bg-rose-600", KA: "bg-blue-600", ND: "bg-indigo-600",
  YT: "bg-amber-600", MT: "bg-cyan-600", SM: "bg-red-600", AN: "bg-green-600",
  RN: "bg-green-700", SB: "bg-fuchsia-600", IA: "bg-sky-700",
};

/* ─── Withdraw methods ─────────────────────────────────── */
const WITHDRAW_METHODS = [
  { id: "mm", label: "Mobile Money", icon: Smartphone, desc: "Orange, MTN, Airtel, M-Pesa", fee: "0%" },
  { id: "bank", label: "Virement bancaire", icon: Building2, desc: "Rawbank, Ecobank, Equity", fee: "0.5%" },
  { id: "cash", label: "Retrait en espèces", icon: Banknote, desc: "Agent PayRus · même jour", fee: "1%" },
  { id: "card", label: "Carte PayRus", icon: BadgeCheck, desc: "Vers votre carte liée", fee: "0%" },
];

/* ─── Avatar ────────────────────────────────────────────── */
function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold text-white shrink-0", sz, AVATAR_COLORS[initials] ?? "bg-primary")}>
      {initials}
    </div>
  );
}

/* ─── User Card ─────────────────────────────────────────── */
function UserCard({ user, onSelect }: { user: PayRusUser; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer text-left group"
    >
      <div className="relative">
        <Avatar initials={user.avatar} />
        {user.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground truncate">{user.name}</span>
          {user.verified && <BadgeCheck size={12} className="text-accent shrink-0" />}
        </div>
        <div className="text-xs text-muted-foreground">{user.username} · {user.flag} {user.country}</div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{user.currency}</span>
        {user.role && <span className="text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{user.role}</span>}
      </div>
      <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary shrink-0" />
    </button>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function P2PTransfer() {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<PayRusUser | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [note, setNote] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<string | null>(null);
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);

  const filtered = query.trim().length > 0
    ? PAYRUS_USERS.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.country.toLowerCase().includes(query.toLowerCase())
      )
    : PAYRUS_USERS.filter(u => RECENT_IDS.includes(u.id));

  const recentUsers = PAYRUS_USERS.filter(u => RECENT_IDS.includes(u.id));

  const fxRate = currency === "CDF" ? 1 : currency === "XAF" ? 0.003 : currency === "USD" ? 0.00035 : currency === "EUR" ? 0.00033 : 1;
  const numAmt = parseFloat(amount) || 0;
  const payrusMargin = numAmt * 0.075; // 7.5% PayRus fee
  const total = numAmt + payrusMargin;
  const received = numAmt * 0.925; // after margin

  function handleSelectUser(user: PayRusUser) {
    setSelectedUser(user);
    setStep("amount");
  }

  function handleSend() {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Entrez un montant valide");
      return;
    }
    setStep("confirm");
  }

  function handleConfirm() {
    setStep("success");
    toast.success(`Envoi de ${currency} ${numAmt.toLocaleString()} confirmé !`);
  }

  function reset() {
    setStep("search");
    setSelectedUser(null);
    setAmount("");
    setNote("");
    setWithdrawMethod(null);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeader title={t("p2p.title")} className="mb-4 md:mb-6" />

      {/* ── Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-lg bg-white px-2 py-1 shadow-md shadow-black/30">
          <PayRusLogo className="h-5 w-auto" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("p2p.heading")}</h1>
          <p className="text-xs text-muted-foreground">{t("p2p.subtitle")}</p>
        </div>
      </div>

      {/* ── Coverage banner */}
      <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 flex-wrap">
        <Globe size={14} className="text-primary shrink-0" />
        <span className="text-xs text-muted-foreground">
          <span className="text-primary font-semibold">{t("p2p.networkBanner")}</span> —
          {t("p2p.networkDesc")}
        </span>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Search ─── */}
        {step === "search" && (
          <motion.div key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* Search bar */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nom, @username, pays…"
                className="w-full pl-9 pr-10 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => toast.info("QR Code — bientôt disponible")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer">
                <QrCode size={14} /> Scanner QR
              </button>
              <button onClick={() => toast.info("Invite un ami — bientôt disponible")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer">
                <UserPlus size={14} /> Inviter un ami
              </button>
            </div>

            {/* Recent / search results */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {query ? (
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{filtered.length} résultat(s)</span>
                ) : (
                  <>
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Récents</span>
                  </>
                )}
              </div>
              <div className="space-y-2">
                {filtered.map(user => (
                  <UserCard key={user.id} user={user} onSelect={() => handleSelectUser(user)} />
                ))}
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Aucun utilisateur trouvé pour &quot;{query}&quot;
                  </div>
                )}
              </div>
            </div>

            {/* All members */}
            {!query && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={11} className="text-accent" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membres PayRus</span>
                </div>
                <div className="space-y-2">
                  {PAYRUS_USERS.filter(u => !RECENT_IDS.includes(u.id)).map(user => (
                    <UserCard key={user.id} user={user} onSelect={() => handleSelectUser(user)} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 2: Amount ─── */}
        {step === "amount" && selectedUser && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">

            {/* Recipient card */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border">
              <div className="relative">
                <Avatar initials={selectedUser.avatar} size="lg" />
                {selectedUser.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-background" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">{selectedUser.name}</span>
                  {selectedUser.verified && <BadgeCheck size={14} className="text-accent" />}
                </div>
                <div className="text-sm text-muted-foreground">{selectedUser.username}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{selectedUser.flag} {selectedUser.country} · {selectedUser.currency}</div>
              </div>
              <button onClick={() => setStep("search")} className="text-muted-foreground hover:text-foreground cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            {/* Amount input */}
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant à envoyer</div>

              <div className="flex gap-2">
                {/* Currency selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowCurrencyDrop(!showCurrencyDrop)}
                    className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground hover:bg-primary/10 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {currency} <ChevronDown size={12} />
                  </button>
                  {showCurrencyDrop && (
                    <div className="absolute top-full left-0 mt-1 z-30 bg-popover border border-border rounded-xl shadow-xl overflow-hidden w-28">
                      {CURRENCIES.map(c => (
                        <button key={c} onClick={() => { setCurrency(c); setShowCurrencyDrop(false); }} className={cn("w-full px-3 py-2 text-sm font-medium text-left hover:bg-primary/10 transition-colors cursor-pointer", c === currency && "text-primary bg-primary/5")}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-xl font-bold font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {numAmt > 0 && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Frais PayRus (7.5%)</span>
                    <span className="text-foreground font-medium">{currency} {payrusMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total débité</span>
                    <span className="text-foreground font-semibold">{currency} {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-primary font-semibold">Reçu par {selectedUser.name.split(" ")[0]}</span>
                    <span className="text-primary font-bold">{selectedUser.currency} {(received / fxRate / 3000).toLocaleString(undefined, { maximumFractionDigits: 0 })} ≈</span>
                  </div>
                </div>
              )}

              {/* Note */}
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note (optionnel) — ex: Loyer mars"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Withdraw method for recipient */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Banknote size={11} /> Mode de retrait du destinataire
              </div>
              <div className="grid grid-cols-2 gap-2">
                {WITHDRAW_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setWithdrawMethod(m.id)}
                    className={cn(
                      "flex flex-col gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer",
                      withdrawMethod === m.id ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <m.icon size={14} />
                      <span className="text-[9px] font-bold bg-primary/10 text-primary px-1 rounded">{m.fee}</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full gap-2 py-3 font-bold cursor-pointer" onClick={handleSend}>
              <Send size={16} /> Continuer → Confirmer
            </Button>
          </motion.div>
        )}

        {/* ── Step 3: Confirm ─── */}
        {step === "confirm" && selectedUser && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-accent/10 px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="rounded-md bg-white px-2 py-0.5">
                  <PayRusLogo className="h-4 w-auto" />
                </div>
                <span className="text-sm font-bold text-foreground">Confirmation du transfert</span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  ["De", "Jean Dupont · PayRus Wallet"],
                  ["Vers", `${selectedUser.name} (${selectedUser.username})`],
                  ["Pays", `${selectedUser.flag} ${selectedUser.country}`],
                  ["Montant envoyé", `${currency} ${numAmt.toLocaleString()}`],
                  ["Frais PayRus (7.5%)", `${currency} ${payrusMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
                  ["Total débité", `${currency} ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
                  ["Mode de retrait", withdrawMethod ? WITHDRAW_METHODS.find(m => m.id === withdrawMethod)?.label ?? "—" : "Non sélectionné"],
                  ...(note ? [["Note", note] as [string, string]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground text-right max-w-[55%] truncate">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="text-primary font-bold">Arrivée estimée</span>
                  <span className="text-primary font-bold">Instantané</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary border border-border">
              <Shield size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Transaction sécurisée · Cryptage 256-bit · Les frais PayRus (7.5%) permettent de maintenir le réseau de paiement panafricain.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="cursor-pointer" onClick={() => setStep("amount")}>Modifier</Button>
              <Button className="gap-2 cursor-pointer font-bold" onClick={handleConfirm}>
                <CheckCircle size={15} /> Confirmer l'envoi
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Success ─── */}
        {step === "success" && selectedUser && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="text-center space-y-5">

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <CheckCircle size={40} className="text-primary" />
              </motion.div>

              <div>
                <div className="text-2xl font-bold text-foreground">Envoi réussi !</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currency} {numAmt.toLocaleString()} envoyé à {selectedUser.name}
                </div>
              </div>

              <div className="rounded-md bg-white px-3 py-1.5 shadow-sm">
                <PayRusLogo className="h-5 w-auto" />
              </div>

              <div className="flex items-center gap-2 text-xs text-primary">
                <Wifi size={12} />
                <span>Instantané · {selectedUser.flag} {selectedUser.country}</span>
              </div>
            </div>

            <div className="rounded-xl bg-secondary border border-border p-4 text-xs space-y-2">
              <div className="font-semibold text-foreground text-sm mb-1">Référence de transaction</div>
              <div className="font-mono text-muted-foreground">PR-{Date.now().toString(36).toUpperCase()}</div>
              <div className="text-muted-foreground">
                {selectedUser.name} peut retirer via {withdrawMethod ? WITHDRAW_METHODS.find(m => m.id === withdrawMethod)?.label : "Mobile Money"} dans les prochaines minutes.
              </div>
            </div>

            <Button className="w-full gap-2 cursor-pointer" onClick={reset}>
              <ArrowRight size={15} /> Nouveau transfert
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
