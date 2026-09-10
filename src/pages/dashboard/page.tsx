import { motion } from "motion/react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Send, ArrowDownLeft, QrCode, Building2,
  TrendingUp, Shield, Wifi, ChevronRight, Bell,
  Sparkles, Plus, ArrowUpRight, Clock,
  PiggyBank, Coins, HandshakeIcon, Umbrella, Banknote, Users
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/contexts/profile-context.tsx";
import type { ProfileType } from "@/contexts/profile-context.tsx";

/* ─── Profile-adaptive data ─────────────────────────────── */

const PROFILE_QUICK_ACTIONS: Partial<Record<ProfileType, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; gradient: string; path: string }[]>> = {
  pension_fund: [
    { label: "Cotisants", icon: Users, gradient: "from-teal-500 to-teal-400", path: "/groups" },
    { label: "Rentes", icon: PiggyBank, gradient: "from-primary to-emerald-400", path: "/remittance" },
    { label: "Rapports", icon: TrendingUp, gradient: "from-accent to-sky-400", path: "/transactions" },
    { label: "Paiements", icon: ArrowDownLeft, gradient: "from-amber-500 to-yellow-300", path: "/payments" },
  ],
  microfinance: [
    { label: "Crédits", icon: Coins, gradient: "from-orange-500 to-orange-400", path: "/groups" },
    { label: "Épargne", icon: PiggyBank, gradient: "from-primary to-emerald-400", path: "/remittance" },
    { label: "Agents", icon: Users, gradient: "from-accent to-sky-400", path: "/p2p" },
    { label: "Rapport", icon: TrendingUp, gradient: "from-violet-500 to-purple-400", path: "/transactions" },
  ],
  cooperative: [
    { label: "Membres", icon: Users, gradient: "from-lime-500 to-lime-400", path: "/groups" },
    { label: "Épargne", icon: PiggyBank, gradient: "from-primary to-emerald-400", path: "/remittance" },
    { label: "Dividendes", icon: ArrowUpRight, gradient: "from-accent to-sky-400", path: "/payments" },
    { label: "Crédits", icon: Coins, gradient: "from-amber-500 to-yellow-300", path: "/payments" },
  ],
  insurance: [
    { label: "Primes", icon: Umbrella, gradient: "from-indigo-500 to-indigo-400", path: "/payments" },
    { label: "Sinistres", icon: ArrowDownLeft, gradient: "from-rose-500 to-rose-400", path: "/remittance" },
    { label: "Polices", icon: Shield, gradient: "from-accent to-sky-400", path: "/transactions" },
    { label: "Rapport", icon: TrendingUp, gradient: "from-violet-500 to-purple-400", path: "/transactions" },
  ],
  investment_fund: [
    { label: "Portfolio", icon: TrendingUp, gradient: "from-purple-500 to-purple-400", path: "/transactions" },
    { label: "Rendements", icon: ArrowUpRight, gradient: "from-primary to-emerald-400", path: "/payments" },
    { label: "Transferts", icon: Send, gradient: "from-accent to-sky-400", path: "/remittance" },
    { label: "Rapport", icon: Sparkles, gradient: "from-amber-500 to-yellow-300", path: "/transactions" },
  ],
  development_bank: [
    { label: "Projets", icon: Building2, gradient: "from-yellow-500 to-yellow-400", path: "/payments" },
    { label: "Prêts", icon: Banknote, gradient: "from-primary to-emerald-400", path: "/remittance" },
    { label: "Décaisser", icon: ArrowUpRight, gradient: "from-accent to-sky-400", path: "/groups" },
    { label: "Rapport", icon: TrendingUp, gradient: "from-violet-500 to-purple-400", path: "/transactions" },
  ],
};

