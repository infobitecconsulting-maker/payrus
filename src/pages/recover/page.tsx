import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { resolveEmailByIdentifier } from "@/lib/backend.ts";
import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import { supabase } from "@/lib/supabase-client.ts";

// One step: resolve whatever the user remembers (username, email, or phone)
// to an email, then let Supabase send a real reset link — no more demo
// 6-digit code shown in the UI. The link lands on reset-password/page.tsx.
export default function Recover() {
  const { t } = useTranslation("common");
  const { lng = "en" } = useParams<{ lng?: string }>();
  const base = `/${lng}`;
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequestReset = async () => {
    if (!identifier.trim()) {
      toast.error(t("recover.identifierRequired"));
      return;
    }
    setSaving(true);
    try {
      const email = await resolveEmailByIdentifier(identifier.trim());
      if (!email) {
        toast.error(t("signin.accountNotFoundLogin"));
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${base}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
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
          onClick={() => navigate(`${base}/signin`)}
          className="w-9 h-9 rounded-lg bg-white/80 border border-[#E4EAF0] flex items-center justify-center text-[#0A2F5C] cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <LocaleSwitcher />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center gap-6 px-8 py-6 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-2.5 text-center">
          <h1 className="font-bold text-[24px] leading-tight text-[#0A2F5C]" style={{ fontFamily: "'Sora', sans-serif" }}>
            {t("recover.headline")}
          </h1>
          <p className="text-[13.5px] leading-relaxed text-[#66798F]">
            {sent ? t("recover.emailSentSubtitle", { identifier: identifier.trim() }) : t("recover.subtitle")}
          </p>
        </div>

        {!sent && (
          <div className="flex flex-col gap-3">
            <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="recover-identifier">
              {t("recover.identifierLabel")}
            </label>
            <input
              id="recover-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleRequestReset(); }}
              placeholder={t("recover.identifierPlaceholder")}
              className="rounded-xl border border-[#E4EAF0] bg-white px-4 py-3.5 text-[14px] text-[#0A2F5C] placeholder:text-[#9BAAB9] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
            />

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleRequestReset()}
              className="rounded-2xl text-white font-bold text-[15px] text-center py-4 shadow-[0_10px_26px_rgba(10,42,74,0.14)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(90deg,#78B72E 0%,#17927E 55%,#0E7FB0 100%)",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {saving ? t("signin.checking") : t("recover.sendCode")}
            </button>
          </div>
        )}

        {sent && (
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
        )}
      </div>
    </div>
  );
}
