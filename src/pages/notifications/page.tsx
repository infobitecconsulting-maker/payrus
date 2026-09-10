import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import PageHeader from "@/components/ui/page-header.tsx";
import {
  Bell, CheckCheck, ArrowDownLeft, ArrowUpRight, Shield,
  TrendingUp, Heart, Plane, Sparkles, AlertTriangle,
  Gift, RefreshCw, Info, Clock, X, Zap, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useProfile } from "@/contexts/profile-context.tsx";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifCategory = "all" | "transactions" | "security" | "updates" | "promotions";

type NotifType = "credit" | "debit" | "security" | "campaign" | "travel" | "system" | "promo" | "alert";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  amount?: number;
  currency?: string;
  category: NotifCategory;
  emoji: string;
}

// ── Mock data (profile-adaptive) ──────────────────────────────────────────────

const SHARED_NOTIFS: Notification[] = [
  {
    id: "n1", type: "credit", category: "transactions",
    title: "Paiement reçu",
    body: "Amara K. vous a envoyé XAF 75,000 depuis Abidjan",
    time: "Il y a 3 min", read: false, amount: 75000, currency: "XAF", emoji: "💸",
  },
  {
    id: "n2", type: "security", category: "security",
    title: "Nouvelle connexion détectée",
    body: "Connexion depuis un nouvel appareil — Kinshasa, RDC. C'est vous ?",
    time: "Il y a 12 min", read: false, emoji: "🔐",
  },
  {
    id: "n3", type: "credit", category: "transactions",
    title: "Virement reçu",
    body: "Diaspora · Paris — CDF 1,200,000 crédités sur votre compte",
    time: "Il y a 28 min", read: false, amount: 1200000, currency: "CDF", emoji: "🌍",
  },
  {
    id: "n4", type: "campaign", category: "transactions",
    title: "Don reçu — Collecte Kasaï",
    body: "Votre campagne a reçu un don de XAF 10,000. Total : XAF 2,184,000",
    time: "Il y a 1h", read: true, amount: 10000, currency: "XAF", emoji: "❤️",
  },
  {
    id: "n5", type: "travel", category: "promotions",
    title: "Offre voyage exclusive",
    body: "Vols KIN → CDG dès $612 avec -8% membres PayRus. Valable 48h.",
    time: "Il y a 2h", read: true, emoji: "✈️",
  },
  {
    id: "n6", type: "alert", category: "security",
    title: "Alerte taux de change",
    body: "USD/XAF atteint votre cible : 1 USD = 2,800 XAF. Moment idéal pour convertir.",
    time: "Il y a 3h", read: true, emoji: "📊",
  },
  {
    id: "n7", type: "debit", category: "transactions",
    title: "Paiement effectué",
    body: "Orange Money — Recharge XAF 5,000 pour +243 81 234 5678",
    time: "Il y a 5h", read: true, amount: -5000, currency: "XAF", emoji: "📱",
  },
  {
    id: "n8", type: "promo", category: "promotions",
    title: "Nouveau partenaire PayRus",
    body: "Kempinski Fleuve Congo rejoint PayRus Travel — -15% sur les réservations",
    time: "Hier", read: true, emoji: "🏨",
  },
  {
    id: "n9", type: "system", category: "updates",
    title: "Mise à jour PayRus 2.1.4",
    body: "Nouvelles fonctionnalités : Collecte de fonds, Voyage en 3 fois, Groupes améliorés",
    time: "Hier", read: true, emoji: "🚀",
  },
  {
    id: "n10", type: "alert", category: "security",
    title: "PIN modifié avec succès",
    body: "Votre code PIN a été mis à jour. Contactez le support si ce n'est pas vous.",
    time: "Il y a 2 jours", read: true, emoji: "✅",
  },
  {
    id: "n11", type: "credit", category: "transactions",
    title: "Remboursement reçu",
    body: "PayRus Travel — remboursement billet Vol ET-502 : $612.00",
    time: "Il y a 3 jours", read: true, amount: 612, currency: "USD", emoji: "💰",
  },
  {
    id: "n12", type: "promo", category: "promotions",
    title: "Offre épargne du mois",
    body: "Blocage 90 jours — taux 8.5% annuel. Déposez à partir de XAF 50,000.",
    time: "Il y a 3 jours", read: true, emoji: "🐷",
  },
];

