import { useState } from "react";
import { Outlet, NavLink, useLocation, useParams, Navigate, useNavigate } from "react-router-dom";
import { LayoutDashboard, CreditCard, ArrowLeftRight, History, Wallet, Bell, Settings, Users, Send, Landmark, PresentationIcon, ShieldCheck, PlugZap, PiggyBank, Plane, Heart, HandHeart, TrendingUp, Gamepad2, Menu, LogOut, LogIn, User, CircleDollarSign, ScanLine, Receipt, LifeBuoy, Store, Link2, BarChart3, Banknote, ShoppingBag, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import ProfileSwitcher from "@/components/ui/profile-switcher.tsx";
import { useProfile } from "@/contexts/profile-context.tsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { useCurrentAppUser } from "@/hooks/use-current-app-user.ts";
import { clearLocalUserId } from "@/lib/local-user.ts";

export function PayRusLogo({ className }: { className?: string }) {
  return (
    <img
      src="/payrus-logo-lockup.png"
      alt="PayRus — Payment Solutions & Services"
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}

export function PayRusMark({ className }: { className?: string }) {
  return (
    <img
      src="/payrus-icon.png"
      alt=""
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}

export default function AppLayout() {
  const location = useLocation();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("common");
  const { profile, clearProfile } = useProfile();
  const navigate = useNavigate();
  const currentUser = useCurrentAppUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const base = `/${lng ?? "en"}`;
  // "Logged in" for navigation purposes means having an active profile.
  const goHome = () => navigate(profile ? base : `${base}/signin`);
  const handleLogout = () => {
    clearProfile();
    clearLocalUserId();
    navigate(`${base}/welcome`);
  };

  // Guard: send anonymous/no-profile visitors to the welcome screen first
  const publicPaths = ["/welcome", "/profile", "/investor", "/fundraise", "/savings", "/wallet", "/payments"];
  const isPublicPath = publicPaths.some(p => location.pathname.endsWith(p));
  const isAdmin = profile?.type === "admin";
  if (profile === null && !isPublicPath) {
    return <Navigate to={`${base}/welcome`} replace />;
  }

  // Profile-based access logic
  const isIndividual = profile?.type === "personal" || profile?.type === "starter";
  const isOrganisation = !isIndividual && profile !== null;
  const isGovProfile = isAdmin || profile?.type === "public_institution";
  const isFiProfile = isAdmin || ["merchant", "agent", "treasury"].includes(profile?.type ?? "");

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
      { to: `${base}/shop`, icon: ShoppingBag, label: t("nav.shop") },
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

    // Agent-assisted manual registration — for customers with no
    // smartphone/data to self-register with. Admins already have this via
    // the admin panel's own "Add profile" form, but it's surfaced here too
    // for consistency/discoverability.
    ...(profile?.type === "agent" || isAdmin ? [{ to: `${base}/register-customer`, icon: UserPlus, label: t("nav.registerCustomer") }] : []),

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
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-[linear-gradient(180deg,#f7fafd_0%,#eef4f9_100%)] shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] shrink-0">

        {/* Logo section */}
        <div className="px-4 py-4 border-b border-border bg-[radial-gradient(circle_at_top,_rgba(10,47,92,0.04),transparent_60%)]">
          <button
            onClick={goHome}
            className="flex items-center px-1 py-1 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label={t("nav.dashboard")}
          >
            <PayRusLogo className="h-9 w-auto" />
          </button>

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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const isHighlight = "highlight" in item && item.highlight === true;
            const isFiHighlight = "highlight" in item && item.highlight === "fi";
            return (
              <NavLink key={item.to} to={item.to} end={item.to === base}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[linear-gradient(135deg,rgba(10,47,92,0.10),rgba(14,127,176,0.06))] text-primary shadow-[inset_0_0_0_1px_rgba(10,47,92,0.08)]"
                    : isHighlight
                    ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20"
                    : isFiHighlight
                    ? "text-primary hover:bg-primary/5 border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/80"
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
        <div className="px-3 pb-3 space-y-1 border-t border-border pt-3 bg-[radial-gradient(circle_at_top,_rgba(14,127,176,0.03),transparent_55%)]">
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
          {currentUser ? (
            <div className="flex items-center gap-2 px-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={12} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground truncate flex-1">{currentUser.email ?? currentUser.name ?? ""}</span>
              <button
                onClick={handleLogout}
                aria-label={t("profile.logout")}
                className="h-7 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center cursor-pointer transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate(`${base}/signin`)}
              className="w-full h-9 text-sm flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              <LogIn size={15} />
              {t("signin.signIn")}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0 safe-area-top">
          <button
            onClick={goHome}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label={t("nav.dashboard")}
          >
            <PayRusLogo className="h-6 w-auto" />
          </button>
          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => navigate(`${base}/notifications`)}
                className="relative w-9 h-9 rounded-lg bg-secondary flex items-center justify-center cursor-pointer"
              >
                <Bell size={16} className="text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] text-white font-bold flex items-center justify-center">3</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center cursor-pointer"
            >
              <Menu size={18} className="text-foreground" />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-2.5 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
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
        <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center gap-2 border-t border-border/80 bg-white/90 backdrop-blur-xl px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden z-50 shadow-[0_-12px_30px_rgba(15,23,42,0.06)]">
          {mobileNavItems.map((item) => {
            const active = isActive(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.to === base} className="flex-1">
                <div className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium transition-all duration-200",
                  active ? "bg-primary/8 text-primary shadow-[inset_0_0_0_1px_rgba(10,47,92,0.08)]" : "text-muted-foreground"
                )}>
                  <item.icon size={18} className={active ? "text-primary" : "text-muted-foreground"} />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
          {/* More button to open full menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium text-muted-foreground cursor-pointer transition-all duration-200 hover:bg-secondary"
          >
            <Menu size={18} />
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
          <div className="px-4 py-3 border-b border-border space-y-2">
            <ProfileSwitcher />
            {currentUser ? (
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={12} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground truncate flex-1">{currentUser.email ?? currentUser.name ?? ""}</span>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="h-7 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut size={14} />
                  {t("profile.logout")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigate(`${base}/signin`); setMobileMenuOpen(false); }}
                className="w-full h-10 text-sm flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium cursor-pointer hover:opacity-90 transition-opacity"
              >
                <LogIn size={16} />
                {t("signin.signIn")}
              </button>
            )}
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
