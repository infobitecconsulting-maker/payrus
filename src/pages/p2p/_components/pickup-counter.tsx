import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Banknote } from "lucide-react";
import { confirmPickup, type PickupResult } from "@/lib/backend.ts";

// Agent counter: pays out a cash pickup only when the 8-digit code AND the
// receiver's ID number both match (payout_confirm_pickup, migration 0038).
export default function PickupCounter() {
  const { t } = useTranslation("common");
  const [code, setCode] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PickupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await confirmPickup(code.trim(), idNumber.trim());
      setResult(r);
      if (r.ok) { setCode(""); setIdNumber(""); }
    } catch (e) {
      setError(/only agents/i.test(e instanceof Error ? e.message : "") ? t("p2p.pickup.notAllowed") : t("p2p.new.failed"));
    } finally { setBusy(false); }
  };

  const text = !result ? null
    : result.ok ? t("p2p.pickup.paid", { amount: `${(result.amount ?? 0).toLocaleString()} ${result.currency ?? ""}`, name: result.receiverName ?? "" })
    : result.reason === "id_mismatch" ? t("p2p.pickup.mismatch") : result.reason === "blocked" ? t("p2p.pickup.blocked") : t("p2p.pickup.notFound");

  return (
    <div className="mb-5 rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold"><Banknote size={14} className="text-primary" />{t("p2p.pickup.title")}</div>
      <p className="text-[11px] text-muted-foreground">{t("p2p.pickup.intro")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pk-code" className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t("p2p.pickup.code")}</label>
          <input id="pk-code" inputMode="numeric" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoComplete="off"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-mono focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label htmlFor="pk-id" className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t("p2p.pickup.id")}</label>
          <input id="pk-id" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} autoComplete="off"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50" />
        </div>
      </div>
      <button disabled={busy || code.length !== 8 || idNumber.trim().length < 4} onClick={() => void submit()}
        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer disabled:opacity-50">{t("p2p.pickup.confirm")}</button>
      {text && <div role="status" className={result?.ok ? "text-xs text-primary font-semibold" : "text-xs text-destructive font-semibold"}>{text}</div>}
      {error && <div role="status" className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
