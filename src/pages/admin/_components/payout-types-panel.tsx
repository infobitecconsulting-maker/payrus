import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import {
  channelTypeReadiness, clearChannelTypeCountry, listChannelTypeCountries, listChannelTypes, setChannelType, setChannelTypeCountry, simulateChannelType,
  type ChannelTypeCountryRow, type ChannelTypeRow, type ChannelTypeSim, type ReadinessRow,
} from "@/lib/partners.ts";

// Payout types — PayRus agent, partner distributor, mobile money, bank remittance: pricing parameters, per-country overrides and onboarding readiness.
const CATEGORIES = ["agent_network", "distribution_partner", "wallet", "bank"];
const METHODS = ["mobile_money", "bank", "cash_pickup"];
const DELIVERY = ["near_real_time", "same_day", "t_plus_1", "t_plus_2"];
const SEV: Record<string, string> = { blocker: "bg-destructive text-white", warning: "bg-amber-100 text-amber-700", ok: "bg-primary/10 text-primary" };
const errText = (e: unknown) => (e instanceof Error ? e.message.replace(/^[A-Za-z_]+: /, "") : "Action failed");
const n2 = (n: number | null | undefined) => (n == null ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: 4 }));
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
const btn = "text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary cursor-pointer disabled:opacity-50";
const btnPrimary = "text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer disabled:opacity-50";
const inputCls = "w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs mt-1 font-normal normal-case text-foreground disabled:opacity-60";
const labelCls = "text-[10px] font-semibold uppercase text-muted-foreground";

const blankOverride = (code: string): ChannelTypeCountryRow => ({ code, country: "", active: true, ownCostFlatEur: null, ownCostPercent: null, marginFlatEur: null, marginPercent: null, premiumEur: null, minFeeEur: null, maxFeeEur: null, deliveryTime: null });
const blankType = (): ChannelTypeRow => ({
  code: "", label: "", category: "distribution_partner", method: "cash_pickup", agentKind: null, costSource: "partner", active: true, sortOrder: 100, ownCostFlatEur: 0, ownCostPercent: 0,
  marginFlatEur: 0, marginPercent: 0, premiumEur: 0, minFeeEur: null, maxFeeEur: null, deliveryTime: null, onboardingRequirements: [], notes: null, countryOverrides: 0,
});

