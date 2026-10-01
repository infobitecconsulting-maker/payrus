// 0059: account plans and workspace team roles for the institutional modules.
import { supabase } from "./supabase-client.ts";

type Row = Record<string, unknown>;
const clean = (m: string) => m.replace(/^[a-z_]+: /, "");
function rows(res: { data: unknown; error: { message: string } | null }): Row[] {
  if (res.error) throw new Error(clean(res.error.message));
  if (res.data === null || res.data === undefined) return [];
  return (Array.isArray(res.data) ? res.data : [res.data]) as Row[];
}
function done(res: { error: { message: string } | null }) {
  if (res.error) throw new Error(clean(res.error.message));
}

export const TEAM_PERMISSIONS = ["view", "view_own", "create", "edit", "reconcile", "approve", "settle", "manage_team", "manage_webhooks", "manage_settings"] as const;
export type TeamPermission = (typeof TEAM_PERMISSIONS)[number];

export interface Workspace {
  ownerId: string; ownerName: string; roleSlug: string; roleLabel: string; permissions: string[]; isSelf: boolean; modulesRole: string | null;
}
export interface TeamRole { slug: string; label: string; description: string; permissions: string[]; isSystem: boolean }
export interface TeamMember { memberId: string; name: string; email: string; roleSlug: string; roleLabel: string; status: "active" | "suspended"; createdAt: string }
export interface AccountPlan {
  slug: string; family: "individual" | "business"; label: string; tagline: string; monthlyFeeEur: number | null; indicative: boolean; entitlements: Record<string, number | boolean | string>;
}
export interface MyPlan { role: string; family: string; plan: string; planLabel: string }

export async function listWorkspaces(actorId: string): Promise<Workspace[]> {
  return rows(await supabase.rpc("inst_my_workspaces", { p_actor: actorId })).map((r) => ({
    ownerId: r.owner_user_id as string, ownerName: (r.owner_name as string) ?? "", roleSlug: r.role_slug as string, roleLabel: r.role_label as string,
    permissions: (r.permissions as string[]) ?? [], isSelf: !!r.is_self, modulesRole: (r.modules_role as string | null) ?? null,
  }));
}
export async function listTeamRoles(ownerId: string): Promise<TeamRole[]> {
  return rows(await supabase.rpc("inst_team_roles_list", { p_user_id: ownerId })).map((r) => ({
    slug: r.slug as string, label: r.label as string, description: (r.description as string) ?? "", permissions: (r.permissions as string[]) ?? [], isSystem: !!r.is_system,
  }));
}
export async function listTeam(ownerId: string): Promise<TeamMember[]> {
  return rows(await supabase.rpc("inst_team_list", { p_user_id: ownerId })).map((r) => ({
    memberId: r.member_user_id as string, name: (r.member_name as string) ?? "", email: (r.member_email as string) ?? "", roleSlug: r.role_slug as string,
    roleLabel: r.role_label as string, status: r.status as "active" | "suspended", createdAt: r.created_at as string,
  }));
}
export async function addTeamMember(a: { ownerId: string; identifier: string; role: string }): Promise<void> {
  done(await supabase.rpc("inst_team_add", { p_user_id: a.ownerId, p_identifier: a.identifier, p_role: a.role }));
}
export async function setTeamMemberStatus(a: { ownerId: string; memberId: string; status: "active" | "suspended" }): Promise<void> {
  done(await supabase.rpc("inst_team_set_status", { p_user_id: a.ownerId, p_member: a.memberId, p_status: a.status }));
}
export async function removeTeamMember(a: { ownerId: string; memberId: string }): Promise<void> {
  done(await supabase.rpc("inst_team_remove", { p_user_id: a.ownerId, p_member: a.memberId }));
}
export async function saveTeamRole(a: { ownerId: string; label: string; permissions: string[]; description?: string }): Promise<string> {
  const res = await supabase.rpc("inst_team_role_save", { p_user_id: a.ownerId, p_label: a.label, p_permissions: a.permissions, p_description: a.description ?? "" });
  if (res.error) throw new Error(clean(res.error.message));
  return res.data as string;
}
export async function deleteTeamRole(a: { ownerId: string; slug: string }): Promise<void> {
  done(await supabase.rpc("inst_team_role_delete", { p_user_id: a.ownerId, p_slug: a.slug }));
}

export async function listPlans(): Promise<AccountPlan[]> {
  const res = await supabase.from("account_plans").select("slug,family,label,tagline,monthly_fee_eur,indicative,entitlements,sort_order").order("sort_order");
  return rows(res).map((r) => ({
    slug: r.slug as string, family: r.family as "individual" | "business", label: r.label as string, tagline: r.tagline as string,
    monthlyFeeEur: r.monthly_fee_eur === null ? null : Number(r.monthly_fee_eur), indicative: !!r.indicative, entitlements: (r.entitlements as AccountPlan["entitlements"]) ?? {},
  }));
}
export async function listMyPlans(userId: string): Promise<MyPlan[]> {
  return rows(await supabase.rpc("my_plans", { p_user_id: userId })).map((r) => ({ role: r.role as string, family: r.family as string, plan: r.plan as string, planLabel: r.plan_label as string }));
}
export async function setMyPlan(a: { userId: string; role: string; plan: string }): Promise<void> {
  done(await supabase.rpc("set_my_plan", { p_user_id: a.userId, p_role: a.role, p_plan: a.plan }));
}
