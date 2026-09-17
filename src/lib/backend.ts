// Supabase replacement for App/convex/*.ts — see supabase/migrations/
// 0001_init_schema.sql through 0006_app_rpc_functions.sql for the schema
// and RPC functions this calls, and supabase/README.md for why the
// target-shape tables (wallet_views/quotes/transfers/partner_mock) are used
// here instead of the legacy 1:1 Convex translation (wallets/transactions).
//
// One function per Convex query/mutation this replaces, kept close to the
// original's name and shape so each page's migration is a small, reviewable
// diff rather than a rewrite. Pure reads that RLS permits directly (cards,
// wallet_views, user_roles, addresses, linked_payment_methods,
// marketplace_partners, shop_orders) are plain supabase-js queries — no
// RPC wrapping for a trivial SELECT.
import { supabase } from "./supabase-client.ts";

// ============================================================================
// Types — mirror the Postgres tables/RPC return shapes, camelCased to match
// what the Convex-backed pages already destructure.
// ============================================================================

export interface AppUser {
  id: string;
  authUserId: string | null;
  username: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  idType: string | null;
  profileType: string | null;
  country: string | null;
  defaultCurrency: string | null;
  kycStatus: "unverified" | "submitted" | "verified";
  kycSubmittedAt: string | null;
  isTestData: boolean;
}

export interface AppAddress {
  id: string;
  userId: string;
  street: string;
  houseNumber: string;
  city: string;
  province: string;
  country: string;
  postalCode: string | null;
  createdAt: string;
}

export interface AppUserRole {
  id: string;
  userId: string;
  role: string;
  kind: "individual" | "organisation";
  status: "incomplete" | "pending_verification" | "verified";
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  idType: string | null;
  orgName: string | undefined; // matches post-auth-routing.ts's ExistingRole.orgName?: string
  registrationDocPath: string | null;
  legalRepName: string | null;
  legalRepIdType: string | null;
  legalRepIdNumber: string | null;
  legalRepPhone: string | null;
  createdAt: string;
  complete: boolean;
}

export interface AppWallet {
  id: string;
  userId: string;
  provider: string;
  currency: string;
  balance: number;
  asOf: string;
  isStale: boolean;
  flag: string;
  colorClass: string;
}

export interface AppCard {
  id: string;
  userId: string;
  tier: string;
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
  balance: number;
  currency: string;
  type: string;
  network: string;
  contactless: boolean;
  gradient: string;
  shimmer: string;
  accentColor: string;
  locked: boolean;
  monthlySpend: number;
  monthlyLimit: number;
}

export interface AppTransfer {
  id: string;
  userId: string;
  walletViewId: string;
  type: "transfer" | "payment" | "deposit" | "remittance" | "convert_out" | "convert_in";
  state: string;
  amount: number;
  currency: string;
  partnerTxId: string | null;
  reference: string;
  note: string | null;
  createdAt: string;
}

export interface LinkedPaymentMethod {
  id: string;
  ownerKey: string | null;
  provider: "apple_pay" | "google_pay" | "card" | "bank" | "mobile_money";
  label: string;
  status: "active" | "primary";
  createdAt: string;
}

export interface MarketplacePartner {
  id: string;
  slug: string;
  name: string;
  category: string;
  emoji: string;
  promoted: boolean;
  discountPercent: number | null;
  rating: number;
  items: { name: string; price: number }[];
}

export interface ShopOrder {
  id: string;
  ownerKey: string | null;
  partnerSlug: string | null;
  partnerName: string;
  subtotal: number;
  discountAmount: number;
  payrusFee: number;
  partnerCommission: number;
  total: number;
  method: string;
  reference: string;
  createdAt: string;
}

// Throws on a Postgrest/RPC error; otherwise returns `data` AS-IS — still
// possibly null (e.g. `.maybeSingle()` legitimately finds no row). Use
// `mustHaveData` below when null would itself be a bug, not a valid result.
function mustNotError<T>(res: { data: T | null; error: { message: string } | null }, label: string): T | null {
  if (res.error) throw new Error(`${label}: ${res.error.message}`);
  return res.data;
}

// Same, but also throws if `data` is null — for calls (`.select()` without
// `.maybeSingle()`, `.single()`, an RPC expected to always return a row)
// where a null result means something went wrong, not "not found."
function mustHaveData<T>(res: { data: T | null; error: { message: string } | null }, label: string): T {
  const data = mustNotError(res, label);
  if (data === null) throw new Error(`${label}: expected data, got null`);
  return data;
}

function toAppUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string, authUserId: (row.auth_user_id as string) ?? null, username: (row.username as string) ?? null,
    name: (row.name as string) ?? null, firstName: (row.first_name as string) ?? null, lastName: (row.last_name as string) ?? null,
    email: (row.email as string) ?? null, phone: (row.phone as string) ?? null, dateOfBirth: (row.date_of_birth as string) ?? null,
    address: (row.address as string) ?? null, idType: (row.id_type as string) ?? null, profileType: (row.profile_type as string) ?? null,
    country: (row.country as string) ?? null, defaultCurrency: (row.default_currency as string) ?? null,
    kycStatus: row.kyc_status as AppUser["kycStatus"], kycSubmittedAt: (row.kyc_submitted_at as string) ?? null,
    isTestData: Boolean(row.is_test_data),
  };
}

// ============================================================================
// Identity (replaces convex/users.ts, convex/supabaseAuth.ts)
// ============================================================================

export async function upsertSupabaseUser(args: {
  supabaseUserId: string; email: string; name?: string; firstName?: string; lastName?: string;
}): Promise<{ userId: string; isNew: boolean; name: string }> {
  const before = await supabase.from("users").select("id").eq("auth_user_id", args.supabaseUserId).maybeSingle();
  const res = await supabase.rpc("upsert_supabase_user", {
    p_auth_user_id: args.supabaseUserId, p_email: args.email, p_name: args.name ?? null,
    p_first_name: args.firstName ?? null, p_last_name: args.lastName ?? null,
  });
  const row = mustHaveData(res, "upsertSupabaseUser") as Record<string, unknown>;
  return { userId: row.id as string, isNew: !before.data, name: (row.name as string) ?? args.email };
}

export async function completeRegistrationProfile(args: {
  userId: string; phone: string; country: string; street: string; houseNumber: string;
  city: string; province: string; postalCode?: string;
}): Promise<void> {
  const res = await supabase.rpc("complete_registration_profile", {
    p_user_id: args.userId, p_phone: args.phone, p_country: args.country, p_street: args.street,
    p_house_number: args.houseNumber, p_city: args.city, p_province: args.province, p_postal_code: args.postalCode ?? null,
  });
  mustHaveData(res, "completeRegistrationProfile");
}

export async function resolveEmailByIdentifier(identifier: string): Promise<string | null> {
  const res = await supabase.rpc("resolve_email_by_identifier", { p_identifier: identifier });
  return mustNotError(res, "resolveEmailByIdentifier") as string | null;
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  const res = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  const row = mustNotError(res, "getUserById");
  return row ? toAppUser(row) : null;
}

// ============================================================================
// Addresses (replaces convex/addresses.ts)
// ============================================================================

export async function listAddressesForUser(userId: string): Promise<AppAddress[]> {
  const res = await supabase.from("addresses").select("*").eq("user_id", userId);
  return mustHaveData(res, "listAddressesForUser").map((r) => ({
    id: r.id, userId: r.user_id, street: r.street, houseNumber: r.house_number, city: r.city,
    province: r.province, country: r.country, postalCode: r.postal_code, createdAt: r.created_at,
  }));
}

// ============================================================================
// User roles (replaces convex/userRoles.ts)
// ============================================================================

const ROLE_REQUIRED_FIELDS: Record<"individual" | "organisation", (keyof Omit<AppUserRole, "complete">)[]> = {
  individual: ["phone", "dateOfBirth", "address", "idType"],
  organisation: ["phone", "dateOfBirth", "address", "idType", "orgName", "registrationDocPath", "legalRepName", "legalRepIdType", "legalRepIdNumber", "legalRepPhone"],
};

function roleIsComplete(role: Omit<AppUserRole, "complete">): boolean {
  return ROLE_REQUIRED_FIELDS[role.kind].every((field) => {
    const value = role[field];
    return typeof value === "string" ? value.trim().length > 0 : value != null;
  });
}

export async function listUserRolesForUser(userId: string): Promise<AppUserRole[]> {
  const res = await supabase.from("user_roles").select("*").eq("user_id", userId);
  return mustHaveData(res, "listUserRolesForUser").map((r) => {
    const role: Omit<AppUserRole, "complete"> = {
      id: r.id, userId: r.user_id, role: r.role, kind: r.kind, status: r.status,
      phone: r.phone, dateOfBirth: r.date_of_birth, address: r.address, idType: r.id_type, orgName: r.org_name ?? undefined,
      registrationDocPath: r.registration_doc_path, legalRepName: r.legal_rep_name, legalRepIdType: r.legal_rep_id_type,
      legalRepIdNumber: r.legal_rep_id_number, legalRepPhone: r.legal_rep_phone, createdAt: r.created_at,
    };
    return { ...role, complete: roleIsComplete(role) };
  });
}

