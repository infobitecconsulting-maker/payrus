import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/ui/page-header.tsx";
import { useAdminCreateUserMutation } from "@/hooks/use-backend.ts";

// Manual (agent-assisted) customer registration — for the common case in
// PayRus's actual market (agent cash-in/cash-out kiosks) where the end
// customer has no smartphone/data to self-register with, so an agent or
// admin enters their details on the customer's behalf instead. This is
// deliberately a smaller field set than the self-service register/page.tsx
// flow (name, email, role, kind only) — it calls the exact same
// admin_create_user RPC the admin panel's "Add profile" form already uses
// (no separate backend needed), just surfaced here with copy/scope aimed at
// an agent doing this at a counter rather than an admin managing the whole
// user base. Reachable from the nav for "agent" and "admin" profiles only
// (see AppLayout.tsx) — a customer created here still goes through the same
// pending_verification/KYC-upload path as anyone else once they (or the
// agent, on a later visit) complete profile/page.tsx's wizard.
const CUSTOMER_ROLES = ["personal", "merchant", "group"] as const;

export default function RegisterCustomer() {
  const { t } = useTranslation("common");
  const createUser = useAdminCreateUserMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<(typeof CUSTOMER_ROLES)[number]>("personal");
  const [kind, setKind] = useState<"individual" | "organisation">("individual");
  const [saving, setSaving] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ name: string; email: string } | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("personal");
    setKind("individual");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error(t("register.allFieldsRequired"));
      return;
    }
    setSaving(true);
    try {
      const result = await createUser({ name: name.trim(), email: email.trim().toLowerCase(), role, kind });
      toast.success(
        result.alreadyExisted
          ? t("registerCustomer.alreadyExisted")
          : t("registerCustomer.created"),
      );
      setLastCreated({ name: name.trim(), email: email.trim().toLowerCase() });
      reset();
    } catch {
      toast.error(t("registerCustomer.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg pb-24 md:pb-6">
      <PageHeader title={t("registerCustomer.title")} className="mb-4 md:mb-6" />
      <p className="text-sm text-muted-foreground mb-6">{t("registerCustomer.subtitle")}</p>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            {t("registerCustomer.name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("registerCustomer.namePlaceholder")}
            className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            {t("registerCustomer.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("registerCustomer.emailPlaceholder")}
            className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            {t("registerCustomer.phone")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("registerCustomer.phonePlaceholder")}
            className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm"
          />
          <p className="text-[10px] text-muted-foreground mt-1">{t("registerCustomer.phoneHint")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase text-muted-foreground">
              {t("registerCustomer.role")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof CUSTOMER_ROLES)[number])}
              className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm"
            >
              {CUSTOMER_ROLES.map((r) => (
                <option key={r} value={r}>{t(`registerCustomer.roleOption.${r}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-muted-foreground">
              {t("registerCustomer.kind")}
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "individual" | "organisation")}
              className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm"
            >
              <option value="individual">{t("registerCustomer.kindIndividual")}</option>
              <option value="organisation">{t("registerCustomer.kindOrganisation")}</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-60"
        >
          <UserPlus size={15} /> {saving ? t("registerCustomer.saving") : t("registerCustomer.submit")}
        </button>
      </div>

      {lastCreated && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
          {t("registerCustomer.lastCreated", { name: lastCreated.name, email: lastCreated.email })}
        </div>
      )}
    </div>
  );
}
