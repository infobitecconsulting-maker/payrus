import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { AdminEscalation, AiSuggestion } from "@/lib/backend.ts";
import {
  useAdminEscalations, useAdminResolveEscalationMutation, useMyPermissions,
  useAiSuggestions, useRunTriageMutation, useMarkAiSuggestionMutation,
} from "@/hooks/use-backend.ts";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  approved: "bg-primary/10 text-primary",
  done: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};
const PRIORITY_STYLE: Record<string, string> = {
  urgent: "bg-destructive text-white",
  high: "bg-destructive/15 text-destructive",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-secondary text-muted-foreground",
};
const PRIORITY_RANK: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
const ACTION_LABEL: Record<string, string> = { approve: "Approve", reject: "Reject", request_info: "Ask for more information" };

const MIN_REASON = 5;

function SuggestionBox({ s, canAnalyze, busy, onAnalyze, onUseReply }: {
  s: AiSuggestion | undefined; canAnalyze: boolean; busy: boolean; onAnalyze: () => void; onUseReply?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          {s?.source === "ai" ? <Sparkles size={12} className="text-primary" /> : <Bot size={12} className="text-muted-foreground" />}
          {s ? (s.source === "ai" ? "AI assistant" : "Rules-based triage") : "Triage assistant"}
          {s && <span className="text-[10px] font-normal text-muted-foreground">· {s.createdByName ?? "someone"} · {new Date(s.createdAt).toLocaleString()}</span>}
        </div>
        {canAnalyze && (
          <button onClick={onAnalyze} disabled={busy} className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-border hover:bg-secondary cursor-pointer disabled:opacity-60">
            {busy ? "Analysing..." : s ? "Re-analyse" : "Analyse with AI"}
          </button>
        )}
      </div>
      {!s && <div className="text-[11px] text-muted-foreground">No analysis yet. The assistant reads the transaction, the user's history and risk flags, then suggests a priority, an action and a reply. It never acts by itself.</div>}
      {s && (
        <>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", PRIORITY_STYLE[s.priority])}>{s.priority}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground">{s.category.replace(/_/g, " ")}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
              Suggests: {ACTION_LABEL[s.recommendedAction]} · {Math.round(s.confidence * 100)}%
            </span>
          </div>
          <div className="text-xs font-semibold">{s.summary}</div>
          <div className="text-[11px] text-muted-foreground">{s.rationale}</div>
          <div className="text-[11px] rounded-lg bg-card border border-border px-2.5 py-2">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Draft reply to the customer</div>
            {s.draftReply}
          </div>
          {onUseReply && (
            <button onClick={onUseReply} className="text-[10px] font-semibold text-primary cursor-pointer">Use this reply as my reason</button>
          )}
        </>
      )}
    </div>
  );
}

function Card({ e, suggestion, canResolve, canAnalyze }: { e: AdminEscalation; suggestion: AiSuggestion | undefined; canResolve: boolean; canAnalyze: boolean }) {
  const resolve = useAdminResolveEscalationMutation();
  const triage = useRunTriageMutation();
  const mark = useMarkAiSuggestionMutation();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const reasonOk = reason.trim().length >= MIN_REASON;

  const analyse = async () => {
    setAnalysing(true);
    try {
      const r = await triage(e.id);
      toast.success(r.via === "ai" ? "AI analysis ready" : `${r.fallbackReason ?? "AI unavailable"} — showing the built-in rules triage`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^[A-Za-z_]+: /, "") : "Could not analyse");
    } finally {
      setAnalysing(false);
    }
  };

  const decide = async (decision: "approve" | "reject" | "done") => {
    let password: string | undefined;
    if (decision === "approve" && e.action === "void") {
      const p = window.prompt("Voiding is superadmin-only. Enter the admin password:");
      if (p === null) return;
      password = p;
    }
    setBusy(true);
    try {
      await resolve({ escalationId: e.id, decision, note: reason.trim() || undefined, password });
      if (suggestion && suggestion.status === "suggested" && decision !== "done") {
        void mark({ id: suggestion.id, status: suggestion.recommendedAction === decision ? "used" : "dismissed" }).catch(() => undefined);
      }
      toast.success(decision === "reject" ? "Escalation rejected — the reason was sent to the requester" : "Escalation updated");
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^[A-Za-z_]+: /, "") : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const open = e.status === "open";
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold capitalize">{e.action.replace("_", " ")}{e.amount != null && ` · ${e.amount.toLocaleString()} ${e.currency ?? ""}`}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            For {e.targetName ?? e.targetEmail ?? e.targetUserId}{e.transferReference && <> · <span className="font-mono">{e.transferReference}</span></>}
          </div>
          <div className="text-[10px] text-muted-foreground/70">Requested by {e.requesterName ?? "—"} · {new Date(e.createdAt).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {suggestion && <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", PRIORITY_STYLE[suggestion.priority])}>{suggestion.priority}</span>}
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_STYLE[e.status])}>{e.status}</span>
        </div>
      </div>
      <p className="text-xs">{e.details}</p>

      {e.resolutionNote && (
        <div className={cn("rounded-lg px-3 py-2 text-[11px]", e.status === "rejected" ? "bg-destructive/10" : "bg-primary/10")}>
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">
            {e.status === "rejected" ? "Reason for rejection" : "Reason for the decision"}
          </div>
          {e.resolutionNote}
        </div>
      )}

      {(open || e.status === "approved") && (
        <SuggestionBox
          s={suggestion}
          canAnalyze={canAnalyze}
          busy={analysing}
          onAnalyze={() => void analyse()}
          onUseReply={canResolve && open && suggestion ? () => setReason(suggestion.draftReply) : undefined}
        />
      )}

      {canResolve && (open || e.status === "approved") && (
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold uppercase text-muted-foreground">
            {open ? "Your reason (required to approve or reject — the requester sees it)" : "Completion note (optional)"}
            <textarea
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
              rows={2}
              placeholder={open ? "Why are you approving or rejecting this request?" : "What was done?"}
              className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs normal-case font-normal"
            />
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {open && (
              <>
                <button onClick={() => void decide("approve")} disabled={busy || !reasonOk} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer disabled:opacity-50">Approve &amp; execute</button>
                <button onClick={() => void decide("reject")} disabled={busy || !reasonOk} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-border text-destructive cursor-pointer disabled:opacity-50">Reject</button>
              </>
            )}
            {e.status === "approved" && (
              <button onClick={() => void decide("done")} disabled={busy} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-border cursor-pointer disabled:opacity-50">Mark done</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Issue queue for escalated support cases: newest analysis drives the priority
// order; approvers decide with a mandatory written reason; the AI assistant
// (with a rules-based fallback) only ever suggests.
export default function EscalationsPanel() {
  const { data, isLoading, error } = useAdminEscalations();
  const suggestions = useAiSuggestions().data;
  const perms = useMyPermissions();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const canResolve = perms?.transactions.update ?? false;
  const canAnalyze = perms?.transactions.read ?? false;

  const bySuggestion = new Map((suggestions ?? []).map((s) => [s.escalationId, s]));
  const rows = (data ?? [])
    .filter((e) => filter === "all" || e.status === "open" || e.status === "approved")
    .sort((a, b) => {
      const open = Number(b.status === "open") - Number(a.status === "open");
      if (open) return open;
      const pr = (PRIORITY_RANK[bySuggestion.get(b.id)?.priority ?? ""] ?? 0) - (PRIORITY_RANK[bySuggestion.get(a.id)?.priority ?? ""] ?? 0);
      return pr || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="esc-filter" className="text-[10px] font-semibold uppercase text-muted-foreground">Show</label>
        <select id="esc-filter" value={filter} onChange={(ev) => setFilter(ev.target.value as "open" | "all")} className="rounded-xl border border-border bg-card px-2 py-2 text-xs">
          <option value="open">Needs a decision</option>
          <option value="all">All escalations</option>
        </select>
        <span className="text-[10px] text-muted-foreground">Highest priority first.</span>
      </div>
      {isLoading && <div className="text-xs text-muted-foreground text-center py-8">Loading escalations...</div>}
      {error && <div className="text-xs text-destructive text-center py-8">Could not load escalations (transactions.read is required).</div>}
      {data && rows.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">Nothing here.</div>}
      {rows.map((e) => (
        <Card key={e.id} e={e} suggestion={bySuggestion.get(e.id)} canResolve={canResolve} canAnalyze={canAnalyze} />
      ))}
    </div>
  );
}
