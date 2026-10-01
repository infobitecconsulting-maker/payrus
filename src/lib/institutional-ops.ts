// 0057: bank reconciliation, receivable ageing and follow-ups, budgets, approval chains.
// Benchmarked on Odoo Accounting (reconciliation, follow-ups, budgets) and Revolut Business
// (approval flows with per-person limits). The database enforces every rule; this is the client.
import { supabase } from "./supabase-client.ts";
import { toRecord, type InstRecord } from "./institutional.ts";

type Row = Record<string, unknown>;
const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const clean = (m: string) => m.replace(/^[a-z_]+: /, "");

function rows(res: { data: unknown; error: { message: string } | null }, label: string): Row[] {
  if (res.error) throw new Error(clean(res.error.message));
  if (res.data === null || res.data === undefined) throw new Error(`${label}: no data`);
  return (Array.isArray(res.data) ? res.data : [res.data]) as Row[];
}
function done(res: { error: { message: string } | null }) {
  if (res.error) throw new Error(clean(res.error.message));
}

export interface BankLine { id: string; lineDate: string; amount: number; currency: string; description: string; reference: string; status: "unmatched" | "matched" | "ignored"; matchedRecordId: string | null }
export interface MatchSuggestion { lineId: string; recordId: string; recordRef: string; recordTitle: string; score: number; reason: string }
export interface AgeingBucket { bucket: string; sortOrder: number; invoices: number; total: number; currency: string }
export interface Followup { recordId: string; ref: string; title: string; counterparty: string | null; amount: number; currency: string; dueDate: string; daysOverdue: number; level: number; levelLabel: string; followups: number; lastFollowup: string | null }
export interface BudgetStatus { budgetId: string; name: string; moduleKey: string | null; kind: string | null; periodStart: string; periodEnd: string; amount: number; currency: string; alertPct: number; spent: number; pct: number; status: "ok" | "warning" | "over" }
export interface ApprovalPolicy { id: string; kind: string | null; kindLabel: string | null; minAmount: number; requiredApprovers: number }
export interface ApproverLimit { approverUserId: string; approverName: string; maxAmount: number }

