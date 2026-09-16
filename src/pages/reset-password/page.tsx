import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import LocaleSwitcher from "@/components/ui/locale-switcher.tsx";
import { supabase } from "@/lib/supabase-client.ts";

type Status = "checking" | "ready" | "invalid";

// Landing page for the real reset-password email Supabase sends
// (resetPasswordForEmail, triggered from recover/page.tsx). Supabase
// auto-detects the recovery token from the URL into a temporary session on
// load — this page just waits for that, then lets the user set a new
// password via updateUser.
export default function ResetPassword() {
  const { t } = useTranslation("common");
  const { lng = "en" } = useParams<{ lng?: string }>();
  const base = `/${lng}`;
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let settled = false;
    const markReady = () => {
      if (!settled) {
        settled = true;
        setStatus("ready");
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) markReady();
    });
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setStatus("invalid");
      }
    }, 8000);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      toast.error(t("register.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(t("register.passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("resetPassword.success"));
      navigate(`${base}/signin`);
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
        {status === "checking" && (
          <p className="text-center text-[13.5px] text-[#66798F]">{t("signin.checking")}</p>
        )}

        {status === "invalid" && (
          <div className="flex flex-col gap-2.5 text-center">
            <h1 className="font-bold text-[22px] text-[#0A2F5C]" style={{ fontFamily: "'Sora', sans-serif" }}>
              {t("resetPassword.invalidHeadline")}
            </h1>
            <p className="text-[13.5px] text-[#66798F]">{t("resetPassword.invalidSubtitle")}</p>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="flex flex-col gap-2.5 text-center">
              <h1 className="font-bold text-[24px] leading-tight text-[#0A2F5C]" style={{ fontFamily: "'Sora', sans-serif" }}>
                {t("resetPassword.headline")}
              </h1>
              <p className="text-[13.5px] leading-relaxed text-[#66798F]">{t("resetPassword.subtitle")}</p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reset-new-password">
                {t("recover.newPassword")}
              </label>
              <input
                id="reset-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border border-[#E4EAF0] bg-white px-4 py-3.5 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />

              <label className="text-[11px] font-bold tracking-wide text-[#66798F]" htmlFor="reset-confirm-password">
                {t("recover.confirmNewPassword")}
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
                className="rounded-xl border border-[#E4EAF0] bg-white px-4 py-3.5 text-[14px] text-[#0A2F5C] focus:outline-none focus:ring-2 focus:ring-[#0E7FB0]/30"
              />

              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSubmit()}
                className="rounded-2xl text-white font-bold text-[15px] text-center py-4 shadow-[0_10px_26px_rgba(10,42,74,0.14)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(90deg,#78B72E 0%,#17927E 55%,#0E7FB0 100%)",
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                {saving ? t("signin.checking") : t("resetPassword.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