const PROFILE_WIDGETS: Partial<Record<ProfileType, { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; sub: string; color: string }[]>> = {
  pension_fund: [
    { icon: Users, label: "Cotisants actifs", value: "142,318", sub: "+1.2% ce mois", color: "text-teal-400" },
    { icon: PiggyBank, label: "Rentes versées/mois", value: "CDF 4.8B", sub: "12,400 bénéficiaires", color: "text-primary" },
    { icon: TrendingUp, label: "Taux de recouvrement", value: "94.7%", sub: "+0.3% vs août", color: "text-accent" },
  ],
  microfinance: [
    { icon: Coins, label: "Portefeuille crédits", value: "CDF 1.2B", sub: "8,740 emprunteurs", color: "text-orange-400" },
    { icon: Users, label: "Agents actifs", value: "312", sub: "24 provinces couvertes", color: "text-primary" },
    { icon: PiggyBank, label: "Épargne collectée", value: "CDF 420M", sub: "+18% ce trimestre", color: "text-accent" },
  ],
  cooperative: [
    { icon: Users, label: "Membres actifs", value: "4,218", sub: "+84 ce mois", color: "text-lime-400" },
    { icon: PiggyBank, label: "Épargne totale", value: "CDF 980M", sub: "↑ 12% vs N-1", color: "text-primary" },
    { icon: Coins, label: "Crédits en cours", value: "CDF 610M", sub: "Taux impayé: 3.1%", color: "text-accent" },
  ],
  insurance: [
    { icon: Umbrella, label: "Primes collectées", value: "$2.4M", sub: "YTD 2026", color: "text-indigo-400" },
    { icon: Shield, label: "Sinistres traités", value: "1,842", sub: "Délai moy: 4.2j", color: "text-primary" },
    { icon: TrendingUp, label: "Ratio combiné", value: "87.3%", sub: "Cible: < 95%", color: "text-accent" },
  ],
  investment_fund: [
    { icon: TrendingUp, label: "AUM total", value: "$48.5M", sub: "+6.2% YTD", color: "text-purple-400" },
    { icon: ArrowUpRight, label: "Rendement annualisé", value: "11.4%", sub: "vs benchmark 8.2%", color: "text-primary" },
    { icon: Users, label: "Investisseurs", value: "234", sub: "12 institutionnels", color: "text-accent" },
  ],
  development_bank: [
    { icon: Building2, label: "Projets financés", value: "48", sub: "CDF 120B engagés", color: "text-yellow-400" },
    { icon: Banknote, label: "Décaissements YTD", value: "CDF 67B", sub: "76% du budget", color: "text-primary" },
    { icon: TrendingUp, label: "Taux remboursement", value: "96.2%", sub: "Portefeuille sain", color: "text-accent" },
  ],
};

const PROFILE_INSIGHT: Partial<Record<ProfileType, { title: string; sub: string }>> = {
  pension_fund: {
    title: "Optimisation des cotisations",
    sub: "3 entreprises affiliées présentent un retard de cotisation de plus de 30 jours. Relance automatique recommandée.",
  },
  microfinance: {
    title: "Alerte portefeuille à risque",
    sub: "42 crédits dépassent 90 jours d'impayé. Une mission de recouvrement terrain est suggérée pour 6 agents.",
  },
  cooperative: {
    title: "Assemblée générale imminente",
    sub: "Distribuer les dividendes 2025 à 4,218 membres avant le 30 septembre. Préparer les états financiers.",
  },
  insurance: {
    title: "Renouvellements à traiter",
    sub: "128 polices arrivent à échéance dans 30 jours. Déclencher les relances de renouvellement automatiquement.",
  },
  investment_fund: {
    title: "Rééquilibrage recommandé",
    sub: "L'allocation obligataire dépasse de 4% la cible stratégique. Un arbitrage vers les actions africaines est suggéré.",
  },
  development_bank: {
    title: "Rapport d'impact trimestriel",
    sub: "Q2 2026: 48 projets · 182,000 bénéficiaires · CDF 67B décaissés. Prêt pour soumission aux bailleurs.",
  },
};