export async function upsertUserRole(args: {
  userId: string; role: string; kind: "individual" | "organisation"; phone?: string; dateOfBirth?: string;
  address?: string; idType?: string; orgName?: string; registrationDocPath?: string; legalRepName?: string;
  legalRepIdType?: string; legalRepIdNumber?: string; legalRepPhone?: string;
}): Promise<string> {
  const res = await supabase.rpc("upsert_user_role", {
    p_user_id: args.userId, p_role: args.role, p_kind: args.kind, p_phone: args.phone ?? null,
    p_date_of_birth: args.dateOfBirth ?? null, p_address: args.address ?? null, p_id_type: args.idType ?? null,
    p_org_name: args.orgName ?? null, p_registration_doc_path: args.registrationDocPath ?? null,
    p_legal_rep_name: args.legalRepName ?? null, p_legal_rep_id_type: args.legalRepIdType ?? null,
    p_legal_rep_id_number: args.legalRepIdNumber ?? null, p_legal_rep_phone: args.legalRepPhone ?? null,
  });
  const row = mustHaveData(res, "upsertUserRole") as Record<string, unknown>;
  return row.id as string;
}

// Convex's generateRegistrationDocUploadUrl had no direct Supabase Storage
// equivalent built in this pass — file upload for the org registration
// document is flagged, not silently dropped, in the migration notes.
// (project root PROGRESS/APP_MIGRATION_NOTES.md)

// ============================================================================
// Wallets / transfers (replaces convex/wallets.ts, financialData.ts)
// ============================================================================

function toAppWallet(r: Record<string, unknown>): AppWallet {
  return {
    id: r.id as string, userId: r.user_id as string, provider: r.provider as string, currency: r.currency as string,
    balance: Number(r.balance_snapshot), asOf: r.as_of as string, isStale: Boolean(r.is_stale),
    flag: r.flag as string, colorClass: r.color_class as string,
  };
}

export async function listWalletViewsForUser(userId: string): Promise<AppWallet[]> {
  const res = await supabase.from("wallet_views").select("*").eq("user_id", userId);
  return mustHaveData(res, "listWalletViewsForUser").map(toAppWallet);
}

function toAppTransfer(r: Record<string, unknown>): AppTransfer {
  return {
    id: r.id as string, userId: r.user_id as string, walletViewId: r.wallet_view_id as string, type: r.type as AppTransfer["type"],
    state: r.state as string, amount: Number(r.amount), currency: r.currency as string, partnerTxId: (r.partner_tx_id as string) ?? null,
    reference: r.reference as string, note: (r.note as string) ?? null, createdAt: r.created_at as string,
  };
}

export async function listRecentTransfersForUser(userId: string, limit = 10): Promise<AppTransfer[]> {
  const res = await supabase.from("transfers").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return mustHaveData(res, "listRecentTransfersForUser").map(toAppTransfer);
}

export async function listTransfersForWallet(walletViewId: string): Promise<AppTransfer[]> {
  const res = await supabase.from("transfers").select("*").eq("wallet_view_id", walletViewId).order("created_at", { ascending: false });
  return mustHaveData(res, "listTransfersForWallet").map(toAppTransfer);
}

export async function depositToWallet(args: { userId: string; amount: number; currency: string; method?: string; note?: string }): Promise<AppTransfer> {
  const res = await supabase.rpc("deposit_to_wallet", {
    p_user_id: args.userId, p_amount: args.amount, p_currency: args.currency, p_method: args.method ?? null, p_note: args.note ?? null,
  });
  return toAppTransfer(mustHaveData(res, "depositToWallet") as Record<string, unknown>);
}

export async function applyWalletTransfer(args: {
  userId: string; amount: number; currency: string; type: "transfer" | "payment" | "remittance"; note?: string;
}): Promise<AppTransfer> {
  const res = await supabase.rpc("apply_wallet_transfer", {
    p_user_id: args.userId, p_amount: args.amount, p_currency: args.currency, p_type: args.type, p_note: args.note ?? null,
  });
  return toAppTransfer(mustHaveData(res, "applyWalletTransfer") as Record<string, unknown>);
}

export async function convertBetweenWallets(args: {
  userId: string; amount: number; fromCurrency: string; toCurrency: string; note?: string;
}): Promise<{ fromTransfer: AppTransfer; toTransfer: AppTransfer }> {
  const res = await supabase.rpc("convert_between_wallets", {
    p_user_id: args.userId, p_amount: args.amount, p_from_currency: args.fromCurrency, p_to_currency: args.toCurrency, p_note: args.note ?? null,
  });
  const rows = mustHaveData(res, "convertBetweenWallets") as Record<string, unknown>[];
  const row = rows[0];
  return { fromTransfer: toAppTransfer(row.from_transfer as Record<string, unknown>), toTransfer: toAppTransfer(row.to_transfer as Record<string, unknown>) };
}

