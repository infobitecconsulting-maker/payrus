// 0058: webhooks for the institutional modules (signed event deliveries, up to 10 per account).
import { supabase } from "./supabase-client.ts";

type Row = Record<string, unknown>;
const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const clean = (m: string) => m.replace(/^[a-z_]+: /, "");

function rows(res: { data: unknown; error: { message: string } | null }): Row[] {
  if (res.error) throw new Error(clean(res.error.message));
  if (res.data === null || res.data === undefined) return [];
  return (Array.isArray(res.data) ? res.data : [res.data]) as Row[];
}
function done(res: { error: { message: string } | null }) {
  if (res.error) throw new Error(clean(res.error.message));
}

export const WEBHOOK_EVENTS = ["record.created", "record.status_changed", "record.settled", "bank_line.reconciled", "followup.sent"] as const;

export interface Webhook {
  id: string; url: string; description: string; events: string[]; active: boolean; createdAt: string;
  lastDeliveryAt: string | null; lastStatusCode: number | null; delivered24h: number; failed24h: number; pending: number;
}
export interface WebhookDelivery {
  id: string; webhookId: string; url: string; event: string; status: "queued" | "sending" | "sent" | "failed" | "dead";
  attempts: number; responseCode: number | null; lastError: string | null; createdAt: string; deliveredAt: string | null; nextAttemptAt: string;
}

export async function listWebhooks(userId: string): Promise<Webhook[]> {
  return rows(await supabase.rpc("inst_webhook_list", { p_user_id: userId })).map((r) => ({
    id: r.id as string, url: r.url as string, description: (r.description as string) ?? "", events: (r.events as string[]) ?? [], active: !!r.active,
    createdAt: r.created_at as string, lastDeliveryAt: (r.last_delivery_at as string) ?? null, lastStatusCode: r.last_status_code === null ? null : n(r.last_status_code),
    delivered24h: n(r.delivered_24h), failed24h: n(r.failed_24h), pending: n(r.pending),
  }));
}
export async function createWebhook(a: { userId: string; url: string; events: string[]; description: string }): Promise<{ id: string; secret: string }> {
  const r = rows(await supabase.rpc("inst_webhook_create", { p_user_id: a.userId, p_url: a.url, p_events: a.events, p_description: a.description }))[0];
  return { id: r.id as string, secret: r.secret as string };
}
export async function setWebhookActive(a: { userId: string; id: string; active: boolean }): Promise<void> {
  done(await supabase.rpc("inst_webhook_set_active", { p_user_id: a.userId, p_id: a.id, p_active: a.active }));
}
export async function deleteWebhook(a: { userId: string; id: string }): Promise<void> {
  done(await supabase.rpc("inst_webhook_delete", { p_user_id: a.userId, p_id: a.id }));
}
export async function rotateWebhookSecret(a: { userId: string; id: string }): Promise<string> {
  const res = await supabase.rpc("inst_webhook_rotate_secret", { p_user_id: a.userId, p_id: a.id });
  if (res.error) throw new Error(clean(res.error.message));
  return res.data as string;
}
export async function testWebhook(a: { userId: string; id: string }): Promise<void> {
  done(await supabase.rpc("inst_webhook_test", { p_user_id: a.userId, p_id: a.id }));
}
export async function listWebhookDeliveries(userId: string, webhookId?: string): Promise<WebhookDelivery[]> {
  return rows(await supabase.rpc("inst_webhook_deliveries", { p_user_id: userId, p_webhook: webhookId ?? null, p_limit: 50 })).map((r) => ({
    id: r.id as string, webhookId: r.webhook_id as string, url: r.url as string, event: r.event as string, status: r.status as WebhookDelivery["status"],
    attempts: n(r.attempts), responseCode: r.response_code === null ? null : n(r.response_code), lastError: (r.last_error as string) ?? null,
    createdAt: r.created_at as string, deliveredAt: (r.delivered_at as string) ?? null, nextAttemptAt: r.next_attempt_at as string,
  }));
}
export async function retryWebhookDelivery(a: { userId: string; deliveryId: string }): Promise<void> {
  done(await supabase.rpc("inst_webhook_retry", { p_user_id: a.userId, p_delivery: a.deliveryId }));
}
