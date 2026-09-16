import { useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api.js";
import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import { COUNTRY_OPTIONS, callingCodeForCountry } from "@/convex/geo.ts";
import { provincesForCountry, citiesForCountry } from "@/convex/addressRegister.ts";
import { setLocalUserId } from "@/lib/local-user.ts";
import { useProfile } from "@/contexts/profile-context.tsx";
import { routeAfterIdentity } from "@/lib/post-auth-routing.ts";
import { supabase } from "@/lib/supabase-client.ts";
import { OAUTH_PROVIDERS, signInWithOAuthProvider, type OAuthProviderId } from "@/lib/supabase-providers.ts";

interface LocationState {
  email?: string;
  phone?: string;
}

type Step = "details" | "checkEmail";

export default function Register() {
  const { t } = useTranslation("common");
  const { lng = "en" } = useParams<{ lng?: string }>();
  const base = `/${lng}`;
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const { setProfile } = useProfile();
  const upsertSupabaseUser = useMutation(api.supabaseAuth.upsertSupabaseUser);
  const completeRegistrationProfile = useMutation(api.supabaseAuth.completeRegistrationProfile);
  const [oauthPending, setOauthPending] = useState<OAuthProviderId | null>(null);
  const [ssoExpanded, setSsoExpanded] = useState(false);

  const [step, setStep] = useState<Step>("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(state.email ?? "");
  const [phone, setPhone] = useState(state.phone ?? "");
  const [country, setCountry] = useState("");
  // Tracks the last calling-code prefix we auto-inserted, so a SECOND (or
  // later) country change can still re-adjust the prefix — but only while
  // the field still holds exactly what we last auto-filled; once the user
  // types their own digits this stops matching and we leave it alone.
  const autoFilledPhoneRef = useRef("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // OAuth sign-up is really just sign-in: the account is found-or-created
  // once Supabase redirects back (src/pages/auth-callback/page.tsx), from
  // the verified provider profile — no manual form to fill in afterwards.
  // Redirect-based, so there is nothing to route on here even on success.
  const handleOAuthClick = async (provider: OAuthProviderId, label: string) => {
    setOauthPending(provider);
    try {
      await signInWithOAuthProvider(provider, base);
    } catch {
      toast.error(t("signin.oauthFailed", { provider: label }));
      setOauthPending(null);
    }
  };

  const handleSubmitDetails = async () => {
    if (
      !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !country ||
      !street.trim() || !houseNumber.trim() || !city.trim() || !province
    ) {
      toast.error(t("register.allFieldsRequired"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("register.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("register.passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      const trimmedEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { firstName: firstName.trim(), lastName: lastName.trim() } },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.user) {
        toast.error(t("register.saveFailed"));
        return;
      }

      // The Supabase auth.users row exists immediately regardless of email
      // confirmation status, so the submitted profile/address data can be
      // saved right away rather than waiting on confirmation.
      const { userId, name } = await upsertSupabaseUser({
        supabaseUserId: data.user.id,
        email: trimmedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await completeRegistrationProfile({
        userId, phone: phone.trim(), country,
        street: street.trim(), houseNumber: houseNumber.trim(), city: city.trim(), province,
        postalCode: postalCode.trim() || undefined,
      });

      if (data.session) {
        // Email confirmation is off for this project — Supabase already
        // signed them in, so skip straight to onboarding like a login would.
        setLocalUserId(userId);
        toast.success(t("signin.welcomeBack"));
        routeAfterIdentity({ userId, roles: [], navigate, base, setProfile, displayName: name });
        return;
      }
      setStep("checkEmail");
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(t("register.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

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
          onClick={() => (step === "checkEmail" ? setStep("details") : navigate(`${base}/signin`))}
          className="w-9 h-9 rounded-lg bg-white/80 border border-[#E4EAF0] flex items-center justify-center text-[#0A2F5C] cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <LocaleSwitcher />
      </div>

      {step === "details" && (
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-6 px-8 py-6 max-w-md mx-auto w-full">
          <div className="flex flex-col gap-2.5 text-center">
            <h1 className="font-bold text-[24px] leading-tight text-[#0A2F5C]" style={{ fontFamily: "'Sora', sans-serif" }}>
              {t("register.headline")}
            </h1>
            <p className="text-[13.5px] leading-relaxed text-[#66798F]">
              {t("register.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-firstname">{t("register.firstName")}</label>
              <input
                id="reg-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-lastname">{t("register.lastName")}</label>
              <input
                id="reg-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-email">{t("register.email")}</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-country">{t("register.country")}</label>
              <select
                id="reg-country"
                value={country}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  setCountry(nextCountry);
                  setProvince("");
                  // Adapt the phone field's country code to match. Re-runs on
                  // every country change (not just the first) as long as the
                  // field is still empty or still holds exactly what we last
                  // auto-filled — so switching country repeatedly keeps the
                  // prefix in sync, while a number the user actually typed is
                  // never clobbered.
                  if (!phone.trim() || phone === autoFilledPhoneRef.current) {
                    const dial = callingCodeForCountry(nextCountry);
                    if (dial) {
                      const nextPhone = `+${dial} `;
                      setPhone(nextPhone);
                      autoFilledPhoneRef.current = nextPhone;
                    }
                  }
                }}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              >
                <option value="" disabled>{t("register.countryPlaceholder")}</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-phone">{t("register.phone")}</label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  // A manual edit means the field no longer just holds our
                  // auto-filled prefix — stop re-adjusting it on future
                  // country changes until it's empty again.
                  autoFilledPhoneRef.current = "";
                }}
                placeholder={country ? `+${callingCodeForCountry(country)} ...` : undefined}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-street">{t("register.street")}</label>
              <input
                id="reg-street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-house-number">{t("register.houseNumber")}</label>
              <input
                id="reg-house-number"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-city">{t("register.city")}</label>
              {citiesForCountry(country).length > 0 ? (
                <select
                  id="reg-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!country}
                  className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30 disabled:opacity-50"
                >
                  <option value="" disabled>{t("register.cityPlaceholder")}</option>
                  {citiesForCountry(country).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="reg-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("register.cityPlaceholder")}
                  className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-province">{t("register.province")}</label>
              {provincesForCountry(country).length > 0 ? (
                <select
                  id="reg-province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  disabled={!country}
                  className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30 disabled:opacity-50"
                >
                  <option value="" disabled>{t("register.provincePlaceholder")}</option>
                  {provincesForCountry(country).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="reg-province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  disabled={!country}
                  placeholder={t("register.provincePlaceholder")}
                  className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30 disabled:opacity-50"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-postal-code">{t("register.postalCode")}</label>
              <input
                id="reg-postal-code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-password">{t("register.password")}</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reg-password-confirm">{t("register.confirmPassword")}</label>
              <input
                id="reg-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-3.5 py-3 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmitDetails()}
            className="rounded-2xl text-white font-bold text-[15px] text-center py-4 shadow-[0_10px_26px_rgba(10,42,74,0.14)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(90deg,#78B72E 0%,#17927E 55%,#0E7FB0 100%)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {saving ? t("signin.checking") : t("register.submit")}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E4EAF0]" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9BAAB9]">{t("signin.orDivider")}</span>
            <div className="h-px flex-1 bg-[#E4EAF0]" />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#66798F] text-center">{t("register.ssoTitle")}</span>
            <button
              type="button"
              onClick={() => setSsoExpanded((v) => !v)}
              className="rounded-2xl bg-[#EDF2F5] text-[#0A2F5C] font-bold text-[15px] text-center py-4 cursor-pointer"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {t("register.ssoButton")}
            </button>
            {ssoExpanded && (
              <div className="grid grid-cols-5 gap-2 pt-1">
                {OAUTH_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={oauthPending !== null}
                    onClick={() => void handleOAuthClick(p.id, p.label)}
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
            )}
          </div>
        </div>
      )}

      {step === "checkEmail" && (
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-6 px-8 py-6 max-w-md mx-auto w-full">
          <div className="flex flex-col gap-2.5 text-center">
            <h1 className="font-bold text-[24px] leading-tight text-[#0A2F5C]" style={{ fontFamily: "'Sora', sans-serif" }}>
              {t("register.checkEmailHeadline")}
            </h1>
            <p className="text-[13.5px] leading-relaxed text-[#66798F]">
              {t("register.checkEmailSubtitle", { email: email.trim() })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`${base}/signin`)}
            className="rounded-2xl text-white font-bold text-[15px] text-center py-4 shadow-[0_10px_26px_rgba(10,42,74,0.14)] cursor-pointer"
            style={{
              background: "linear-gradient(90deg,#78B72E 0%,#17927E 55%,#0E7FB0 100%)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {t("register.backToSignin")}
          </button>
        </div>
      )}
    </div>
  );
}