// ============================================================================
// Cards (replaces convex/cards.ts)
// ============================================================================

export async function listCardsForUser(userId: string): Promise<AppCard[]> {
  const res = await supabase.from("cards").select("*").eq("user_id", userId);
  return mustHaveData(res, "listCardsForUser").map((r) => ({
    id: r.id, userId: r.user_id, tier: r.tier, brand: r.brand, last4: r.last4, holder: r.holder, expiry: r.expiry,
    balance: Number(r.balance), currency: r.currency, type: r.type, network: r.network, contactless: r.contactless,
    gradient: r.gradient, shimmer: r.shimmer, accentColor: r.accent_color, locked: r.locked,
    monthlySpend: Number(r.monthly_spend), monthlyLimit: Number(r.monthly_limit),
  }));
}

// ============================================================================
// Linked payment methods (replaces convex/linkedPaymentMethods.ts) — direct
// table access, RLS's "owner_key or user" policy handles both the
// anonymous-before-login and signed-in cases without an RPC.
// ============================================================================

export async function listLinkedPaymentMethods(ownerKey: string): Promise<LinkedPaymentMethod[]> {
  const res = await supabase.from("linked_payment_methods").select("*").eq("owner_key", ownerKey);
  return mustHaveData(res, "listLinkedPaymentMethods").map((r) => ({
    id: r.id, ownerKey: r.owner_key, provider: r.provider, label: r.label, status: r.status, createdAt: r.created_at,
  }));
}

export async function addLinkedPaymentMethod(args: {
  ownerKey: string; provider: LinkedPaymentMethod["provider"]; label: string;
}): Promise<string> {
  const res = await supabase.from("linked_payment_methods")
    .insert({ owner_key: args.ownerKey, provider: args.provider, label: args.label, status: "active" })
    .select("id").single();
  return mustHaveData(res, "addLinkedPaymentMethod").id;
}

const DEFAULT_LINKED_METHODS: { provider: LinkedPaymentMethod["provider"]; label: string; status: LinkedPaymentMethod["status"] }[] = [
  { provider: "card", label: "Rawbank Visa •• 4821", status: "primary" },
  { provider: "card", label: "Ecobank MC •• 9302", status: "active" },
  { provider: "mobile_money", label: "Orange Money +243", status: "active" },
];

export async function seedDefaultLinkedPaymentMethods(ownerKey: string): Promise<void> {
  const existing = await listLinkedPaymentMethods(ownerKey);
  if (existing.length > 0) return;
  const res = await supabase.from("linked_payment_methods")
    .insert(DEFAULT_LINKED_METHODS.map((m) => ({ owner_key: ownerKey, ...m })));
  mustHaveData(res, "seedDefaultLinkedPaymentMethods");
}

// ============================================================================
// Marketplace / shop orders (replaces convex/marketplacePartners.ts,
// shopOrders.ts) — direct table access.
// ============================================================================

export async function listMarketplacePartners(): Promise<MarketplacePartner[]> {
  const res = await supabase.from("marketplace_partners").select("*, marketplace_partner_items(name, price)");
  return mustHaveData(res, "listMarketplacePartners").map((r) => ({
    id: r.id, slug: r.slug, name: r.name, category: r.category, emoji: r.emoji, promoted: r.promoted,
    discountPercent: r.discount_percent == null ? null : Number(r.discount_percent), rating: Number(r.rating),
    items: (r.marketplace_partner_items ?? []).map((i: { name: string; price: number }) => ({ name: i.name, price: Number(i.price) })),
  }));
}

export async function createShopOrder(args: {
  ownerKey: string; partnerSlug: string; partnerName: string; subtotal: number; discountAmount: number;
  payrusFee: number; partnerCommission: number; total: number; method: string; reference: string;
}): Promise<string> {
  const partner = await supabase.from("marketplace_partners").select("id").eq("slug", args.partnerSlug).maybeSingle();
  const res = await supabase.from("shop_orders").insert({
    owner_key: args.ownerKey, partner_id: partner.data?.id ?? null, partner_name: args.partnerName,
    subtotal: args.subtotal, discount_amount: args.discountAmount, payrus_fee: args.payrusFee,
    partner_commission: args.partnerCommission, total: args.total, method: args.method, reference: args.reference,
  }).select("id").single();
  return mustHaveData(res, "createShopOrder").id;
}

