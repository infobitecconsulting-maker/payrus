import { internalAction } from "./_generated/server";

// Delivery worker for institutional-module webhooks (supabase/migrations/0058).
//
// Triggers in Postgres queue every event in an outbox in the same transaction as
// the change. This cron-driven action drains it: it claims a batch with the
// service role (the claim/report RPCs are granted to nobody else), POSTs each
// payload signed with HMAC-SHA256, and reports the outcome. Retries, backoff
// (1 min, 5 min, 30 min, 2 h, 12 h) and dead-lettering are decided in the
// database by webhook_report, so a crashed run simply leaves deliveries to be
// re-claimed after five minutes.
//
// Signature header:  PayRus-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, `${t}.${body}`)>
// Receivers should recompute it over the raw body and reject old timestamps.
// Redirects are never followed and each request times out after 10 seconds.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the Convex environment.

const BATCH = 25;
const TIMEOUT_MS = 10_000;

interface Claimed {
  delivery_id: string;
  url: string;
  secret: string;
  event: string;
  payload: unknown;
  attempt: number;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function rpc<T>(base: string, key: string, name: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${name} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

export const dispatchWebhooks = internalAction({
  args: {},
  handler: async (): Promise<{ claimed: number; sent: number; failed: number; error?: string }> => {
    const base = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return { claimed: 0, sent: 0, failed: 0, error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in the Convex environment" };

    let batch: Claimed[];
    try {
      batch = await rpc<Claimed[]>(base, key, "webhook_claim_batch", { p_limit: BATCH });
    } catch (e) {
      console.error("webhook claim failed:", e);
      return { claimed: 0, sent: 0, failed: 0, error: String(e) };
    }

    let sent = 0;
    let failed = 0;
    for (const d of batch) {
      let ok = false;
      let code: number | null = null;
      let error: string | null = null;
      try {
        const body = JSON.stringify(d.payload);
        const t = Math.floor(Date.now() / 1000);
        const signature = await hmacHex(d.secret, `${t}.${body}`);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        try {
          const res = await fetch(d.url, {
            method: "POST",
            redirect: "manual",
            signal: ctrl.signal,
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "PayRus-Webhooks/1.0",
              "PayRus-Event": d.event,
              "PayRus-Delivery": d.delivery_id,
              "PayRus-Signature": `t=${t},v1=${signature}`,
            },
            body,
          });
          code = res.status;
          ok = res.status >= 200 && res.status < 300;
          if (!ok) error = res.status >= 300 && res.status < 400 ? `redirect (${res.status}) not followed` : `HTTP ${res.status}`;
        } finally {
          clearTimeout(timer);
        }
      } catch (e) {
        error = e instanceof Error && e.name === "AbortError" ? `timeout after ${TIMEOUT_MS / 1000}s` : String(e).slice(0, 200);
      }
      try {
        await rpc<string>(base, key, "webhook_report", { p_delivery_id: d.delivery_id, p_ok: ok, p_code: code, p_error: error });
      } catch (e) {
        console.error("webhook report failed:", e);
      }
      if (ok) sent++; else failed++;
    }
    return { claimed: batch.length, sent, failed };
  },
});
