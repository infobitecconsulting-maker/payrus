import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Bot, ShieldAlert, Lock } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useMyPermissions } from "@/hooks/use-backend.ts";
import * as org from "@/lib/org-backend.ts";

const errText = (e: unknown) => (e instanceof Error ? e.message.replace(/^[A-Za-z_]+: /, "") : "Action failed");
const MIN_REASON = 5;
const KIND_LABEL: Record<string, string> = { group: "Group", country_entity: "Country entity", corporate: "Corporate", site: "Site", branch: "Branch", agent: "Agent" };
const CHILD_KINDS: Record<string, string[]> = {
  group: ["country_entity"], country_entity: ["corporate", "branch", "agent"], corporate: ["site", "branch", "agent"],
  site: ["site", "branch", "agent"], branch: ["branch", "agent"], agent: [],
};
const PRIORITY_STYLE: Record<string, string> = {
  critical: "bg-destructive text-white", high: "bg-destructive/15 text-destructive", normal: "bg-amber-100 text-amber-700", low: "bg-secondary text-muted-foreground",
};
const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700", in_progress: "bg-accent/15 text-accent", awaiting_approval: "bg-violet-100 text-violet-700",
  escalated: "bg-destructive/10 text-destructive", resolved: "bg-primary/10 text-primary", closed: "bg-secondary text-muted-foreground",
};
const ACTION_LABEL: Record<string, string> = { complete: "Complete the transaction", refund: "Refund the customer", close_dispute: "Close the dispute as resolved" };
const RESOURCES = ["orgs", "profiles", "users", "transactions", "cases", "kyc_sensitive", "reports"];

const btn = "text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary cursor-pointer disabled:opacity-50";
const btnPrimary = "text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer disabled:opacity-50";
const field = "w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs";

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground bg-card border border-border rounded-2xl p-4">{children}</div>;
}

/* ─── Members + sub-organisations ─────────────────────────────── */