// Add profile-specific notifications at the top
function getProfileNotifs(profileType: string): Notification[] {
  const base = [...SHARED_NOTIFS];

  const profileSpecific: Partial<Record<string, Notification[]>> = {
    pension_fund: [
      { id: "pf1", type: "alert", category: "transactions", title: "Cotisations en retard", body: "3 entreprises affiliées ont un retard > 30 jours. Relance automatique déclenchée.", time: "Il y a 5 min", read: false, emoji: "⚠️" },
      { id: "pf2", type: "credit", category: "transactions", title: "Cotisations reçues", body: "Lot CNSS Janvier 2026 — CDF 840,000,000 crédités (184 entreprises)", time: "Il y a 1h", read: false, amount: 840000000, currency: "CDF", emoji: "🏛️" },
    ],
    microfinance: [
      { id: "mf1", type: "alert", category: "security", title: "Alerte portefeuille", body: "42 crédits dépassent 90 jours d'impayé. Mission terrain suggérée pour 6 agents.", time: "Il y a 8 min", read: false, emoji: "🔴" },
      { id: "mf2", type: "credit", category: "transactions", title: "Remboursement reçu", body: "Mwana Solidarity Group · Uvira — CDF 680,000", time: "Il y a 30 min", read: false, amount: 680000, currency: "CDF", emoji: "✅" },
    ],
    insurance: [
      { id: "ins1", type: "alert", category: "transactions", title: "128 polices à renouveler", body: "Arrivée à échéance dans 30 jours. Déclencher les relances automatiques ?", time: "Il y a 10 min", read: false, emoji: "📋" },
    ],
    government: [
      { id: "gov1", type: "credit", category: "transactions", title: "Recette SIGTAS reçue", body: "TVA Novembre — $420,000 crédités sur compte Trésor", time: "Il y a 2 min", read: false, amount: 420000, currency: "USD", emoji: "🏛️" },
    ],
    investment_fund: [
      { id: "inv1", type: "alert", category: "transactions", title: "Rééquilibrage recommandé", body: "Allocation obligataire dépasse de 4% la cible. Arbitrage vers actions africaines suggéré.", time: "Il y a 15 min", read: false, emoji: "📊" },
    ],
  };

  const specific = profileSpecific[profileType] ?? [];
  return [...specific, ...base];
}

// ── Notif type styling ────────────────────────────────────────────────────────