export default function PayoutTypesPanel({ isSuper }: { isSuper: boolean }) {
  const [types, setTypes] = useState<ChannelTypeRow[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelTypeRow | null>(null);
  const [ready, setReady] = useState<ReadinessRow[]>([]);
  const [overrides, setOverrides] = useState<ChannelTypeCountryRow[]>([]);
  const [ov, setOv] = useState<ChannelTypeCountryRow | null>(null);
  const [sim, setSim] = useState<{ country: string; amount: string; rows: ChannelTypeSim[] | null }>({ country: "CD", amount: "100", rows: null });
  const load = useCallback(() => { listChannelTypes().then(setTypes).catch((e) => toast.error(errText(e))); }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (!sel) return;
    void channelTypeReadiness(sel).then(setReady).catch(() => setReady([]));
    void listChannelTypeCountries(sel).then(setOverrides).catch(() => setOverrides([]));
  }, [sel, types]);
  const pick = (t: ChannelTypeRow) => { setSel(t.code); setForm({ ...t }); setOv(null); setSim((s) => ({ ...s, rows: null })); };
  const ask = () => window.prompt("Written reason (5+ characters):");
  const save = () => {
    if (!form) return; const reason = ask(); if (reason === null) return;
    setChannelType(form, reason).then(() => { toast.success("Saved"); setSel(form.code); load(); }).catch((e) => toast.error(errText(e)));
  };
  const saveOv = () => {
    if (!ov) return; const reason = ask(); if (reason === null) return;
    setChannelTypeCountry({ ...ov, country: ov.country.toUpperCase() }, reason).then(() => { toast.success("Saved"); setOv(null); load(); if (sel) void listChannelTypeCountries(sel).then(setOverrides); }).catch((e) => toast.error(errText(e)));
  };
  const numField = (label: string, get: number | null, set: (v: number | null) => void) => (
    <label className={labelCls}>{label}<input className={inputCls} type="number" step="0.01" disabled={!isSuper} value={get == null ? "" : String(get)} onChange={(e) => set(numOrNull(e.target.value))} /></label>
  );
  const ovNum = (label: string, k: "ownCostFlatEur" | "ownCostPercent" | "marginFlatEur" | "marginPercent" | "premiumEur" | "minFeeEur" | "maxFeeEur") => (
    <label className={labelCls}>{label}<input className={inputCls} type="number" step="0.01" disabled={!isSuper} placeholder="type default" value={ov?.[k] == null ? "" : String(ov[k])} onChange={(e) => ov && setOv({ ...ov, [k]: numOrNull(e.target.value) })} /></label>
  );
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-muted-foreground">
        The transfer price varies with how the money is paid out. Each type is priced from its own cost (PayRus agents) or from the partner contract terms, plus the policy margin and the adjustments set here. Every parameter can be overridden per country.
      </div>
      {!isSuper && <div className="text-[11px] text-amber-700">Only the superadmin can change payout types.</div>}
      {(types ?? []).map((t) => (
        <button key={t.code} onClick={() => pick(t)} className={cn("w-full text-left bg-card border rounded-2xl p-3 space-y-1 cursor-pointer", sel === t.code ? "border-primary" : "border-border")}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold">{t.label} <span className="font-normal text-muted-foreground">· {t.code}</span></span>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", t.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>{t.active ? "on" : "off"}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {t.category.replace("_", " ")} · {t.method} · cost {t.costSource === "own" ? `own ${n2(t.ownCostFlatEur)} EUR + ${n2(t.ownCostPercent * 100)}%` : "partner terms"} · margin {n2(t.marginFlatEur)} EUR + {n2(t.marginPercent * 100)}% · {t.deliveryTime?.replace(/_/g, " ") ?? "delivery from terms"}{t.countryOverrides > 0 ? ` · ${t.countryOverrides} country override(s)` : ""}
          </div>
        </button>
      ))}
      <button className={btn} disabled={!isSuper} onClick={() => { setSel(null); setForm(blankType()); setOv(null); }}>Add a payout type</button>

      {form && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="text-sm font-bold">{form.code && sel ? `Set up: ${form.label}` : "New payout type"}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label className={labelCls}>Code<input className={inputCls} disabled={!isSuper || !!sel} maxLength={30} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} /></label>
            <label className={labelCls}>Label<input className={inputCls} disabled={!isSuper} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
            <label className={labelCls}>Category<select className={inputCls} disabled={!isSuper} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}</select></label>
            <label className={labelCls}>Payout method<select className={inputCls} disabled={!isSuper} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
            <label className={labelCls}>Agent network<select className={inputCls} disabled={!isSuper} value={form.agentKind ?? ""} onChange={(e) => setForm({ ...form, agentKind: e.target.value || null })}><option value="">—</option><option value="payrus_direct">PayRus direct agents</option><option value="correspondent">Partner agents</option></select></label>
            <label className={labelCls}>Cost comes from<select className={inputCls} disabled={!isSuper} value={form.costSource} onChange={(e) => setForm({ ...form, costSource: e.target.value })}><option value="partner">Partner contract terms</option><option value="own">PayRus own cost</option></select></label>
            <label className={labelCls}>Default delivery<select className={inputCls} disabled={!isSuper} value={form.deliveryTime ?? ""} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value || null })}><option value="">from terms</option>{DELIVERY.map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}</select></label>
            {numField("Sort order", form.sortOrder, (v) => setForm({ ...form, sortOrder: v ?? 100 }))}
            {numField("Own cost flat EUR", form.ownCostFlatEur, (v) => setForm({ ...form, ownCostFlatEur: v ?? 0 }))}
            {numField("Own cost % (0.008)", form.ownCostPercent, (v) => setForm({ ...form, ownCostPercent: v ?? 0 }))}
            {numField("Type margin flat EUR", form.marginFlatEur, (v) => setForm({ ...form, marginFlatEur: v ?? 0 }))}
            {numField("Type margin % (0.005)", form.marginPercent, (v) => setForm({ ...form, marginPercent: v ?? 0 }))}
            {numField("Premium EUR", form.premiumEur, (v) => setForm({ ...form, premiumEur: v ?? 0 }))}
            {numField("Min fee EUR", form.minFeeEur, (v) => setForm({ ...form, minFeeEur: v }))}
            {numField("Max fee EUR", form.maxFeeEur, (v) => setForm({ ...form, maxFeeEur: v }))}
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={!isSuper} checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Offered to senders</label>
          <label className={cn(labelCls, "block")}>Onboarding requirements (one per line)
            <textarea className={inputCls} rows={5} disabled={!isSuper} value={form.onboardingRequirements.join("\n")} onChange={(e) => setForm({ ...form, onboardingRequirements: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) })} /></label>
          <label className={cn(labelCls, "block")}>Notes<input className={inputCls} disabled={!isSuper} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} /></label>
          <button className={btnPrimary} disabled={!isSuper || !form.code || !form.label} onClick={save}>Save payout type</button>

          {sel && (
            <>
              <div className="border-t border-border pt-3 space-y-1.5">
                <div className="text-xs font-bold">Onboarding readiness</div>
                {ready.map((r, i) => <div key={i} className="flex items-start gap-2 text-[11px]"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", SEV[r.severity])}>{r.severity}</span><span>{r.message}</span></div>)}
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="text-xs font-bold">Country overrides</div>
                {overrides.length === 0 && <div className="text-[11px] text-muted-foreground">None — every country follows the type defaults.</div>}
                {overrides.map((o) => (
                  <div key={o.country} className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-bold">{o.country}</span><span>{o.active ? "on" : "off"}</span>
                    <span className="text-muted-foreground">margin {n2(o.marginFlatEur)} / {n2(o.marginPercent)} · own {n2(o.ownCostFlatEur)} / {n2(o.ownCostPercent)} · premium {n2(o.premiumEur)} · fee {n2(o.minFeeEur)}–{n2(o.maxFeeEur)}</span>
                    <button className={btn} onClick={() => setOv({ ...o })}>Edit</button>
                    <button className={btn} disabled={!isSuper} onClick={() => { const r = ask(); if (r === null) return; clearChannelTypeCountry(o.code, o.country, r).then(() => { toast.success("Removed"); load(); }).catch((e) => toast.error(errText(e))); }}>Remove</button>
                  </div>
                ))}
                <button className={btn} disabled={!isSuper} onClick={() => setOv(blankOverride(sel))}>Add a country override</button>
                {ov && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className={labelCls}>Country<input className={inputCls} maxLength={2} disabled={!isSuper} value={ov.country} onChange={(e) => setOv({ ...ov, country: e.target.value.toUpperCase() })} /></label>
                    {ovNum("Own cost flat EUR", "ownCostFlatEur")}{ovNum("Own cost %", "ownCostPercent")}{ovNum("Margin flat EUR", "marginFlatEur")}{ovNum("Margin %", "marginPercent")}{ovNum("Premium EUR", "premiumEur")}{ovNum("Min fee EUR", "minFeeEur")}{ovNum("Max fee EUR", "maxFeeEur")}
                    <label className={labelCls}>Delivery<select className={inputCls} disabled={!isSuper} value={ov.deliveryTime ?? ""} onChange={(e) => setOv({ ...ov, deliveryTime: e.target.value || null })}><option value="">type default</option>{DELIVERY.map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}</select></label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={!isSuper} checked={ov.active} onChange={(e) => setOv({ ...ov, active: e.target.checked })} />Offered here</label>
                    <div><button className={btnPrimary} disabled={!isSuper || ov.country.length !== 2} onClick={saveOv}>Save override</button></div>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="text-xs font-bold">Price check</div>
                <div className="flex items-end gap-2 flex-wrap">
                  <label className={labelCls}>Country<input className={cn(inputCls, "w-16")} maxLength={2} value={sim.country} onChange={(e) => setSim({ ...sim, country: e.target.value.toUpperCase() })} /></label>
                  <label className={labelCls}>Amount USD<input className={cn(inputCls, "w-24")} inputMode="decimal" value={sim.amount} onChange={(e) => setSim({ ...sim, amount: e.target.value })} /></label>
                  <button className={btnPrimary} onClick={() => simulateChannelType(sim.country, sel, Number(sim.amount) || 100).then((rows) => setSim((s) => ({ ...s, rows }))).catch((e) => toast.error(errText(e)))}>Simulate</button>
                </div>
                {sim.rows?.map((r, i) => <div key={i} className="text-[11px]">Sender fee <span className="font-bold">{n2(r.feeEur)} EUR</span> · PayRus cost {n2(r.costEur)} EUR · {r.partnerName ?? "PayRus network"} · {r.deliveryTime?.replace(/_/g, " ") ?? "—"} · {r.source}</div>)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
