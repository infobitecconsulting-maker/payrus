import { useState } from "react";
import { Outlet, NavLink, useLocation, useParams, Navigate, useNavigate } from "react-router-dom";
import { LayoutDashboard, CreditCard, ArrowLeftRight, History, Wallet, Bell, Settings, Users, Send, Landmark, PresentationIcon, ShieldCheck, PlugZap, PiggyBank, Plane, Heart, HandHeart, TrendingUp, Gamepad2, Menu, LogOut, User, CircleDollarSign, ScanLine, Receipt, LifeBuoy, Store, Link2, BarChart3, Banknote } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import ProfileSwitcher from "@/components/ui/profile-switcher.tsx";
import { useProfile } from "@/contexts/profile-context.tsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuth } from "@/hooks/use-auth.ts";

const PAYRUS_LOGO = "/payrus-logo.png";

export function PayRusLogo({ className }: { className?: string }) {
  return (
    <img
      src={PAYRUS_LOGO}
      alt="PayRus — Payment Solutions & Services"
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}

export default function AppLayout() {
  const location = useLocation();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("common");
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const base = `/${lng ?? "en"}`;

  // Guard: redirect to profile selection if no profile chosen
  const publicPaths = ["/profile", "/investor", "/fundraise", "/savings", "/wallet", "/payments"];
  const isPublicPath = publicPaths.some(p => location.pathname.endsWith(p));
  const isAdmin = profile?.type === "admin";
  if (profile === null && !isPublicPath) {
    return <Navigate to={`${base}/profile`} replace />;
  }

  // Profile-based access logic
  const isIndividual = profile?.type === "individual";
  const isOrganisation = !isIndividual && profile !== null;
  const isGovProfile = isAdmin || profile?.type === "government" || profile?.type === "state_entity";
  const isFiProfile = isAdmin || ["business", "corporate", "pension_fund", "microfinance", "cooperative", "insurance", "investment_fund", "development_bank"].includes(profile?.type ?? "");

  // Build navigation based on profile type
  const navItems = [
    // Common: always visible
    { to: base, icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: `${base}/payments`, icon: CreditCard, label: t("nav.pay") },
    { to: `${base}/wallet`, icon: CircleDollarSign, label: t("nav.wallet") },
    { to: `${base}/remittance`, icon: ArrowLeftRight, label: t("nav.transfer") },
    { to: `${base}/transactions`, icon: History, label: t("nav.history") },
    { to: `${base}/cards`, icon: Wallet, label: t("nav.cards") },
    { to: `${base}/scan`, icon: ScanLine, label: t("nav.scan") },
    { to: `${base}/bills`, icon: Receipt, label: t("nav.bills") },
    { to: `${base}/disputes`, icon: LifeBuoy, label: t("nav.disputes") },

    // Individual-focused features
    ...(isIndividual || isAdmin ? [
      { to: `${base}/savings`, icon: PiggyBank, label: t("nav.savings") },
      { to: `${base}/p2p`, icon: Send, label: t("nav.p2p") },
      { to: `${base}/games`, icon: Gamepad2, label: t("nav.games") },
      { to: `${base}/travel`, icon: Plane, label: t("nav.travel") },
      { to: `${base}/fundraise`, icon: HandHeart, label: t("nav.fundraise") },
      { to: `${base}/invest`, icon: TrendingUp, label: t("nav.invest") },
    ] : []),

    // Organisation-focused features
    ...(isOrganisation || isAdmin ? [
      { to: `${base}/groups`, icon: Users, label: t("nav.groups") },
      { to: `${base}/pos`, icon: Store, label: t("nav.pos") },
      { to: `${base}/payment-links`, icon: Link2, label: t("nav.links") },
      { to: `${base}/payouts`, icon: Banknote, label: t("nav.payouts") },
      { to: `${base}/treasury`, icon: BarChart3, label: t("nav.treasury") },
      ...(!isIndividual ? [{ to: `${base}/savings`, icon: PiggyBank, label: t("nav.savings") }] : []),
      ...(!isIndividual ? [{ to: `${base}/fundraise`, icon: HandHeart, label: t("nav.fundraise") }] : []),
      ...(!isIndividual ? [{ to: `${base}/invest`, icon: TrendingUp, label: t("nav.invest") }] : []),
    ] : []),

    // Government profiles only
    ...(isGovProfile ? [{ to: `${base}/gov`, icon: Landmark, label: t("nav.govHub"), highlight: true as const }] : []),

    // Financial institution profiles only
    ...(isFiProfile ? [{ to: `${base}/api-hub`, icon: PlugZap, label: t("nav.apiHub"), highlight: "fi" as const }] : []),

    // Always available
    { to: `${base}/investor`, icon: PresentationIcon, label: t("nav.investor") },
    { to: `${base}/admin`, icon: ShieldCheck, label: t("nav.admin"), highlight: true as const },
  ];

  // Mobile bottom nav — context-aware based on profile
  const mobileNavItems = isIndividual ? [
    { to: base, icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: `${base}/payments`, icon: CreditCard, label: t("nav.pay") },
    { to: `${base}/p2p`, icon: Send, label: t("nav.p2p") },
    { to: `${base}/transactions`, icon: History, label: t("nav.history") },
  ] : [
    { to: base, icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: `${base}/payments`, icon: CreditCard, label: t("nav.pay") },
    { to: `${base}/remittance`, icon: ArrowLeftRight, label: t("nav.transfer") },
    { to: `${base}/transactions`, icon: History, label: t("nav.history") },
  ];

  const isActive = (to: string) =>
    to === base
      ? location.pathname === base || location.pathname === base + "/"
      : location.pathname.startsWith(to);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar shrink-0">

        {/* Logo section */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-center rounded-xl bg-white px-3 py-2.5 shadow-sm border border-border">
            <PayRusLogo className="h-9 w-auto" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/25">
              <span className="text-[9px] font-black text-amber-700 dark:text-amber-400">XAF·AOA</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-300/70 font-medium leading-tight">{t("nav.reference")}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/25">
              <span className="text-[9px] font-black text-amber-700 dark:text-amber-400">7</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-300/70 font-medium leading-tight">{t("nav.nationsLive")}</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-50 dark:bg-[#4BA3CC]/10 border border-sky-200 dark:border-[#4BA3CC]/25">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-[#4BA3CC] animate-pulse shrink-0" />
              <span className="text-[9px] text-sky-700 dark:text-[#4BA3CC] font-semibold">{t("nav.superbank")}</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const isHighlight = "highlight" in item && item.highlight === true;
            const isFiHighlight = "highlight" in item && item.highlight === "fi";
            return (
              <NavLink key={item.to} to={item.to} end={item.to === base}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary"
                    : isHighlight
                    ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20"
                    : isFiHighlight
                    ? "text-primary hover:bg-primary/5 border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>
                  <item.icon size={17} className={active ? "text-primary" : isHighlight ? "text-amber-600 dark:text-amber-400" : isFiHighlight ? "text-primary" : ""} />
                  {item.label}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom tools */}
        <div className="px-3 pb-3 space-y-1 border-t border-border pt-3">
          <button
            onClick={() => navigate(`${base}/notifications`)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
              location.pathname.startsWith(`${base}/notifications`) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}>
            <Bell size={17} />
            {t("nav.notifications")}
            <span className="ml-auto bg-destructive text-[10px] text-white font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </button>
          <button
            onClick={() => navigate(`${base}/settings`)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
              location.pathname.startsWith(`${base}/settings`) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}>
            <Settings size={17} />
            {t("nav.settings")}
          </button>
          {/* Language switcher */}
          <div className="px-1 pt-1">
            <LocaleSwitcher />
          </div>
        </div>

        {/* Profile switcher + auth */}
        <div className="px-3 py-3 border-t border-border space-y-2">
          <ProfileSwitcher />
          <Authenticated>
            <div className="flex items-center gap-2 px-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={12} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground truncate flex-1">{user?.profile?.email ?? user?.profile?.name ?? ""}</span>
              <SignInButton variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" showIcon={true} signOutText="" />
            </div>
          </Authenticated>
          <Unauthenticated>
            <SignInButton className="w-full h-9 text-sm" />
          </Unauthenticated>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0 safe-area-top">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-white px-2 py-1 border border-border shadow-sm">
              <PayRusLogo className="h-6 w-auto" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Authenticated>
              <button
                onClick={() => navigate(`${base}/notifications`)}
                className="relative w-9 h-9 rounded-lg bg-secondary flex items-center justify-center cursor-pointer"
              >
                <Bell size={16} className="text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] text-white font-bold flex items-center justify-center">3</span>
              </button>
            </Authenticated>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center cursor-pointer"
            >
              <Menu size={18} className="text-foreground" />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-2.5 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString(lng ?? "en", { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/25">
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">XAF</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-300/70">·</span>
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">AOA</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-300/70">{t("nav.refZone")}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">{t("nav.systems")}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" as const }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile bottom nav — 5 items only */}
        <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-border bg-background/95 backdrop-blur-md md:hidden z-50 safe-area-bottom">
          {mobileNavItems.map((item) => {
            const active = isActive(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.to === base} className="flex-1">
                <div className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
          {/* More button to open full menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground cursor-pointer"
          >
            <Menu size={20} />
            <span>{t("nav.more")}</span>
          </button>
        </nav>
      </div>

      {/* Mobile side sheet menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <PayRusLogo className="h-7 w-auto" />
            </SheetTitle>
          </SheetHeader>

          {/* User/Auth section */}
          <div className="px-4 py-3 border-b border-border">
            <Authenticated>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{user?.profile?.name ?? profile?.name ?? "User"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.profile?.email ?? ""}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { navigate(`${base}/profile`); setMobileMenuOpen(false); }}
                  className="flex-1 h-8 rounded-lg bg-secondary text-xs font-medium text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User size={13} />
                  {t("profile.switchAccount")}
                </button>
                <SignInButton variant="ghost" size="sm" className="h-8 px-3 text-xs text-destructive" showIcon={true} signOutText={t("profile.logout")} signInText="" />
              </div>
            </Authenticated>
            <Unauthenticated>
              <SignInButton className="w-full h-10 text-sm" />
            </Unauthenticated>
          </div>

          {/* Navigation list */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === base}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}>
                    <item.icon size={17} />
                    {item.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="border-t border-border px-3 py-3 space-y-1">
            <button
              onClick={() => { navigate(`${base}/notifications`); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary cursor-pointer"
            >
              <Bell size={17} />
              {t("nav.notifications")}
              <span className="ml-auto bg-destructive text-[10px] text-white font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </button>
            <button
              onClick={() => { navigate(`${base}/settings`); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary cursor-pointer"
            >
              <Settings size={17} />
              {t("nav.settings")}
            </button>
            <div className="px-1 pt-1">
              <LocaleSwitcher />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