function MembersTab({ org: o, orgs, caps, isSuper }: { org: org.Org; orgs: org.Org[]; caps: Record<string, org.OrgCapability>; isSuper: boolean }) {
  const qc = useQueryClient();
  const members = useQuery({ queryKey: ["org", "members", o.id], queryFn: () => org.orgMembers(o.id), enabled: !!caps.profiles?.canRead, retry: false });
  const tpl = useQuery({ queryKey: ["org", "templates"], queryFn: org.orgTemplates });
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [subName, setSubName] = useState("");
  const [subKind, setSubKind] = useState("");
  const [subCountry, setSubCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const usable = (tpl.data?.templates ?? []).filter((t) => t.appliesTo.includes(o.kind) && (isSuper || !t.groupOnly));
  const kinds = CHILD_KINDS[o.kind] ?? [];
  const kind = subKind || kinds[0] || "";
  const children = orgs.filter((x) => x.parentId === o.id);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["org"] }); };

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); refresh(); } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold">Internal profiles in {o.name}</div>
        {!caps.profiles?.canRead ? <div className="text-xs text-muted-foreground">Your role does not include viewing internal profiles here.</div> : (
          <div className="divide-y divide-border">
            {(members.data ?? []).map((m) => (
              <div key={m.memberId} className="py-2 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{m.userName ?? m.userEmail}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{m.userEmail} · {m.templateLabel}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", m.status === "active" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>{m.status}</span>
                  {caps.profiles?.canUpdate && (
                    <button className={btn} disabled={busy} onClick={() => void run(() => org.setMemberStatus(m.memberId, m.status === "active" ? "suspended" : "active"), "Profile updated")}>
                      {m.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {members.data?.length === 0 && <div className="py-2 text-xs text-muted-foreground">No internal profiles yet.</div>}
          </div>
        )}
        {caps.profiles?.canCreate && (
          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 pt-2 border-t border-border">
            <input className={field} placeholder="Colleague's PayRus email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className={field} value={slug || usable[0]?.slug || ""} onChange={(e) => setSlug(e.target.value)}>
              {usable.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
            </select>
            <button className={btnPrimary} disabled={busy || !email.trim() || !(slug || usable[0])} onClick={() => void run(async () => { await org.grantMemberByEmail({ email, orgId: o.id, templateSlug: slug || usable[0].slug }); setEmail(""); }, "Profile granted")}>Add</button>
            <div className="sm:col-span-3 text-[10px] text-muted-foreground">
              Roles come from Group-defined templates. You can only grant what you hold yourself here; new permission types are set by the PayRus Group.
              {usable.find((t) => t.slug === (slug || usable[0]?.slug))?.description && <> {usable.find((t) => t.slug === (slug || usable[0]?.slug))?.description}</>}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold">Units directly below {o.name}</div>
        <div className="divide-y divide-border">
          {children.map((c) => (
            <div key={c.id} className="py-2 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0"><span className="font-semibold">{c.name}</span> <span className="text-[10px] text-muted-foreground">· {KIND_LABEL[c.kind]}{c.country ? ` · ${c.country}` : ""} · {c.operatingLevel} · {c.memberCount} member(s)</span></div>
              {(caps.orgs?.canUpdate || isSuper) && (
                <button className={btn} disabled={busy} onClick={() => void run(() => org.setOrgStatus(c.id, c.status === "active" ? "suspended" : "active"), "Unit updated")}>{c.status === "active" ? "Suspend" : "Reactivate"}</button>
              )}
            </div>
          ))}
          {children.length === 0 && <div className="py-2 text-xs text-muted-foreground">No sub-organisations.</div>}
        </div>
        {caps.orgs?.canCreate && kinds.length > 0 && (
          <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2 pt-2 border-t border-border">
            <input className={field} placeholder="Name of the new unit" value={subName} onChange={(e) => setSubName(e.target.value)} />
            <select className={field} value={kind} onChange={(e) => setSubKind(e.target.value)}>{kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
            <input className={cn(field, "sm:w-20")} placeholder="Country" maxLength={2} value={subCountry} onChange={(e) => setSubCountry(e.target.value.toUpperCase())} />
            <button className={btnPrimary} disabled={busy || subName.trim().length < 2} onClick={() => void run(async () => { await org.createOrg({ parentId: o.id, kind, name: subName.trim(), country: subCountry || undefined }); setSubName(""); }, "Unit created")}>Create</button>
            <div className="sm:col-span-4 text-[10px] text-muted-foreground">The new unit inherits this organisation's operating level; only the PayRus Group superadmin can change it.</div>
          </div>
        )}
        {isSuper && (
          <div className="flex items-center gap-2 pt-2 border-t border-border text-[11px]">
            <span className="text-muted-foreground">Operating level of {o.name}:</span>
            <select className="rounded-lg border border-border bg-card px-2 py-1 text-xs" value={o.operatingLevel} onChange={(e) => void run(() => org.setOrgLevel(o.id, e.target.value), "Operating level updated")}>
              {(tpl.data?.levels ?? []).map((l) => <option key={l.slug} value={l.slug}>{l.label} (depth {l.maxDepth})</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Customers (masked) + break-glass ────────────────────────── */

function CustomerDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["org", "customer", id], queryFn: () => org.orgCustomerDetail(id), retry: false });
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const d = q.data;
  const open = async () => {
    setBusy(true);
    try { await org.requestBreakGlass(id, reason.trim()); toast.success("Sensitive data opened for 30 minutes — the home country was notified"); setReason(""); void qc.invalidateQueries({ queryKey: ["org"] }); }
    catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between"><div className="text-xs font-bold">Customer record</div><button className={btn} onClick={onClose}>Close</button></div>
      {q.error && <div className="text-xs text-destructive">{errText(q.error)}</div>}
      {d && (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-muted-foreground">Name</span><span>{d.name}</span>
            <span className="text-muted-foreground">Email</span><span>{d.email ?? "—"}</span>
            <span className="text-muted-foreground">Phone</span><span>{d.phone ?? "—"}</span>
            <span className="text-muted-foreground">Home country</span><span>{d.homeCountry ?? "—"}</span>
            <span className="text-muted-foreground">KYC</span><span>{d.kycStatus}</span>
            {!d.masked && (<><span className="text-muted-foreground">Date of birth</span><span>{d.dateOfBirth ?? "—"}</span><span className="text-muted-foreground">Address</span><span>{d.address ?? "—"}</span><span className="text-muted-foreground">ID type</span><span>{d.idType ?? "—"}</span></>)}
          </div>
          {d.masked ? (
            <div className="rounded-xl bg-secondary/40 border border-border p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold"><Lock size={12} /> Sensitive KYC data stays with the home country ({d.homeCountry ?? "—"})</div>
              <div className="text-[11px] text-muted-foreground">If you must see it to resolve an issue, open it with a written reason. Access is read-only for 30 minutes, logged, and the home entity is notified.</div>
              <textarea className={field} rows={2} placeholder="Why do you need the sensitive record? (20+ characters)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <button className={btnPrimary} disabled={busy || reason.trim().length < 20} onClick={() => void open()}><ShieldAlert size={11} className="inline mr-1" />Open sensitive data (break-glass)</button>
            </div>
          ) : <div className="text-[10px] text-muted-foreground">You have access to the sensitive record (home-country role or an active break-glass window).</div>}
        </>
      )}
    </div>
  );
}

function CustomersTab({ o }: { o: org.Org }) {
  const q = useQuery({ queryKey: ["org", "customers", o.id], queryFn: () => org.orgCustomers(o.id), retry: false });
  const [sel, setSel] = useState<string | null>(null);
  if (q.error) return <Empty>{errText(q.error)}</Empty>;
  return (
    <div className="space-y-3">
      {sel && <CustomerDetail id={sel} onClose={() => setSel(null)} />}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {(q.data ?? []).map((c) => (
          <button key={c.id} onClick={() => setSel(c.id)} className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-secondary/30 cursor-pointer">
            <span><span className="font-semibold">{c.maskedName}</span> <span className="text-[10px] text-muted-foreground">{c.maskedEmail}</span></span>
            <span className="text-[10px] text-muted-foreground">{c.homeCountry ?? "—"} · KYC {c.kycStatus}{c.sensitiveVisible ? " · full access" : ""}</span>
          </button>
        ))}
        {q.data?.length === 0 && <div className="px-4 py-3 text-xs text-muted-foreground">No customers in this organisation yet.</div>}
      </div>
    </div>
  );
}

/* ─── Transactions initiated in scope ─────────────────────────── */

function TransactionsTab({ o, canCase, onOpenCase }: { o: org.Org; canCase: boolean; onOpenCase: (t: org.OrgTransfer) => void }) {
  const q = useQuery({ queryKey: ["org", "transfers", o.id], queryFn: () => org.orgTransfers(o.id), retry: false });
  if (q.error) return <Empty>{errText(q.error)}</Empty>;
  return (
    <div className="bg-card border border-border rounded-2xl divide-y divide-border">
      <div className="px-4 py-2 text-[10px] text-muted-foreground">Transactions initiated in this organisation's scope, wherever the customer is registered. Customers are masked.</div>
      {(q.data ?? []).map((t) => (
        <div key={t.transferId} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <div className="font-mono font-semibold truncate">{t.reference}</div>
            <div className="text-[10px] text-muted-foreground truncate">{t.customerMaskedName} · home {t.homeCountry ?? "—"} · initiated in {t.originCountry ?? "—"} {t.originOrgName ? `(${t.originOrgName})` : ""}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono">{t.amount.toLocaleString()} {t.currency}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary">{t.state.replace(/_/g, " ")}</span>
            {canCase && <button className={btn} onClick={() => onOpenCase(t)}>Open case</button>}
          </div>
        </div>
      ))}
      {q.data?.length === 0 && <div className="px-4 py-3 text-xs text-muted-foreground">No transactions initiated here.</div>}
    </div>
  );
}

/* ─── Cases ───────────────────────────────────────────────────── */

function AiBox({ caseId, canUse, onUseReply }: { caseId: string; canUse: boolean; onUseReply: (t: string) => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["org", "caseAi", caseId], queryFn: () => org.listCaseAi(caseId), retry: false });
  const [busy, setBusy] = useState(false);
  const s = q.data?.[0];
  const p = s?.payload;
  const analyse = async () => {
    setBusy(true);
    try {
      const r = await org.runCaseTriage(caseId);
      toast.success(r.via === "ai" ? "AI analysis ready" : `${r.fallbackReason ?? "AI unavailable"} — showing the built-in rules triage`);
      void qc.invalidateQueries({ queryKey: ["org", "caseAi", caseId] });
      void qc.invalidateQueries({ queryKey: ["org", "case", caseId] });
    } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  const mark = async (status: "accepted" | "dismissed") => {
    if (!s) return;
    try { await org.markCaseAi(s.id, status); void qc.invalidateQueries({ queryKey: ["org", "caseAi", caseId] }); } catch (e) { toast.error(errText(e)); }
  };
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          {s?.source === "ai" ? <Sparkles size={12} className="text-primary" /> : <Bot size={12} className="text-muted-foreground" />}
          {s ? (s.source === "ai" ? "AI assistant" : "Rules-based triage") : "Case assistant"}
          {s && <span className="text-[10px] font-normal text-muted-foreground">· {new Date(s.createdAt).toLocaleString()} · {s.status}</span>}
        </div>
        <button className={btn} disabled={busy} onClick={() => void analyse()}>{busy ? "Analysing..." : s ? "Re-analyse" : "Analyse"}</button>
      </div>
      {!s && <div className="text-[11px] text-muted-foreground">The assistant sees only masked case data. It suggests priority, routing and a next step; a person always decides.</div>}
      {p && (
        <>
          <div className="flex items-center gap-1.5 flex-wrap">
            {p.priority && <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", PRIORITY_STYLE[p.priority])}>{p.priority}</span>}
            {p.route && <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground">route: {p.route.replace(/_/g, " ")}</span>}
            {p.suggested_action && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">Suggests: {ACTION_LABEL[p.suggested_action]}{p.needs_second_approver ? " (second approver needed)" : ""}</span>}
            {p.risk_flags.map((f) => <span key={f} className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700">{f.replace(/_/g, " ")}</span>)}
          </div>
          <div className="text-xs font-semibold">{p.summary}</div>
          {p.rationale && <div className="text-[11px] text-muted-foreground">{p.rationale}</div>}
          <div className="text-[11px]"><span className="font-semibold">Next step:</span> {p.next_step}</div>
          {p.draft_reply && (
            <div className="text-[11px] rounded-lg bg-card border border-border px-2.5 py-2">
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Draft reply to the customer</div>{p.draft_reply}
            </div>
          )}
          {canUse && s && s.status === "new" && (
            <div className="flex gap-1.5">
              {p.draft_reply && <button className={btn} onClick={() => onUseReply(p.draft_reply ?? "")}>Use reply as a comment</button>}
              <button className={btn} onClick={() => void mark("accepted")}>Mark as used</button>
              <button className={btn} onClick={() => void mark("dismissed")}>Dismiss</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CaseDetail({ id, canUpdate, canApprove, onClose }: { id: string; canUpdate: boolean; canApprove: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["org", "case", id], queryFn: () => org.getCase(id), retry: false });
  const [text, setText] = useState("");
  const [action, setAction] = useState("refund");
  const [busy, setBusy] = useState(false);
  const c = q.data;
  const reasonOk = text.trim().length >= MIN_REASON;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["org"] }); };
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); setText(""); refresh(); } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  if (q.error) return <Empty>{errText(q.error)}</Empty>;
  if (!c) return <Empty>Loading case…</Empty>;
  const pending = c.approvals.find((a) => a.status === "pending");
  const finished = c.status === "resolved" || c.status === "closed";
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold">{c.subject}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{c.reference} · {c.kind} · owned by {c.orgName} · raised by {c.raisedOrgName}</div>
          <div className={cn("text-[10px]", c.slaBreached ? "text-destructive font-semibold" : "text-muted-foreground")}>SLA due {new Date(c.slaDueAt).toLocaleString()}{c.slaBreached ? " — breached" : ""}{c.escalationLevel > 0 ? ` · escalated ${c.escalationLevel}×` : ""}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", PRIORITY_STYLE[c.priority])}>{c.priority}</span>
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_STYLE[c.status])}>{c.status.replace(/_/g, " ")}</span>
          <button className={btn} onClick={onClose}>Close</button>
        </div>
      </div>
      {c.description && <p className="text-xs">{c.description}</p>}
      <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
        {c.customer && <div className="rounded-lg bg-secondary/40 px-3 py-2">Customer {c.customer.masked_name} · home {c.customer.home_country ?? "—"} · KYC {c.customer.kyc_status}</div>}
        {c.transaction && <div className="rounded-lg bg-secondary/40 px-3 py-2"><span className="font-mono">{c.transaction.reference}</span> · {c.transaction.amount} {c.transaction.currency} · {c.transaction.state.replace(/_/g, " ")} · initiated in {c.transaction.origin_country ?? "—"}</div>}
      </div>

      <AiBox caseId={id} canUse={canUpdate && !finished} onUseReply={(t) => setText(t)} />

      {c.approvals.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase text-muted-foreground">Approvals (four-eyes)</div>
          {c.approvals.map((a) => (
            <div key={a.id} className="rounded-lg border border-border px-3 py-2 text-[11px] space-y-1">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">{ACTION_LABEL[a.action]}</span><span className="text-[10px] text-muted-foreground">{a.status}</span></div>
              <div className="text-muted-foreground">Requested: {a.request_reason}</div>
              {a.decision_reason && <div className="text-muted-foreground">Decision: {a.decision_reason}</div>}
              {a.status === "pending" && canApprove && (
                a.requested_by_me
                  ? <div className="text-[10px] text-amber-700">You requested this — a different person must approve it.</div>
                  : <div className="flex gap-1.5">
                      <button className={btnPrimary} disabled={busy || !reasonOk} onClick={() => void run(() => org.decideCaseAction(a.id, true, text.trim()), "Approved and executed")}>Approve</button>
                      <button className={cn(btn, "text-destructive")} disabled={busy || !reasonOk} onClick={() => void run(() => org.decideCaseAction(a.id, false, text.trim()), "Request rejected")}>Reject</button>
                    </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase text-muted-foreground">Timeline</div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {c.events.map((e, i) => (
            <div key={i} className="text-[11px] flex gap-2"><span className="text-muted-foreground shrink-0">{new Date(e.at).toLocaleString()}</span><span><span className="font-semibold">{e.event.replace(/_/g, " ")}</span>{e.body ? ` — ${e.body}` : ""}</span></div>
          ))}
        </div>
      </div>

      {!finished && (
        <div className="space-y-2 border-t border-border pt-3">
          <textarea className={field} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Comment or written reason (required for every decision, escalation and closure)" />
          <div className="flex gap-1.5 flex-wrap items-center">
            <button className={btn} disabled={busy || !reasonOk} onClick={() => void run(() => org.commentCase(id, text.trim()), "Comment added")}>Add comment</button>
            {canUpdate && <button className={btn} disabled={busy || !reasonOk} onClick={() => void run(() => org.escalateCase(id, text.trim()), "Escalated to the parent organisation")}>Escalate</button>}
            {canUpdate && !pending && <button className={btn} disabled={busy || !reasonOk} onClick={() => void run(() => org.closeCase(id, "resolved", text.trim()), "Case resolved")}>Resolve</button>}
            {canUpdate && !pending && <button className={btn} disabled={busy || !reasonOk} onClick={() => void run(() => org.closeCase(id, "closed", text.trim()), "Case closed")}>Close without action</button>}
            {c.transaction && !pending && canApprove && (
              <>
                <select className="rounded-lg border border-border bg-card px-2 py-1 text-[11px]" value={action} onChange={(e) => setAction(e.target.value)}>
                  {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button className={btnPrimary} disabled={busy || !reasonOk} onClick={() => void run(() => org.requestCaseAction(id, action, text.trim()), "Sent to a second approver")}>Request approval</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CasesTab({ o, caps, seed, clearSeed }: { o: org.Org; caps: Record<string, org.OrgCapability>; seed: org.OrgTransfer | null; clearSeed: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["org", "cases", o.id, status], queryFn: () => org.listCases(o.id, status || undefined), retry: false, refetchInterval: 60_000 });
  const [form, setForm] = useState({ kind: "complaint", subject: "", description: "", priority: "normal" });
  const [busy, setBusy] = useState(false);
  const kind = seed ? "transaction" : form.kind;
  const create = async () => {
    setBusy(true);
    try {
      await org.createCase({ orgId: o.id, kind, subject: form.subject.trim(), description: form.description.trim() || undefined, priority: form.priority, transferId: seed?.transferId });
      toast.success("Case opened and routed"); setForm({ ...form, subject: "", description: "" }); clearSeed(); void qc.invalidateQueries({ queryKey: ["org", "cases"] });
    } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  if (q.error) return <Empty>{errText(q.error)}</Empty>;
  return (
    <div className="space-y-3">
      {caps.cases?.canCreate && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="text-xs font-bold">Open a case{seed ? ` for ${seed.reference}` : ""}</div>
          <div className="grid sm:grid-cols-[auto_1fr_auto] gap-2">
            <select className={field} value={kind} disabled={!!seed} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {["complaint", "account", "other"].map((k) => <option key={k} value={k}>{k}</option>)}{seed && <option value="transaction">transaction</option>}
            </select>
            <input className={field} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <select className={field} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["low", "normal", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}</select>
          </div>
          <textarea className={field} rows={2} placeholder="What happened?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex items-center gap-2">
            <button className={btnPrimary} disabled={busy || form.subject.trim().length < 3} onClick={() => void create()}>Open case</button>
            {seed && <button className={btn} onClick={clearSeed}>Cancel</button>}
            <span className="text-[10px] text-muted-foreground">Transaction cases go to the entity where the payment was initiated; KYC cases to the customer's home country.</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-muted-foreground">Status</span>
        <select className="rounded-lg border border-border bg-card px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>{org.CASE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      {sel && <CaseDetail id={sel} canUpdate={!!caps.cases?.canUpdate} canApprove={!!caps.transactions?.canUpdate} onClose={() => setSel(null)} />}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {(q.data ?? []).map((c) => (
          <button key={c.id} onClick={() => setSel(c.id)} className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-secondary/30 cursor-pointer">
            <div className="min-w-0">
              <div className="font-semibold truncate">{c.subject}</div>
              <div className="text-[10px] text-muted-foreground truncate"><span className="font-mono">{c.reference}</span> · {c.kind} · {c.orgName}{c.customerMaskedName ? ` · ${c.customerMaskedName}` : ""}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {c.slaBreached && <span className="text-[10px] font-semibold text-destructive">SLA breached</span>}
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", PRIORITY_STYLE[c.priority])}>{c.priority}</span>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_STYLE[c.status])}>{c.status.replace(/_/g, " ")}</span>
            </div>
          </button>
        ))}
        {q.data?.length === 0 && <div className="px-4 py-3 text-xs text-muted-foreground">No cases.</div>}
      </div>
    </div>
  );
}

/* ─── Sensitive-data access log (home country) ────────────────── */

function AccessLogTab() {
  const q = useQuery({ queryKey: ["org", "breakGlass"], queryFn: org.breakGlassLog, retry: false });
  if (q.error) return <Empty>{errText(q.error)}</Empty>;
  return (
    <div className="bg-card border border-border rounded-2xl divide-y divide-border">
      <div className="px-4 py-2 text-[10px] text-muted-foreground">Every time staff opened the sensitive record of a customer registered in your country (break-glass), with the reason they gave.</div>
      {(q.data ?? []).map((g) => (
        <div key={g.id} className="px-4 py-2.5 text-xs space-y-0.5">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold">{g.requesterName} → {g.targetMaskedName} ({g.homeCountry})</span><span className={cn("text-[10px]", g.active ? "text-amber-700 font-semibold" : "text-muted-foreground")}>{g.active ? "window open" : "closed"}</span></div>
          <div className="text-[11px] text-muted-foreground">{new Date(g.createdAt).toLocaleString()} — {g.reason}</div>
        </div>
      ))}
      {q.data?.length === 0 && <div className="px-4 py-3 text-xs text-muted-foreground">No sensitive-data access recorded.</div>}
    </div>
  );
}

/* ─── Group-level governance: templates and operating levels ──── */

function GovernanceTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["org", "templates"], queryFn: org.orgTemplates });
  const [busy, setBusy] = useState(false);
  if (!q.data) return <Empty>Loading…</Empty>;
  const { templates, perms, levels } = q.data;
  const cell = (slug: string, resource: string) => perms.find((p) => p.templateSlug === slug && p.resource === resource);
  const toggle = async (slug: string, resource: string, key: "create" | "read" | "update") => {
    const cur = cell(slug, resource);
    const next = { create: !!cur?.canCreate, read: !!cur?.canRead, update: !!cur?.canUpdate };
    next[key] = !next[key];
    setBusy(true);
    try { await org.setTemplatePermission({ slug, resource, ...next }); void qc.invalidateQueries({ queryKey: ["org", "templates"] }); } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 overflow-x-auto">
        <div className="text-xs font-bold">Role templates (Group-defined)</div>
        <div className="text-[10px] text-muted-foreground">Customers, branches and agents can only assign these templates within their own scope, and only permissions they hold themselves. Delete can never be delegated.</div>
        <table className="w-full text-[11px]">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-3">Template</th>{RESOURCES.map((r) => <th key={r} className="px-1 font-semibold">{r}</th>)}</tr></thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.slug} className="border-t border-border">
                <td className="py-1.5 pr-3 font-semibold whitespace-nowrap">{t.label}</td>
                {RESOURCES.map((r) => (
                  <td key={r} className="px-1"><div className="flex gap-0.5">
                    {(["create", "read", "update"] as const).map((k) => {
                      const c = cell(t.slug, r);
                      const on = k === "create" ? c?.canCreate : k === "read" ? c?.canRead : c?.canUpdate;
                      return <button key={k} disabled={busy} title={`${k} ${r}`} onClick={() => void toggle(t.slug, r, k)} className={cn("w-4 h-4 rounded text-[8px] font-bold cursor-pointer", on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{k[0].toUpperCase()}</button>;
                    })}
                  </div></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <div className="text-xs font-bold">Operating levels</div>
        {levels.map((l) => (
          <div key={l.slug} className="flex items-center justify-between gap-2 text-xs border-t border-border pt-2 first:border-0 first:pt-0">
            <div><div className="font-semibold">{l.label}</div><div className="text-[10px] text-muted-foreground">{l.description}</div></div>
            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
              depth
              <input type="number" min={0} max={8} defaultValue={l.maxDepth} className="w-12 rounded-lg border border-border bg-card px-1.5 py-1" onBlur={(e) => {
                const v = Number(e.target.value);
                if (v !== l.maxDepth) void org.setLevelRules({ level: l.slug, maxDepth: v, canCreateSuborgs: v > 0, canManageProfiles: l.canManageProfiles }).then(() => { toast.success("Level updated"); void qc.invalidateQueries({ queryKey: ["org", "templates"] }); }).catch((er) => toast.error(errText(er)));
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shell ───────────────────────────────────────────────────── */

type Tab = "members" | "customers" | "transactions" | "cases" | "access" | "governance";

export default function OrganisationPanel() {
  const perms = useMyPermissions();
  const isSuper = !!perms?.isSuperadmin;
  const orgsQ = useQuery({ queryKey: ["org", "list"], queryFn: org.listOrgs, retry: false });
  const [orgId, setOrgId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("cases");
  const [seed, setSeed] = useState<org.OrgTransfer | null>(null);
  const orgs = orgsQ.data ?? [];
  const current = orgs.find((x) => x.id === orgId) ?? orgs.find((x) => x.depth === Math.min(...orgs.map((y) => y.depth))) ?? orgs[0];
  const capsQ = useQuery({ queryKey: ["org", "caps", current?.id], queryFn: () => org.orgCapabilities(current!.id), enabled: !!current, retry: false });
  const caps = Object.fromEntries((capsQ.data ?? []).map((c) => [c.resource, c])) as Record<string, org.OrgCapability>;

  if (orgsQ.error) return <Empty>{errText(orgsQ.error)}</Empty>;
  if (orgsQ.isLoading) return <Empty>Loading organisations…</Empty>;
  if (!current) return <Empty>You are not a member of any organisation yet. A Group superadmin or your organisation's administrator can add you from a role template.</Empty>;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "cases", label: "Cases", show: !!caps.cases?.canRead },
    { id: "transactions", label: "Transactions", show: !!caps.transactions?.canRead },
    { id: "customers", label: "Customers", show: !!caps.users?.canRead },
    { id: "members", label: "Profiles & units", show: !!caps.profiles?.canRead || !!caps.orgs?.canRead },
    { id: "access", label: "Sensitive-data access", show: !!caps.kyc_sensitive?.canRead || isSuper },
    { id: "governance", label: "Templates & levels", show: isSuper },
  ];
  const visible = tabs.filter((t) => t.show);
  const active = visible.find((t) => t.id === tab) ?? visible[0];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Organisation
          <select className="mt-1 block rounded-lg border border-border bg-card px-2 py-1.5 text-xs normal-case font-semibold min-w-56" value={current.id} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((x) => <option key={x.id} value={x.id}>{"— ".repeat(Math.max(0, x.depth - orgs[0].depth))}{x.name}{x.status === "suspended" ? " (suspended)" : ""}</option>)}
          </select>
        </label>
        <div className="text-[11px] text-muted-foreground">
          {KIND_LABEL[current.kind]}{current.country ? ` · ${current.country}` : ""} · operating level <span className="font-semibold text-foreground">{current.operatingLevel}</span>
        </div>
      </div>
      <div className="flex gap-1 p-1 bg-secondary rounded-xl overflow-x-auto">
        {visible.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex-1 whitespace-nowrap py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer", active?.id === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{t.label}</button>
        ))}
      </div>
      {!active && <Empty>Your role in this organisation does not include any of these views.</Empty>}
      {active?.id === "cases" && <CasesTab o={current} caps={caps} seed={seed} clearSeed={() => setSeed(null)} />}
      {active?.id === "transactions" && <TransactionsTab o={current} canCase={!!caps.cases?.canCreate} onOpenCase={(t) => { setSeed(t); setTab("cases"); }} />}
      {active?.id === "customers" && <CustomersTab o={current} />}
      {active?.id === "members" && <MembersTab org={current} orgs={orgs} caps={caps} isSuper={isSuper} />}
      {active?.id === "access" && <AccessLogTab />}
      {active?.id === "governance" && <GovernanceTab />}
    </div>
  );
}
