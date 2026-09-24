import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { useAdminEscalations, useAdminResolveEscalationMutation, useMyPermissions } from "@/hooks/use-backend.ts";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  approved: "bg-primary/10 text-primary",
  done: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

// Queue of change requests from view-only support staff. Approvers
// (transactions.update) see everyone's; support staff see their own and the
// answer. Approving executes the requested action server-side.
export default function EscalationsPanel() {
  const { data, isLoading, error } = useAdminEscalations();
  const perms = useMyPermissions();
  const resolve = useAdminResolveEscalationMutation();
  const canResolve = perms?.transactions.update ?? false;

  const act = async (id: string, decision: "approve" | "reject" | "done", action: string) => {
    const note = window.prompt(decision === "reject" ? "Reason for rejecting (shown to the requester):" : "Note (optional):");
    if (note === null) return;
    let password: string | undefined;
    if (decision === "approve" && action === "void") {
      const p = window.prompt("Voiding is superadmin-only. Enter the admin password:");
      if (p === null) return;
      password = p;
    }
    try {
      await resolve({ escalationId: id, decision, note: note || undefined, password });
      toast.success(decision === "reject" ? "Escalation rejected" : "Escalation updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^[A-Za-z_]+: /, "") : "Action failed");
    }
  };

  return (
    <div className="space-y-3">
      {isLoading && <div className="text-xs text-muted-foreground text-center py-8">Loading escalations...</div>}
      {error && <div className="text-xs text-destructive text-center py-8">Could not load escalations (transactions.read is required).</div>}
      {data && data.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">No escalations yet.</div>}
      {data?.map((e) => (
        <div key={e.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold capitalize">{e.action.replace("_", " ")}{e.amount != null && ` · ${e.amount.toLocaleString()} ${e.currency ?? ""}`}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                For {e.targetName ?? e.targetEmail ?? e.targetUserId}{e.transferReference && <> · <span className="font-mono">{e.transferReference}</span></>}
              </div>
              <div className="text-[10px] text-muted-foreground/70">Requested by {e.requesterName ?? "—"} · {new Date(e.createdAt).toLocaleString()}</div>
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[e.status])}>{e.status}</span>
          </div>
          <p className="text-xs">{e.details}</p>
          {e.resolutionNote && <p className="text-[11px] text-muted-foreground">Response: {e.resolutionNote}</p>}
          {canResolve && (e.status === "open" || e.status === "approved") && (
            <div className="flex gap-1.5 flex-wrap">
              {e.status === "open" && (
                <>
                  <button onClick={() => void act(e.id, "approve", e.action)} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground cursor-pointer">Approve &amp; execute</button>
                  <button onClick={() => void act(e.id, "reject", e.action)} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-border text-destructive cursor-pointer">Reject</button>
                </>
              )}
              {e.status === "approved" && (
                <button onClick={() => void act(e.id, "done", e.action)} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-border cursor-pointer">Mark done</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