const PROFILE_TRANSACTIONS: Partial<Record<ProfileType, Array<{ id: number; name: string; type: string; amount: number; currency: string; date: string; icon: string; bg: string }>>> = {
  pension_fund: [
    { id: 1, name: "Cotisations CNSS · Janvier 2026", type: "credit", amount: 840000000, currency: "CDF", date: "Aujourd'hui, 09:15", icon: "🏛️", bg: "bg-teal-500/15" },
    { id: 2, name: "Rentes versées · 12 400 bénéficiaires", type: "debit", amount: -620000000, currency: "CDF", date: "Aujourd'hui, 08:00", icon: "👴", bg: "bg-primary/15" },
    { id: 3, name: "Placement BEAC · Bon du Trésor 90j", type: "debit", amount: -1500000000, currency: "CDF", date: "Hier", icon: "📈", bg: "bg-accent/15" },
    { id: 4, name: "Pénalités retard · Entreprises", type: "credit", amount: 12400000, currency: "CDF", date: "8 août", icon: "⚡", bg: "bg-amber-500/15" },
  ],
  microfinance: [
    { id: 1, name: "Décaissement crédit groupe · Uvira", type: "debit", amount: -4500000, currency: "CDF", date: "Aujourd'hui, 11:00", icon: "💰", bg: "bg-orange-500/15" },
    { id: 2, name: "Remboursement · Mwana Solidarity", type: "credit", amount: 680000, currency: "CDF", date: "Aujourd'hui, 09:30", icon: "✅", bg: "bg-primary/15" },
    { id: 3, name: "Collecte épargne · Agent Bukavu", type: "credit", amount: 2100000, currency: "CDF", date: "Hier", icon: "🏦", bg: "bg-accent/15" },
    { id: 4, name: "Transfert refinancement · DCA", type: "debit", amount: -50000, currency: "USD", date: "7 août", icon: "🌍", bg: "bg-blue-500/15" },
  ],
  cooperative: [
    { id: 1, name: "Dépôts membres · Semaine 32", type: "credit", amount: 48200000, currency: "CDF", date: "Aujourd'hui, 10:00", icon: "🤝", bg: "bg-lime-500/15" },
    { id: 2, name: "Crédit accordé · Furaha SCRL", type: "debit", amount: -25000000, currency: "CDF", date: "Aujourd'hui, 08:30", icon: "📋", bg: "bg-primary/15" },
    { id: 3, name: "Dividendes 2025 · Acompte", type: "debit", amount: -18000000, currency: "CDF", date: "Hier", icon: "💎", bg: "bg-accent/15" },
    { id: 4, name: "Remboursement crédit · Matumaini", type: "credit", amount: 3800000, currency: "CDF", date: "9 août", icon: "✅", bg: "bg-teal-500/15" },
  ],
  insurance: [
    { id: 1, name: "Primes collectées · Santé Q3", type: "credit", amount: 142000, currency: "USD", date: "Aujourd'hui, 14:00", icon: "🛡️", bg: "bg-indigo-500/15" },
    { id: 2, name: "Règlement sinistre · Auto Kinshasa", type: "debit", amount: -18500, currency: "USD", date: "Aujourd'hui, 10:15", icon: "🚗", bg: "bg-rose-500/15" },
    { id: 3, name: "Réassurance · AfricaRe Q2", type: "debit", amount: -82000, currency: "USD", date: "Hier", icon: "🏢", bg: "bg-primary/15" },
    { id: 4, name: "Primes vie · Renouvellements", type: "credit", amount: 56800, currency: "USD", date: "8 août", icon: "❤️", bg: "bg-accent/15" },
  ],
  investment_fund: [
    { id: 1, name: "Souscriptions T3 2026", type: "credit", amount: 2850000, currency: "USD", date: "Aujourd'hui, 09:00", icon: "📊", bg: "bg-purple-500/15" },
    { id: 2, name: "Rachat parts · Fonds B", type: "debit", amount: -420000, currency: "USD", date: "Aujourd'hui, 08:00", icon: "💸", bg: "bg-rose-500/15" },
    { id: 3, name: "Distribution rendements S1", type: "debit", amount: -1200000, currency: "USD", date: "Hier", icon: "💰", bg: "bg-primary/15" },
    { id: 4, name: "Dividendes MTN Group", type: "credit", amount: 184000, currency: "USD", date: "7 août", icon: "📱", bg: "bg-accent/15" },
  ],
  development_bank: [
    { id: 1, name: "Décaissement Projet Inga III", type: "debit", amount: -8500000000, currency: "CDF", date: "Aujourd'hui, 09:00", icon: "🏗️", bg: "bg-yellow-500/15" },
    { id: 2, name: "Remboursement Prêt BM · Route N1", type: "credit", amount: 2100000000, currency: "CDF", date: "Aujourd'hui, 08:00", icon: "🛣️", bg: "bg-primary/15" },
    { id: 3, name: "Décaissement santé · UNICEF co-fin", type: "debit", amount: -950000, currency: "USD", date: "Hier", icon: "🏥", bg: "bg-accent/15" },
    { id: 4, name: "Garantie export · AFREXIMBANK", type: "credit", amount: 4200000, currency: "USD", date: "9 août", icon: "🌍", bg: "bg-blue-500/15" },
  ],
};


const contacts = [
  { name: "Amara K.", initials: "AK", color: "bg-violet-500" },
  { name: "Oumar D.", initials: "OD", color: "bg-orange-500" },
  { name: "Fatou B.", initials: "FB", color: "bg-cyan-500" },
  { name: "Kofi A.", initials: "KA", color: "bg-rose-500" },
  { name: "Ngozi E.", initials: "NE", color: "bg-emerald-500" },
];