function notifStyle(type: NotifType) {
  return {
    credit:   { bg: "bg-emerald-400/10", icon: ArrowDownLeft, color: "text-emerald-400" },
    debit:    { bg: "bg-amber-400/10",   icon: ArrowUpRight,  color: "text-amber-400" },
    security: { bg: "bg-red-400/10",     icon: Shield,        color: "text-red-400" },
    campaign: { bg: "bg-red-400/10",     icon: Heart,         color: "text-red-400" },
    travel:   { bg: "bg-blue-400/10",    icon: Plane,         color: "text-blue-400" },
    system:   { bg: "bg-primary/10",     icon: Sparkles,      color: "text-primary" },
    promo:    { bg: "bg-violet-400/10",  icon: Gift,          color: "text-violet-400" },
    alert:    { bg: "bg-orange-400/10",  icon: AlertTriangle, color: "text-orange-400" },
  }[type];
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { t } = useTranslation("common");
  const { profile } = useProfile();
  const profileType = profile?.type ?? "individual";
  const [allNotifs, setAllNotifs] = useState<Notification[]>(() => getProfileNotifs(profileType));
  const [activeCategory, setActiveCategory] = useState<NotifCategory>("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const unreadCount = allNotifs.filter(n => !n.read).length;

  const filtered = allNotifs.filter(n =>
    activeCategory === "all" || n.category === activeCategory
  );

  const markAllRead = () => {
    setAllNotifs(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("Toutes les notifications marquées comme lues");
  };

  const markRead = (id: string) => {
    setAllNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: string) => {
    setAllNotifs(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setAllNotifs([]);
    setShowClearConfirm(false);
    toast.success("Toutes les notifications effacées");
  };

  const CATEGORIES = [
    { id: "all" as const, label: t("notifications.catAll"), count: allNotifs.length },
    { id: "transactions" as const, label: t("notifications.catTransactions"), count: allNotifs.filter(n => n.category === "transactions").length },
    { id: "security" as const, label: t("notifications.catSecurity"), count: allNotifs.filter(n => n.category === "security").length },
    { id: "promotions" as const, label: t("notifications.catOffers"), count: allNotifs.filter(n => n.category === "promotions").length },
    { id: "updates" as const, label: t("notifications.catUpdates"), count: allNotifs.filter(n => n.category === "updates").length },
  ];

  // Group by date
  const grouped: { label: string; items: Notification[] }[] = [];
  const recentItems = filtered.filter(n => n.time.includes("min") || n.time.includes("h"));
  const yesterdayItems = filtered.filter(n => n.time === "Hier");
  const olderItems = filtered.filter(n => n.time.includes("jours") || n.time.includes("semaine"));

  if (recentItems.length) grouped.push({ label: t("notifications.today"), items: recentItems });
  if (yesterdayItems.length) grouped.push({ label: t("notifications.yesterday"), items: yesterdayItems });
  if (olderItems.length) grouped.push({ label: t("notifications.older"), items: olderItems });

  return (
    <div className="flex flex-col h-full">
      {/* Back navigation */}
      <div className="px-5 pt-5 pb-0 shrink-0">
        <PageHeader title={t("notifications.title")} className="mb-4 md:mb-6" />
      </div>
      {/* Header */}
      <div className="px-5 pt-0 pb-4 border-b border-border bg-sidebar/40 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Bell size={18} className="text-primary" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-black">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base font-black text-foreground">Notifications</h1>
              <p className="text-[11px] text-muted-foreground">{unreadCount > 0 ? t("notifications.unread", { count: unreadCount }) : t("notifications.allCaughtUp")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
                <CheckCheck size={12} /> {t("notifications.markAllRead")}
              </button>
            )}
            <button onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium text-muted-foreground border border-border cursor-pointer hover:bg-secondary transition-colors">
              <X size={12} /> {t("notifications.clearAll")}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border shrink-0 cursor-pointer transition-all whitespace-nowrap",
                activeCategory === cat.id ? "bg-primary/15 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-primary/20"
              )}>
              {cat.label}
              {cat.count > 0 && (
                <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black",
                  activeCategory === cat.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Bell size={28} className="opacity-30" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">Aucune notification</div>
              <div className="text-xs mt-1">Vous êtes à jour !</div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {grouped.map(group => (
              <div key={group.label}>
                <div className="px-5 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 sticky top-0 backdrop-blur-sm border-b border-border/50">
                  {group.label}
                </div>
                <div className="divide-y divide-border">
                  {group.items.map((notif, i) => {
                    const style = notifStyle(notif.type);
                    const Icon = style.icon;
                    return (
                      <motion.div key={notif.id}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        onClick={() => markRead(notif.id)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-secondary/40 transition-colors relative",
                          !notif.read && "bg-primary/3"
                        )}>
                        {/* Unread dot */}
                        {!notif.read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}

                        {/* Icon */}
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-lg", style.bg)}>
                          {notif.emoji}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-semibold text-foreground leading-snug">{notif.title}</div>
                            <div className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{notif.time}</div>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                          {notif.amount !== undefined && (
                            <div className={cn(
                              "mt-1.5 text-xs font-black font-mono",
                              notif.amount > 0 ? "text-emerald-400" : "text-foreground"
                            )}>
                              {notif.amount > 0 ? "+" : ""}{Math.abs(notif.amount).toLocaleString()} {notif.currency}
                            </div>
                          )}
                        </div>

                        {/* Dismiss */}
                        <button
                          onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                          className="p-1 rounded-lg hover:bg-secondary cursor-pointer transition-colors shrink-0 opacity-0 group-hover:opacity-100 mt-0.5">
                          <X size={12} className="text-muted-foreground" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 py-4 text-[11px] text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Notifications en temps réel · PayRus Cloud
            </div>
          </div>
        )}
      </div>

      {/* Clear confirm modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <Trash2 size={20} className="text-destructive" />
              </div>
              <div>
                <div className="text-base font-black text-foreground">Tout effacer ?</div>
                <div className="text-sm text-muted-foreground mt-1">Cette action supprimera toutes vos notifications.</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowClearConfirm(false)}
                  className="py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary cursor-pointer transition-colors">
                  Annuler
                </button>
                <button onClick={clearAll}
                  className="py-2.5 rounded-xl bg-destructive text-white text-sm font-bold cursor-pointer hover:bg-destructive/90 transition-colors">
                  Effacer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
