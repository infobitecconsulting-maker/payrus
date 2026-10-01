// Sub-profiles + institutional modules — supabase/migrations/0053 + 0054.
// Schema-driven: record kinds (fields, statuses, transitions, approval rules)
// are rows in inst_record_kinds, so the UI renders any module generically and
// the database enforces every money rule (see the migrations' header).
import { supabase } from "./supabase-client.ts";

export interface SubProfile {
  slug: string;
  parentRole: string;
  category: "personal_business" | "financial_institution" | "public_sector" | "system";
  label: string;
  description: string;
  badge: string;
  features: string[];
  enhancedKyc: boolean;
  relationshipMgr: boolean;
  sortOrder: number;
}

export interface InstModule {
  moduleKey: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface KindField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: string[];
}

export interface RecordKind {
  slug: string;
  moduleKey: string;
  label: string;
  pluralLabel: string;
  sortOrder: number;
  parentKind: string | null;
  calc: string | null;
  statuses: string[];
  initialStatus: string;
  transitions: Record<string, string[]>;
  settle: "none" | "in" | "out";
  settleStatus: string | null;
  approvalStatus: string | null;
  approvalThreshold: number | null;
  fields: KindField[];
}

export interface InstRecord {
  id: string;
  ownerUserId: string;
  kind: string;
  ref: string;
  title: string;
  counterparty: string | null;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  parentId: string | null;
  data: Record<string, unknown>;
  createdBy: string;
  approvedBy: string | null;
  settledAt: string | null;
  createdAt: string;
}

export interface PendingApproval {
  id: string;
  ref: string;
  kind: string;
  kindLabel: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  toStatus: string;
  ownerName: string;
  createdByName: string;
  createdAt: string;
}

export interface AmortizationRow { period: number; payment: number; interest: number; principal: number; balance: number }
export interface JournalLine { entryDate: string; ref: string; kind: string; accountCode: string; accountName: string; debit: number; credit: number; currency: string; memo: string }

type Row = Record<string, unknown>;
const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function check<T>(res: { data: T | null; error: { message: string } | null }, label: string): T {
  if (res.error) throw new Error(res.error.message.replace(/^[a-z_]+: /, ""));
  if (res.data === null) throw new Error(`${label}: no data`);
  return res.data;
}

const toSubProfile = (r: Row): SubProfile => ({
  slug: r.slug as string, parentRole: r.parent_role as string, category: r.category as SubProfile["category"],
  label: r.label as string, description: r.description as string, badge: r.badge as string,
  features: (r.features as string[]) ?? [], enhancedKyc: !!r.enhanced_kyc, relationshipMgr: !!r.relationship_mgr, sortOrder: n(r.sort_order),
});

const toKind = (r: Row): RecordKind => ({
  slug: r.slug as string, moduleKey: r.module_key as string, label: r.label as string, pluralLabel: r.plural_label as string,
  sortOrder: n(r.sort_order), parentKind: (r.parent_kind as string) ?? null, calc: (r.calc as string) ?? null,
  statuses: r.statuses as string[], initialStatus: r.initial_status as string, transitions: (r.transitions as Record<string, string[]>) ?? {},
  settle: r.settle as RecordKind["settle"], settleStatus: (r.settle_status as string) ?? null,
  approvalStatus: (r.approval_status as string) ?? null, approvalThreshold: r.approval_threshold === null ? null : n(r.approval_threshold),
  fields: (r.fields as KindField[]) ?? [],
});

export const toRecord = (r: Row): InstRecord => ({
  id: r.id as string, ownerUserId: r.owner_user_id as string, kind: r.kind as string, ref: r.ref as string, title: r.title as string,
  counterparty: (r.counterparty as string) ?? null, amount: n(r.amount), currency: r.currency as string, status: r.status as string,
  dueDate: (r.due_date as string) ?? null, parentId: (r.parent_id as string) ?? null, data: (r.data as Record<string, unknown>) ?? {},
  createdBy: r.created_by as string, approvedBy: (r.approved_by as string) ?? null, settledAt: (r.settled_at as string) ?? null, createdAt: r.created_at as string,
});

export async function listSubProfiles(): Promise<SubProfile[]> {
  const res = await supabase.from("sub_profiles").select("*").order("sort_order");
  return check(res, "listSubProfiles").map(toSubProfile);
}

export async function listModules(): Promise<InstModule[]> {
  const res = await supabase.from("inst_modules").select("*").order("sort_order");
  return check(res, "listModules").map((r) => ({ moduleKey: r.module_key, label: r.label, description: r.description, icon: r.icon, sortOrder: n(r.sort_order) }));
}

export async function listKinds(): Promise<RecordKind[]> {
  const res = await supabase.from("inst_record_kinds").select("*").order("sort_order");
  return check(res, "listKinds").map(toKind);
}