const wallets = [
  { name: "Orange Money", balance: "XAF 48,200", flag: "🍊", color: "bg-orange-500/10 border-orange-500/25 text-orange-400" },
  { name: "MTN MoMo", balance: "XAF 12,000", flag: "🟡", color: "bg-yellow-500/10 border-yellow-500/25 text-yellow-400" },
  { name: "Unitel Money", balance: "AOA 182,400", flag: "🇦🇴", color: "bg-red-500/10 border-red-500/25 text-red-400" },
  { name: "Wave", balance: "XOF 31,500", flag: "🌊", color: "bg-blue-500/10 border-blue-500/25 text-blue-400" },
];

const spendingData = [
  { month: "Mar", value: 820 }, { month: "Apr", value: 1100 },
  { month: "May", value: 740 }, { month: "Jun", value: 1380 },
  { month: "Jul", value: 960 }, { month: "Aug", value: 1240 },
];

const DEFAULT_TRANSACTIONS = [
  { id: 1, name: "Virement Orange Money · Douala", type: "debit", amount: -25000, currency: "XAF", date: "Aujourd'hui, 14:32", icon: "🍊", bg: "bg-orange-500/15" },
  { id: 2, name: "Salaire Mensuel · Employer", type: "credit", amount: 450000, currency: "XAF", date: "Aujourd'hui, 09:00", icon: "💼", bg: "bg-primary/15" },
  { id: 3, name: "Paiement Visa · Yaoundé", type: "debit", amount: -8500, currency: "XAF", date: "Hier", icon: "💳", bg: "bg-blue-500/15" },
  { id: 4, name: "Envoi ECOWAS · Dakar", type: "debit", amount: -30000, currency: "XAF", date: "Aug 9", icon: "🌍", bg: "bg-accent/15" },
];

