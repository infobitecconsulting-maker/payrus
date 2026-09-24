import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { AdminTransfer } from "@/lib/backend.ts";
import EscalateForm from "./escalate-form.tsx";
import {
  useAdminListTransfers, useAdminListUsers, useMyPermissions, useSupportCompleteTransferMutation, useSupportResolveTransferMutation,
  useSupportVoidTransferMutation, useSupportCreateAdjustmentMutation,
} from "@/hooks/use-backend.ts";

const STATE_STYLE: Record<string, string> = {
  paid: "bg-primary/10 text-primary",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-destructive/10 text-destructive",
  disputed: "bg-destructive/10 text-destructive",
  refund_pending: "bg-amber-100 text-amber-700",
};

const COMPLETABLE = ["pending", "failed", "submitted", "confirming", "partner_accepted"];
const REFUNDABLE = ["disputed", "refund_pending", "reversed"];
const VOIDABLE = ["draft", "quoted"];

// Real ledger across every user (admin_list_transfers). Which action buttons
// show — and which the database accepts — follows the caller's CRUD matrix
// (my_permissions): read = list, update = complete/resolve/refund,
// delete = void an unexecuted transaction, create = adjustment credit.
export default function TransactionsPanel() {
  const [callerId, setCallerId] = useState<string>("");
  const users = useAdminListUsers();
  const { data, isLoading, error } = useAdminListTransfers(300, callerId || undefined);
  const perms = useMyPermissions();
  const [escalateFor, setEscalateFor] = useState<AdminTransfer | null>(null);
  const complete = useSupportCompleteTransferMutation();
  const resolve = useSupportResolveTransferMutation();
  const voidTransfer = useSupportVoidTransferMutation();
  const adjust = useSupportCreateAdjustmentMutation();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const canUpdate = perms?.transactions.update ?? false;
  const canDelete = perms?.transactions.delete ?? false;
  const canCreate = perms?.transactions.create ?? false;

  const run = async (t: AdminTransfer, action: () => Promise<void>, ok: string) => {
    setBusyId(t.id);
    try {
      await action();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^[A-Za-z]+: /, "") : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const askNote = (label: string) => window.prompt(label) ?? null;

  const handleComplete = (t: AdminTransfer) => {
    const note = askNote("Note for the user and audit log (optional):");
    if (note === null) return;
    void run(t, () => complete({ transferId: t.id, note: note || undefined }), "Transaction completed");
  };
  const handleResolve = (t: AdminTransfer, newState: "resolved" | "refunded") => {
    const note = askNote(newState === "refunded" ? "Refund reason (credits the user's wallet):" : "Resolution note:");
    if (note === null) return;
    void run(t, () => resolve({ transferId: t.id, newState, note: note || undefined }), newState === "refunded" ? "Refunded" : "Dispute closed");
  };
  const handleVoid = (t: AdminTransfer) => {
    const note = askNote("Reason for voiding this unexecuted transaction (required):");
    if (!note) return;
    const password = window.prompt("Voiding is superadmin-only. Enter the admin password:");
    if (password === null) return;
    void run(t, () => voidTransfer({ transferId: t.id, note, password }), "Transaction voided");
  };
  const handleAdjust = (t: AdminTransfer) => {
    const amountText = window.prompt(`Adjustment credit for ${t.userName ?? t.userEmail ?? "user"} (${t.currency}):`);
    if (!amountText) return;
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    const reason = window.prompt("Reason (required):");
    if (!reason) return;
    void run(t, () => adjust({ userId: t.userId, amount, currency: t.currency, reason }), "Adjustment credited");
  };

  const q = search.trim().toLowerCase();
  const rows = (data ?? []).filter((t) =>
    !q ||
    t.reference.toLowerCase().includes(q) ||
    t.type.toLowerCase().includes(q) ||
    t.state.toLowerCase().includes(q) ||
    t.currency.toLowerCase().includes(q) ||
    (t.userName ?? "").toLowerCase().includes(q) ||
    (t.userEmail ?? "").toLowerCase().includes(q) ||
    (t.note ?? "").toLowerCase().includes(q),
  );

  const btn = "text-[10px] font-semibold px-2 py-1 rounded-lg border border-border hover:bg-secondary cursor-pointer disabled:opacity-50";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold uppercase text-muted-foreground shrink-0" htmlFor="caller-select">Caller</label>
        <select id="caller-select" value={callerId} onChange={(e) => setCallerId(e.target.value)} className="flex-1 rounded-xl border border-border bg-card px-2 py-2 text-xs">
          <option value="">All users</option>
          {(users ?? []).map((row) => (
            <option key={row.user.id} value={row.user.id}>{row.user.name ?? row.user.email ?? row.user.id}{row.user.email ? ` (${row.user.email})` : ""}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reference, user, type, state, currency or note..."
          className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-2 text-xs"
        />
      </div>

      {isLoading && <div className="text-xs text-muted-foreground text-center py-8">Loading transactions...</div>}
      {error && <div className="text-xs text-destructive text-center py-8">Could not load transactions. The transactions.read permission is required.</div>}
      {data && rows.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">No transactions match.</div>}

      {rows.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-2 border-b border-border text-[10px] text-muted-foreground">{rows.length} of {data?.length} shown (latest 300)</div>
          <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
            {rows.map((t) => (
              <div key={t.id} className="px-4 py-3 hover:bg-secondary/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-semibold truncate">{t.reference}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{t.userName ?? "-"} · {t.userEmail ?? "no email"}</div>
                    <div className="text-[10px] text-muted-foreground/70 truncate">{t.type}{t.note ? ` · ${t.note}` : ""} · {new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono">{t.amount.toLocaleString()} {t.currency}</div>
                    <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", STATE_STYLE[t.state] ?? "bg-secondary text-muted-foreground")}>
                      {t.state.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {canUpdate && COMPLETABLE.includes(t.state) && (
                    <button className={btn} disabled={busyId === t.id} onClick={() => handleComplete(t)}>Complete</button>
                  )}
                  {canUpdate && t.state === "disputed" && (
                    <button className={btn} disabled={busyId === t.id} onClick={() => handleResolve(t, "resolved")}>Close dispute</button>
                  )}
                  {canUpdate && REFUNDABLE.includes(t.state) && (
                    <button className={btn} disabled={busyId === t.id} onClick={() => handleResolve(t, "refunded")}>Refund</button>
                  )}
                  {canDelete && VOIDABLE.includes(t.state) && (
                    <button className={cn(btn, "text-destructive")} disabled={busyId === t.id} onClick={() => handleVoid(t)}>Void</button>
                  )}
                  {canCreate && (
                    <button className={btn} disabled={busyId === t.id} onClick={() => handleAdjust(t)}>Credit user</button>
                  )}
                  <button className={btn} onClick={() => setEscalateFor(escalateFor?.id === t.id ? null : t)}>Escalate</button>
                </div>
                {escalateFor?.id === t.id && (
                  <EscalateForm
                    userId={t.userId}
                    userLabel={t.userName ?? t.userEmail ?? t.userId}
                    transferId={t.id}
                    transferReference={t.reference}
                    currency={t.currency}
                    onDone={() => setEscalateFor(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