// ============================================================================
// Admin panel (replaces convex/admin.ts, testUsers.ts) — same deliberately
// unrestricted access as the Convex version, see 0006's own header comment.
// ============================================================================

export interface AdminUserRow { user: AppUser; roles: AppUserRole[]; wallets: AppWallet[]; cards: AppCard[] }

export async function adminListUsers(): Promise<AdminUserRow[]> {
  const res = await supabase.rpc("admin_list_users");
  return mustHaveData(res, "adminListUsers").map((r: Record<string, unknown>) => ({
    user: toAppUser(r.user_data as Record<string, unknown>),
    roles: (r.roles as Record<string, unknown>[]).map((role) => {
      const base: Omit<AppUserRole, "complete"> = {
        id: role.id as string, userId: role.user_id as string, role: role.role as string, kind: role.kind as AppUserRole["kind"],
        status: role.status as AppUserRole["status"], phone: (role.phone as string) ?? null, dateOfBirth: (role.date_of_birth as string) ?? null,
        address: (role.address as string) ?? null, idType: (role.id_type as string) ?? null, orgName: (role.org_name as string) ?? undefined,
        registrationDocPath: (role.registration_doc_path as string) ?? null, legalRepName: (role.legal_rep_name as string) ?? null,
        legalRepIdType: (role.legal_rep_id_type as string) ?? null, legalRepIdNumber: (role.legal_rep_id_number as string) ?? null,
        legalRepPhone: (role.legal_rep_phone as string) ?? null, createdAt: role.created_at as string,
      };
      return { ...base, complete: roleIsComplete(base) };
    }),
    wallets: (r.wallets as Record<string, unknown>[]).map(toAppWallet),
    cards: (r.cards as Record<string, unknown>[]).map((c) => ({
      id: c.id as string, userId: c.user_id as string, tier: c.tier as string, brand: c.brand as string, last4: c.last4 as string,
      holder: c.holder as string, expiry: c.expiry as string, balance: Number(c.balance), currency: c.currency as string,
      type: c.type as string, network: c.network as string, contactless: c.contactless as boolean, gradient: c.gradient as string,
      shimmer: c.shimmer as string, accentColor: c.accent_color as string, locked: c.locked as boolean,
      monthlySpend: Number(c.monthly_spend), monthlyLimit: Number(c.monthly_limit),
    })),
  }));
}

export async function adminUpdateUserRole(args: {
  roleId: string; status?: AppUserRole["status"]; phone?: string; dateOfBirth?: string; address?: string; idType?: string;
  orgName?: string; legalRepName?: string; legalRepIdType?: string; legalRepIdNumber?: string; legalRepPhone?: string;
}): Promise<void> {
  const res = await supabase.rpc("admin_update_user_role", {
    p_role_id: args.roleId, p_status: args.status ?? null, p_phone: args.phone ?? null, p_date_of_birth: args.dateOfBirth ?? null,
    p_address: args.address ?? null, p_id_type: args.idType ?? null, p_org_name: args.orgName ?? null,
    p_legal_rep_name: args.legalRepName ?? null, p_legal_rep_id_type: args.legalRepIdType ?? null,
    p_legal_rep_id_number: args.legalRepIdNumber ?? null, p_legal_rep_phone: args.legalRepPhone ?? null,
  });
  mustHaveData(res, "adminUpdateUserRole");
}

export async function adminCreateUser(args: {
  name: string; email: string; role: string; kind: "individual" | "organisation"; password?: string;
}): Promise<{ userId: string; roleId: string; alreadyExisted: boolean }> {
  const res = await supabase.rpc("admin_create_user", { p_name: args.name, p_email: args.email, p_role: args.role, p_kind: args.kind, p_password: args.password ?? null });
  const row = (mustHaveData(res, "adminCreateUser") as Record<string, unknown>[])[0];
  return { userId: row.user_id as string, roleId: row.role_id as string, alreadyExisted: row.already_existed as boolean };
}

export async function adminGrantAdminRole(args: { userId: string; password: string }): Promise<string> {
  const res = await supabase.rpc("admin_grant_admin_role", { p_user_id: args.userId, p_password: args.password });
  return (mustHaveData(res, "adminGrantAdminRole") as Record<string, unknown>).id as string;
}

export async function adminBackfillCardHolders(): Promise<number> {
  const res = await supabase.rpc("admin_backfill_card_holders");
  return mustHaveData(res, "adminBackfillCardHolders") as number;
}

export async function testUsersCleanup(): Promise<number> {
  const res = await supabase.rpc("test_users_cleanup");
  return mustHaveData(res, "testUsersCleanup") as number;
}