interface TooltipProps { active?: boolean; payload?: Array<{ value: number }>; label?: string; }
function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground font-mono">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("common");
  const { profile } = useProfile();
  const navigate = useNavigate();
  const base = `/${lng ?? "en"}`;

  const profileType = profile?.type ?? "individual";
  const isFinancialInstitution = (["pension_fund","microfinance","cooperative","insurance","investment_fund","development_bank"] as ProfileType[]).includes(profileType);

  // Format balance for display — compact for very large numbers
  const formatBalance = (n: number, currency: string) => {
    if (n >= 1_000_000_000) return `${currency} ${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(3).replace(/\.?0+$/, "")}M`;
    return `${currency} ${n.toLocaleString()}`;
  };

  const displayBalance = profile
    ? formatBalance(profile.balance, profile.currency)
    : "XAF 7,303,000";

  const displayUSD = profile
    ? `≈ $${profile.balanceUSD.toLocaleString()} USD · •••• ${profile.accountNumber}`
    : "≈ $12,149 USD · •••• 4821";

  const displayName = profile?.name ?? "Jean Dupont";
  const displayTier = profile?.tier ?? "Premium ✦";

  // Profile-adaptive transactions
  const recentTransactions = PROFILE_TRANSACTIONS[profileType] ?? DEFAULT_TRANSACTIONS;

  // Profile-adaptive quick actions
  const defaultQuickActions = [
    { label: t("quick.send"), icon: Send, gradient: "from-primary to-emerald-400", to: `${base}/remittance` },
    { label: t("quick.pay"), icon: ArrowUpRight, gradient: "from-accent to-sky-400", to: `${base}/payments` },
    { label: t("quick.qrPay"), icon: QrCode, gradient: "from-violet-500 to-purple-400", to: `${base}/payments` },
    { label: t("quick.request"), icon: ArrowDownLeft, gradient: "from-amber-500 to-yellow-300", to: `${base}/payments` },
  ];
  const profileQuickActions = PROFILE_QUICK_ACTIONS[profileType];
  const quickActions = profileQuickActions
    ? profileQuickActions.map(a => ({ ...a, to: `${base}${a.path}` }))
    : defaultQuickActions;

  // KPIs for financial institution profiles
  const profileWidgets = PROFILE_WIDGETS[profileType];

  // Insight
  const profileInsight = PROFILE_INSIGHT[profileType];

  const stats = [
    { label: t("stats.sent"), value: "XAF 726k", change: "+12%", up: true },
    { label: t("stats.fxSavings"), value: "XAF 22,500", change: "+5%", up: true },
    { label: t("stats.pending"), value: "XAF 51k", change: "2 txns", up: false },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">{t("dashboard.greeting")}</p>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{displayName}</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => navigate(`${base}/notifications`)}
            className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
            <Bell size={16} className="text-muted-foreground" />
          </button>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] text-white font-bold flex items-center justify-center">3</span>
        </div>
      </motion.div>

      {/* Main balance card */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-accent/4 pointer-events-none" />
        <div className="relative p-5 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Wifi size={12} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">{t("dashboard.account")}</span>
            <div className="text-[10px] text-primary truncate font-medium">{displayTier}</div>
            <div className="ml-auto flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
              <Shield size={9} className="text-primary" />
              <span className="text-[10px] text-primary font-semibold">{t("dashboard.verified")}</span>
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono tracking-tight">{displayBalance}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{displayUSD}</div>
        </div>
        <div className="px-2 pt-1 pb-0">
          <ResponsiveContainer width="100%" height={68}>
            <AreaChart data={spendingData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.19 155)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="oklch(0.62 0.19 155)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.01 240)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="oklch(0.62 0.19 155)" strokeWidth={2} fill="url(#sg)"
                dot={false} activeDot={{ r: 3, fill: "oklch(0.62 0.19 155)", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
              <div className="text-sm font-bold text-foreground mt-0.5 font-mono">{s.value}</div>
              <div className={cn("text-[10px] mt-0.5 flex items-center gap-0.5", s.up ? "text-primary" : "text-muted-foreground")}>
                {s.up && <TrendingUp size={9} />}{s.change}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((a, i) => (
          <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}>
            <Link to={a.to} className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20", a.gradient)}>
                <a.icon size={19} className="text-white" />
              </div>
              <span className="text-[11px] text-muted-foreground font-medium text-center group-hover:text-foreground transition-colors">{a.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Financial institution KPI widgets */}
      {isFinancialInstitution && profileWidgets && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-3">
          {profileWidgets.map((w) => (
            <div key={w.label} className="rounded-2xl bg-card border border-border p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <w.icon size={13} className={w.color} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{w.label}</span>
              </div>
              <div className={cn("text-lg font-bold font-mono", w.color)}>{w.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{w.sub}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Mobile wallets — hide for financial institutions */}
      {!isFinancialInstitution && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground">{t("dashboard.mobileWallets")}</h2>
            <button className="text-[11px] text-primary flex items-center gap-1 cursor-pointer hover:underline">
              <Plus size={11} /> {t("dashboard.linkWallet")}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {wallets.map((w) => (
              <div key={w.name} className={cn("shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity", w.color)}>
                <span className="text-lg leading-none">{w.flag}</span>
                <div>
                  <div className="text-[10px] font-medium opacity-70">{w.name}</div>
                  <div className="text-xs font-bold font-mono">{w.balance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-foreground">{t("dashboard.sendAgain")}</h2>
          <Link to={`${base}/remittance`} className="text-[11px] text-primary flex items-center gap-1 hover:underline cursor-pointer">
            {t("dashboard.seeAll")} <ChevronRight size={11} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {contacts.map((c, i) => (
            <motion.button key={c.name} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0">
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/50", c.color)}>
                {c.initials}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors whitespace-nowrap">{c.name.split(" ")[0]}</span>
            </motion.button>
          ))}
          <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + contacts.length * 0.04 }}
            className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0">
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
              <Plus size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{t("dashboard.new")}</span>
          </motion.button>
        </div>
      </div>

      {/* AI / Profile insight */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/5 dark:bg-primary/8 border border-primary/15 cursor-pointer hover:bg-primary/8 dark:hover:bg-primary/12 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground">
            {profileInsight?.title ?? t("dashboard.insightTitle")}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {profileInsight?.sub ?? t("dashboard.insightSub")}
          </div>
        </div>
        <ChevronRight size={13} className="text-muted-foreground shrink-0" />
      </motion.div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-foreground">{t("dashboard.recentActivity")}</h2>
          <Link to={`${base}/transactions`} className="text-[11px] text-primary flex items-center gap-1 hover:underline cursor-pointer">
            {t("dashboard.viewAll")} <ChevronRight size={11} />
          </Link>
        </div>
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          {recentTransactions.map((tx, i) => (
            <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0", tx.bg)}>
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{tx.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={9} className="text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{tx.date}</span>
                </div>
              </div>
              <div className={cn("text-sm font-bold font-mono tabular-nums text-right", tx.amount > 0 ? "text-primary" : "text-foreground")}>
                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                <div className="text-[10px] font-normal text-muted-foreground">{tx.currency}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Agent banking promo */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 cursor-pointer hover:border-primary/30 transition-colors shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/4 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">{t("dashboard.agentTitle")}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{t("dashboard.agentSub")}</div>
          </div>
          <ChevronRight size={15} className="text-muted-foreground shrink-0" />
        </div>
      </motion.div>

    </div>
  );
}