export async function myModules(userId: string, role: string): Promise<(InstModule & { subProfile: string | null })[]> {
  const res = await supabase.rpc("my_modules", { p_user_id: userId, p_role: role });
  return (check(res, "myModules") as Row[]).map((r) => ({
    moduleKey: r.module_key as string, label: r.label as string, description: r.description as string, icon: r.icon as string,
    sortOrder: n(r.sort_order), subProfile: (r.sub_profile as string) ?? null,
  }));
}

export async function setMySubProfile(args: { userId: string; role: string; subProfile: string }): Promise<void> {
  const res = await supabase.rpc("set_my_sub_profile", { p_user_id: args.userId, p_role: args.role, p_sub_profile: args.subProfile });
  if (res.error) throw new Error(res.error.message.replace(/^[a-z_]+: /, ""));
}

export async function listRecords(userId: string, module?: string, kind?: string): Promise<InstRecord[]> {
  const res = await supabase.rpc("inst_list_records", { p_user_id: userId, p_module: module ?? null, p_kind: kind ?? null });
  return (check(res, "listRecords") as Row[]).map(toRecord);
}

export async function createRecord(args: {
  userId: string; kind: string; title: string; counterparty?: string; amount: number; currency: string;
  dueDate?: string; data?: Record<string, unknown>; parentId?: string;
}): Promise<InstRecord> {
  const res = await supabase.rpc("inst_create_record", {
    p_user_id: args.userId, p_kind: args.kind, p_title: args.title, p_counterparty: args.counterparty ?? null, p_amount: args.amount,
    p_currency: args.currency, p_due: args.dueDate || null, p_data: args.data ?? {}, p_parent: args.parentId ?? null,
  });
  return toRecord(check(res, "createRecord") as Row);
}

export async function transitionRecord(args: { actorId: string; recordId: string; to: string; note?: string }): Promise<InstRecord> {
  const res = await supabase.rpc("inst_transition", { p_actor: args.actorId, p_record_id: args.recordId, p_to: args.to, p_note: args.note ?? null });
  return toRecord(check(res, "transitionRecord") as Row);
}

export async function setTally(args: { actorId: string; recordId: string; votesFor: number; votesAgainst: number; abstain: number }): Promise<InstRecord> {
  const res = await supabase.rpc("inst_set_tally", { p_actor: args.actorId, p_record_id: args.recordId, p_for: args.votesFor, p_against: args.votesAgainst, p_abstain: args.abstain });
  return toRecord(check(res, "setTally") as Row);
}

export async function runPayroll(args: { userId: string; period: string; currency: string }): Promise<InstRecord> {
  const res = await supabase.rpc("inst_run_payroll", { p_user_id: args.userId, p_period: args.period, p_currency: args.currency });
  return toRecord(check(res, "runPayroll") as Row);
}

export async function setRecurrence(args: { userId: string; recordId: string; every: string | null; next?: string; remaining?: number | null }): Promise<InstRecord> {
  const res = await supabase.rpc("inst_set_recurrence", { p_user_id: args.userId, p_record_id: args.recordId, p_every: args.every, p_next: args.next ?? null, p_remaining: args.remaining ?? null });
  return toRecord(check(res, "setRecurrence") as Row);
}

export async function runRecurring(userId: string): Promise<number> {
  const res = await supabase.rpc("inst_run_recurring", { p_user_id: userId });
  return n(check(res, "runRecurring"));
}

export async function pendingApprovals(actorId: string): Promise<PendingApproval[]> {
  const res = await supabase.rpc("inst_pending_approvals", { p_actor: actorId });
  return (check(res, "pendingApprovals") as Row[]).map((r) => ({
    id: r.id as string, ref: r.ref as string, kind: r.kind as string, kindLabel: r.kind_label as string, title: r.title as string,
    amount: n(r.amount), currency: r.currency as string, status: r.status as string, toStatus: r.to_status as string,
    ownerName: r.owner_name as string, createdByName: r.created_by_name as string, createdAt: r.created_at as string,
  }));
}

export async function amortization(principal: number, ratePct: number, months: number): Promise<AmortizationRow[]> {
  const res = await supabase.rpc("inst_amortization", { p_principal: principal, p_rate_pct: ratePct, p_months: months });
  return (check(res, "amortization") as Row[]).map((r) => ({ period: n(r.period), payment: n(r.payment), interest: n(r.interest), principal: n(r.principal), balance: n(r.balance) }));
}

export async function journal(userId: string, from?: string, to?: string): Promise<JournalLine[]> {
  const res = await supabase.rpc("inst_journal", { p_user_id: userId, p_from: from || null, p_to: to || null });
  return (check(res, "journal") as Row[]).map((r) => ({
    entryDate: r.entry_date as string, ref: r.ref as string, kind: r.kind as string, accountCode: r.account_code as string,
    accountName: r.account_name as string, debit: n(r.debit), credit: n(r.credit), currency: r.currency as string, memo: r.memo as string,
  }));
}
