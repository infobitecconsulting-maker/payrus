import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConvex, useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import { useProfile } from "@/contexts/profile-context.tsx";
import { setLocalUserId } from "@/lib/local-user.ts";
import { routeAfterIdentity } from "@/lib/post-auth-routing.ts";
import { supabase } from "@/lib/supabase-client.ts";
import { OAUTH_PROVIDERS, authCallbackUrl, signInWithOAuthProvider, type OAuthProviderId } from "@/lib/supabase-providers.ts";

type SecondaryPanel = "magic" | "phone" | "sso" | null;

export default function SignIn() {
  const { t } = useTranslation("common");
  const { lng = "en" } = useParams<{ lng?: string }>();
  const base = `/${lng}`;
  const navigate = useNavigate();
  const { setProfile } = useProfile();
  const convex = useConvex();
  const upsertSupabaseUser = useMutation(api.supabaseAuth.upsertSupabaseUser);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [oauthPending, setOauthPending] = useState<OAuthProviderId | null>(null);
  const [panel, setPanel] = useState<SecondaryPanel>(null);

  // Magic link
  const [magicSending, setMagicSending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  // Phone OTP
  const [phoneStep, setPhoneStep] = useState<"input" | "codeSent">("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);

  // Enterprise SSO
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoSending, setSsoSending] = useState(false);

  const finishLogin = async (userId: Id<"users">, name: string) => {
    setLocalUserId(userId);
    const roles = await convex.query(api.userRoles.listForUser, { userId });
    toast.success(t("signin.welcomeBack"));
    routeAfterIdentity({ userId, roles, navigate, base, setProfile, displayName: name });
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      toast.error(t("register.allFieldsRequired"));
      return;
    }
    setChecking(true);
    try {
      // Supabase's own signInWithPassword only takes an email — resolve the
      // typed identifier (username/email/phone) to one first, the same way
      // "forgot my username" has always worked in this app.
      const email = await convex.query(api.supabaseAuth.resolveEmailByIdentifier, { identifier: identifier.trim() });
      if (!email) {
        toast.error(t("signin.accountNotFoundLogin"));
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        toast.error(t("signin.invalidCredentials"));
        return;
      }
      const meta = data.user.user_metadata ?? {};
      const { userId, name } = await upsertSupabaseUser({
        supabaseUserId: data.user.id,
        email: data.user.email ?? email,
        firstName: typeof meta.firstName === "string" ? meta.firstName : undefined,
        lastName: typeof meta.lastName === "string" ? meta.lastName : undefined,
      });
      await finishLogin(userId, name);
    } catch {
      toast.error(t("profile.org.saveFailed"));
    } finally {
      setChecking(false);
    }
  };

  // Redirect-based — there's nothing to route on here even on success, since
  // the browser is about to leave the app. Only failures (e.g. a genuine
  // local/network problem before the redirect starts) come back to this
  // handler; a disabled/misconfigured provider still redirects and only
  // fails once Supabase bounces back to auth-callback/page.tsx.
  const handleOAuthClick = async (provider: OAuthProviderId, label: string) => {
    setOauthPending(provider);
    try {
      await signInWithOAuthProvider(provider, base);
    } catch {
      toast.error(t("signin.oauthFailed", { provider: label }));
      setOauthPending(null);
    }
  };

  const handleMagicLink = async () => {
    if (!identifier.trim()) {
      toast.error(t("register.allFieldsRequired"));
      return;
    }
    setMagicSending(true);
    try {
      const email = await convex.query(api.supabaseAuth.resolveEmailByIdentifier, { identifier: identifier.trim() });
      if (!email) {
        toast.error(t("signin.accountNotFoundLogin"));
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: authCallbackUrl(base) },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setMagicSent(true);
    } finally {
      setMagicSending(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("signin.phoneOtpPrompt"));
      return;
    }
    setPhoneSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setPhoneStep("codeSent");
      toast.success(t("signin.phoneOtpSent"));
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneCode.trim()) return;
    setPhoneSending(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber.trim(), token: phoneCode.trim(), type: "sms",
      });
      if (error || !data.user) {
        toast.error(error?.message ?? t("register.invalidCode"));
        return;
      }
      // Phone-only sign-in gives no email — synthesize a stable one so the
      // Convex row can still use the same by_email-friendly shape as every
      // other account (same convention the old oauth.ts used for Facebook
      // profiles that withheld email).
      const email = data.user.email ?? `phone-${data.user.id}@phone.payrus.local`;
      const { userId, name } = await upsertSupabaseUser({ supabaseUserId: data.user.id, email });
      await finishLogin(userId, name);
    } finally {
      setPhoneSending(false);
    }
  };

  const handleSsoContinue = async () => {
    const domain = ssoEmail.trim().split("@")[1];
    if (!domain) {
      toast.error(t("signin.ssoWorkEmailLabel"));
      return;
    }
    setSsoSending(true);
    try {
      // Unlike signInWithOAuth, signInWithSSO does NOT redirect on its own —
      // it just resolves the domain to a SAML connection and hands back a
      // URL to navigate to.
      const { data, error } = await supabase.auth.signInWithSSO({
        domain,
        options: { redirectTo: authCallbackUrl(base) },
      });
      if (error || !data?.url) {
        toast.error(t("signin.ssoFailed"));
        return;
      }
      window.location.href = data.url;
    } finally {
      setSsoSending(false);
    }
  };

  const togglePanel = (next: Exclude<SecondaryPanel, null>) => setPanel((p) => (p === next ? null : next));

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#F7FAF8",
        backgroundImage: "radial-gradient(rgba(10,47,92,0.06) 1px, transparent 1.2px)",
        backgroundSize: "16px 16px",
      }}
    >
      <svg viewBox="0 0 390 300" className="absolute pointer-events-none" style={{ top: -60, right: -80, opacity: 0.5, width: 280 }}>
        <circle cx="140" cy="140" r="140" fill="#0E7FB0" opacity="0.14" />
      </svg>
      <svg viewBox="0 0 390 300" className="absolute pointer-events-none" style={{ bottom: 100, left: -90, opacity: 0.6, width: 300 }}>
        <circle cx="140" cy="140" r="140" fill="#78B72E" opacity="0.13" />
      </svg>

      <div className="relative z-10 flex items-center justify-between px-6 pt-5">
        <button
          type="button"
          onClick={() => navigate(`${base}/welcome`)}
          className="w-9 h-9 rounded-lg bg-white/80 border border-[#E4EAF0] flex items-center justify-center text-[#0A2F5C] cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <LocaleSwitcher />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center gap-6 px-8 py-6 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-2.5 text-center">
          <h1 className="font-bold text-[24px] leading-tight text-[#0A2F5C]" style={{ fontFamily: "'Sora', sans-serif" }}>
            {t("signin.headline")}
          </h1>
          <p className="text-[13.5px] leading-relaxed text-[#66798F]">
            {t("signin.subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="signin-identifier">
            {t("signin.usernameTab")}
          </label>
          <input
            id="signin-identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("signin.usernamePlaceholder")}
            className="rounded-xl border border-[#E4EAF0] bg-white px-4 py-3.5 text-[14px] text-[#0A2F5C] placeholder:text-[#9BAAB9] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
          />

          <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="signin-password">
            {t("signin.passwordLabel")}
          </label>
          <input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleLogin(); }}
            placeholder={t("signin.passwordPlaceholder")}
            className="rounded-xl border border-[#E4EAF0] bg-white px-4 py-3.5 text-[14px] text-[#0A2F5C] placeholder:text-[#9BAAB9] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
          />

          <Link to={`${base}/recover`} className="self-end text-[12.5px] font-semibold text-[#0E7FB0] hover:text-[#0A2F5C] transition-colors">
            {t("signin.forgotPassword")}
          </Link>

          <button
            type="button"
            disabled={checking}
            onClick={() => void handleLogin()}
            className="rounded-2xl text-white font-bold text-[15px] text-center py-4 shadow-[0_10px_26px_rgba(10,42,74,0.14)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(90deg,#78B72E 0%,#17927E 55%,#0E7FB0 100%)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {checking ? t("signin.checking") : t("signin.loginButton")}
          </button>

          <p className="text-center text-[12.5px] text-[#66798F]">
            {t("signin.noAccount")}{" "}
            <Link to={`${base}/register`} className="font-bold text-[#0E7FB0] hover:text-[#0A2F5C] transition-colors">
              {t("signin.registerLink")}
            </Link>
          </p>
        </div>

        {/* Secondary sign-in methods — progressive disclosure so the default
            screen stays simple */}
        <div className="flex flex-col items-center gap-1.5">
          <button type="button" onClick={() => togglePanel("magic")} className="text-[12.5px] font-semibold text-[#0E7FB0] hover:text-[#0A2F5C] transition-colors cursor-pointer">
            {t("signin.magicLinkPrompt")}
          </button>
          <button type="button" onClick={() => togglePanel("phone")} className="text-[12.5px] font-semibold text-[#0E7FB0] hover:text-[#0A2F5C] transition-colors cursor-pointer">
            {t("signin.phoneOtpPrompt")}
          </button>
          <button type="button" onClick={() => togglePanel("sso")} className="text-[12.5px] font-semibold text-[#0E7FB0] hover:text-[#0A2F5C] transition-colors cursor-pointer">
            {t("signin.ssoPrompt")}
          </button>
        </div>

        {panel === "magic" && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-[#E4EAF0] bg-white p-4">
            {magicSent ? (
              <p className="text-[13px] text-[#66798F] text-center">{t("signin.magicLinkSent")}</p>
            ) : (
              <>
                <p className="text-[12px] text-[#66798F]">{identifier || t("signin.usernamePlaceholder")}</p>
                <button
                  type="button"
                  disabled={magicSending}
                  onClick={() => void handleMagicLink()}
                  className="rounded-xl bg-[#EDF2F5] text-[#0A2F5C] font-bold text-[13px] text-center py-2.5 cursor-pointer disabled:opacity-60"
                >
                  {magicSending ? t("signin.checking") : t("signin.magicLinkSend")}
                </button>
              </>
            )}
          </div>
        )}

        {panel === "phone" && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-[#E4EAF0] bg-white p-4">
            <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="signin-phone-otp">
              {t("signin.phoneOtpNumberLabel")}
            </label>
            <input
              id="signin-phone-otp"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={phoneStep === "codeSent"}
              placeholder="+221 77 000 00 00"
              className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30 disabled:opacity-60"
            />
            {phoneStep === "input" ? (
              <button
                type="button"
                disabled={phoneSending}
                onClick={() => void handleSendPhoneCode()}
                className="rounded-xl bg-[#EDF2F5] text-[#0A2F5C] font-bold text-[13px] text-center py-2.5 cursor-pointer disabled:opacity-60"
              >
                {phoneSending ? t("signin.checking") : t("signin.phoneOtpSendCode")}
              </button>
            ) : (
              <>
                <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="signin-phone-code">
                  {t("signin.phoneOtpCodeLabel")}
                </label>
                <input
                  id="signin-phone-code"
                  inputMode="numeric"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  placeholder="000000"
                  className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-center font-mono tracking-[0.3em] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
                />
                <button
                  type="button"
                  disabled={phoneSending}
                  onClick={() => void handleVerifyPhoneCode()}
                  className="rounded-xl bg-[#EDF2F5] text-[#0A2F5C] font-bold text-[13px] text-center py-2.5 cursor-pointer disabled:opacity-60"
                >
                  {phoneSending ? t("signin.checking") : t("signin.phoneOtpVerify")}
                </button>
              </>
            )}
          </div>
        )}

        {panel === "sso" && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-[#E4EAF0] bg-white p-4">
            <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="signin-sso-email">
              {t("signin.ssoWorkEmailLabel")}
            </label>
            <input
              id="signin-sso-email"
              type="email"
              value={ssoEmail}
              onChange={(e) => setSsoEmail(e.target.value)}
              placeholder="you@company.com"
              className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
            />
            <button
              type="button"
              disabled={ssoSending}
              onClick={() => void handleSsoContinue()}
              className="rounded-xl bg-[#EDF2F5] text-[#0A2F5C] font-bold text-[13px] text-center py-2.5 cursor-pointer disabled:opacity-60"
            >
              {ssoSending ? t("signin.checking") : t("signin.ssoContinueButton")}
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E4EAF0]" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9BAAB9]">{t("signin.orDivider")}</span>
          <div className="h-px flex-1 bg-[#E4EAF0]" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wide text-[#66798F] -mb-1 text-center">{t("signin.ssoSectionTitle")}</span>
        <div className="grid grid-cols-5 gap-2">
          {OAUTH_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={oauthPending !== null}
              onClick={() => void handleOAuthClick(p.id, p.label)}
              aria-label={`${t("signin.signInWith", { provider: p.label })}`}
              className="flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-[13px] border border-[#E4EAF0]"
                style={{ background: p.bg }}
              >
                {p.initial}
              </div>
              <span className="text-[9px] font-semibold text-[#66798F]">
                {oauthPending === p.id ? t("signin.checking") : p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="relative z-10 text-[11px] leading-relaxed text-[#9BAAB9] text-center px-8 pb-8 max-w-md mx-auto w-full">
        {t("signin.terms")}
      </p>
    </div>
  );
}