export async function importStatement(a: { userId: string; lines: { date: string; amount: number; description: string; reference: string }[]; currency: string }): Promise<{ imported: number; skipped: number }> {
  const r = rows(await supabase.rpc("inst_import_statement", { p_user_id: a.userId, p_lines: a.lines, p_currency: a.currency }), "import")[0] ?? {};
  return { imported: n(r.imported), skipped: n(r.skipped) };
}
export async function listBankLines(userId: string): Promise<BankLine[]> {
  return rows(await supabase.rpc("inst_list_bank_lines", { p_user_id: userId, p_status: null }), "lines").map((r) => ({
    id: r.id as string, lineDate: r.line_date as string, amount: n(r.amount), currency: r.currency as string, description: (r.description as string) ?? "",
    reference: (r.reference as string) ?? "", status: r.status as BankLine["status"], matchedRecordId: (r.matched_record_id as string) ?? null,
  }));
}
export async function suggestMatches(userId: string): Promise<MatchSuggestion[]> {
  return rows(await supabase.rpc("inst_suggest_matches", { p_user_id: userId }), "suggestions").map((r) => ({
    lineId: r.line_id as string, recordId: r.record_id as string, recordRef: r.record_ref as string, recordTitle: r.record_title as string, score: n(r.score), reason: r.reason as string,
  }));
}
export async function reconcileLine(a: { actorId: string; lineId: string; recordId: string }): Promise<InstRecord> {
  return toRecord(rows(await supabase.rpc("inst_reconcile", { p_actor: a.actorId, p_line_id: a.lineId, p_record_id: a.recordId }), "reconcile")[0]);
}
export async function ignoreLine(a: { userId: string; lineId: string; ignore: boolean }): Promise<void> {
  done(await supabase.rpc("inst_ignore_line", { p_user_id: a.userId, p_line_id: a.lineId, p_ignore: a.ignore }));
}
export async function ageing(userId: string): Promise<AgeingBucket[]> {
  return rows(await supabase.rpc("inst_ageing", { p_user_id: userId }), "ageing").map((r) => ({ bucket: r.bucket as string, sortOrder: n(r.sort_order), invoices: n(r.invoices), total: n(r.total), currency: r.currency as string }));
}
export async function overdueFollowups(userId: string): Promise<Followup[]> {
  return rows(await supabase.rpc("inst_overdue_followups", { p_user_id: userId }), "followups").map((r) => ({
    recordId: r.record_id as string, ref: r.ref as string, title: r.title as string, counterparty: (r.counterparty as string) ?? null, amount: n(r.amount), currency: r.currency as string,
    dueDate: r.due_date as string, daysOverdue: n(r.days_overdue), level: n(r.level), levelLabel: r.level_label as string, followups: n(r.followups), lastFollowup: (r.last_followup as string) ?? null,
  }));
}
export async function sendFollowup(a: { actorId: string; recordId: string; note?: string }): Promise<InstRecord> {
  return toRecord(rows(await supabase.rpc("inst_send_followup", { p_actor: a.actorId, p_record_id: a.recordId, p_note: a.note ?? null }), "followup")[0]);
}
export async function budgetStatus(userId: string): Promise<BudgetStatus[]> {
  return rows(await supabase.rpc("inst_budget_status", { p_user_id: userId }), "budgets").map((r) => ({
    budgetId: r.budget_id as string, name: r.name as string, moduleKey: (r.module_key as string) ?? null, kind: (r.kind as string) ?? null, periodStart: r.period_start as string,
    periodEnd: r.period_end as string, amount: n(r.amount), currency: r.currency as string, alertPct: n(r.alert_pct), spent: n(r.spent), pct: n(r.pct), status: r.status as BudgetStatus["status"],
  }));
}
export async function setBudget(a: { userId: string; name: string; module?: string; kind?: string; start: string; end: string; amount: number; currency: string; alertPct: number }): Promise<void> {
  done(await supabase.rpc("inst_set_budget", { p_user_id: a.userId, p_name: a.name, p_module: a.module ?? null, p_kind: a.kind ?? null, p_start: a.start, p_end: a.end, p_amount: a.amount, p_currency: a.currency, p_alert_pct: a.alertPct }));
}
export async function deleteBudget(a: { userId: string; id: string }): Promise<void> {
  done(await supabase.rpc("inst_delete_budget", { p_user_id: a.userId, p_id: a.id }));
}
export async function listPolicies(userId: string): Promise<ApprovalPolicy[]> {
  return rows(await supabase.rpc("inst_list_policies", { p_user_id: userId }), "policies").map((r) => ({ id: r.id as string, kind: (r.kind as string) ?? null, kindLabel: (r.kind_label as string) ?? null, minAmount: n(r.min_amount), requiredApprovers: n(r.required_approvers) }));
}
export async function setPolicy(a: { userId: string; kind?: string; minAmount: number; required: number }): Promise<void> {
  done(await supabase.rpc("inst_set_policy", { p_user_id: a.userId, p_kind: a.kind ?? null, p_min_amount: a.minAmount, p_required: a.required }));
}
export async function deletePolicy(a: { userId: string; id: string }): Promise<void> {
  done(await supabase.rpc("inst_delete_policy", { p_user_id: a.userId, p_id: a.id }));
}
export async function listApproverLimits(userId: string): Promise<ApproverLimit[]> {
  return rows(await supabase.rpc("inst_list_approver_limits", { p_user_id: userId }), "limits").map((r) => ({ approverUserId: r.approver_user_id as string, approverName: r.approver_name as string, maxAmount: n(r.max_amount) }));
}
export async function setApproverLimit(a: { userId: string; approverId: string; max: number | null }): Promise<void> {
  done(await supabase.rpc("inst_set_approver_limit", { p_user_id: a.userId, p_approver: a.approverId, p_max: a.max }));
}
export async function approvalProgress(a: { actorId: string; recordId: string }): Promise<{ required: number; approved: number }> {
  const r = rows(await supabase.rpc("inst_approval_progress", { p_actor: a.actorId, p_record_id: a.recordId }), "progress")[0] ?? {};
  return { required: n(r.required), approved: n(r.approved) };
}

/** Minimal CSV reader for bank statements: date, amount, description, reference (header row optional, quotes supported). */
export function parseStatementCsv(text: string): { date: string; amount: number; description: string; reference: string }[] {
  const out: { date: string; amount: number; description: string; reference: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cells: string[] = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if ((ch === "," || ch === ";" || ch === "\t") && !q) { cells.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cells.push(cur.trim());
    const date = cells[0] ?? "";
    const amount = Number((cells[1] ?? "").replace(/\s/g, "").replace(/,/g, "."));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount === 0) continue; // skips headers and bad rows
    out.push({ date, amount, description: cells[2] ?? "", reference: cells[3] ?? "" });
  }
  return out;
}
