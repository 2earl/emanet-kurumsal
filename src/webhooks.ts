import { authz, core } from './core';
import { base64url, randomToken } from './http';

/**
 * Webhooks (docs/DESIGN.md §5). Events come from emanet-core's outbox, read per organization from
 * a stored cursor, queued once per webhook, and sent with retries for a day.
 *
 * Each request carries `Emanet-Signature: t=<unix time>,v1=<hex HMAC-SHA256 of "<t>.<body>">` with
 * the webhook's secret. Receivers should check the signature and refuse a time more than five
 * minutes off. `Emanet-Event-Id` lets them ignore a repeat.
 */

export const EVENT_TYPES = [
  'case.delivered',
  'case.expired',
  'case.rejected',
  'invoice.issued',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Used when the core can't be asked; staff set the real limits in Merkez's settings. */
const MAX_WEBHOOKS_PER_ORG = 5;
const TIMEOUT_MS = 10_000;
/** Seconds to wait after each failed attempt; after the last, the delivery is given up. */
const BACKOFF = [60, 300, 1800, 7200, 21_600, 43_200, 86_400] as const;
/** A webhook failing this many deliveries in a row is switched off. */
const DISABLE_AFTER = 20;

export class WebhookError extends Error {
  override name = 'WebhookError';
}

export interface Webhook {
  id: string;
  url: string;
  events: EventType[];
  created_by: string;
  created_at: number;
  disabled_at: number | null;
  /** Why it is off: the receiver kept failing, its creator left, or the organization isn't active. */
  disabled_reason: 'failures' | 'owner_left' | 'partner_inactive' | null;
  consecutive_failures: number;
}

export interface Delivery {
  id: string;
  event_type: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  last_status: number | null;
  next_attempt_at: number;
  created_at: number;
}

// ---- Secret encryption ------------------------------------------------------------------------

async function aesKey(env: Env): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(env.WEBHOOK_KEY), (ch) => ch.charCodeAt(0));
  if (raw.length !== 32) throw new Error('WEBHOOK_KEY must be 32 bytes, base64');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptSecret(env: Env, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      await aesKey(env),
      new TextEncoder().encode(secret),
    ),
  );
  return `${base64url(iv)}.${base64url(sealed)}`;
}

const fromBase64url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));

async function decryptSecret(env: Env, stored: string): Promise<string> {
  const [iv = '', sealed = ''] = stored.split('.');
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64url(iv) },
    await aesKey(env),
    fromBase64url(sealed),
  );
  return new TextDecoder().decode(plain);
}

// ---- Configuration ----------------------------------------------------------------------------

/**
 * Only public HTTPS addresses on the default port. The runtime's global_fetch_strictly_public
 * flag also keeps requests off private networks after DNS resolution.
 */
export function checkUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new WebhookError('Enter a full https:// address.');
  }
  if (url.protocol !== 'https:') throw new WebhookError('The address must use https://.');
  if (url.username || url.password)
    throw new WebhookError('The address must not contain a user name or password.');
  if (url.port !== '') throw new WebhookError('Use the standard https port.');
  const host = url.hostname;
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^[\d.]+$/.test(host) ||
    host.startsWith('[') ||
    !host.includes('.')
  ) {
    throw new WebhookError('Use a public host name, not an IP address or a local name.');
  }
  if (url.href.length > 500) throw new WebhookError('The address is too long.');
  url.hash = '';
  return url.href;
}

export async function createWebhook(
  env: Env,
  input: { orgId: string; url: string; events: readonly string[]; uid: string },
  now: number,
): Promise<{ id: string; secret: string }> {
  const url = checkUrl(input.url);
  const events = EVENT_TYPES.filter((type) => input.events.includes(type));
  if (events.length === 0) throw new WebhookError('Choose at least one event.');
  const count = await env.DB.prepare('SELECT count(*) AS n FROM webhooks WHERE org_id = ?')
    .bind(input.orgId)
    .first<{ n: number }>();
  const limits = await core(env).limits();
  const most = limits.ok ? limits.value.max_webhooks : MAX_WEBHOOKS_PER_ORG;
  if ((count?.n ?? 0) >= most) {
    throw new WebhookError('This organization has as many webhooks as it may. Delete one first.');
  }
  const secret = `whsec_${randomToken(32)}`;
  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO webhooks (id, org_id, url, events, secret_enc, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      input.orgId,
      url,
      JSON.stringify(events),
      await encryptSecret(env, secret),
      input.uid,
      now,
    ),
    // Start from now: a new webhook gets new events, not the organization's history.
    env.DB.prepare(
      `INSERT INTO event_cursors (org_id, cursor, updated_at) VALUES (?, NULL, ?)
       ON CONFLICT (org_id) DO NOTHING`,
    ).bind(input.orgId, now),
  ]);
  await catchUpCursor(env, input.orgId, now);
  return { id, secret };
}

/** Moves a fresh cursor past existing events, so a first webhook doesn't replay history. */
async function catchUpCursor(env: Env, orgId: string, now: number): Promise<void> {
  const row = await env.DB.prepare('SELECT cursor FROM event_cursors WHERE org_id = ?')
    .bind(orgId)
    .first<{ cursor: string | null }>();
  if (row?.cursor !== null) return;
  let cursor: string | null = null;
  for (let page = 0; page < 100; page++) {
    const result = await core(env).events(orgId, cursor, 500);
    if (!result.ok || result.value.events.length === 0) break;
    cursor = result.value.next_cursor;
  }
  await env.DB.prepare('UPDATE event_cursors SET cursor = ?, updated_at = ? WHERE org_id = ?')
    .bind(cursor ?? `${String(now)}.00000000-0000-0000-0000-000000000000`, now, orgId)
    .run();
}

export async function listWebhooks(env: Env, orgId: string): Promise<Webhook[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, url, events, created_by, created_at, disabled_at, disabled_reason, consecutive_failures
     FROM webhooks WHERE org_id = ? ORDER BY created_at`,
  )
    .bind(orgId)
    .all<Omit<Webhook, 'events'> & { events: string }>();
  return results.map((row) => ({ ...row, events: JSON.parse(row.events) as EventType[] }));
}

export async function recentDeliveries(
  env: Env,
  orgId: string,
  limit = 50,
): Promise<(Delivery & { url: string })[]> {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.event_type, d.status, d.attempts, d.last_status, d.next_attempt_at, d.created_at, w.url
     FROM deliveries d JOIN webhooks w ON w.id = d.webhook_id
     WHERE w.org_id = ? ORDER BY d.created_at DESC LIMIT ?`,
  )
    .bind(orgId, limit)
    .all<Delivery & { url: string }>();
  return results;
}

export async function deleteWebhook(env: Env, orgId: string, id: string): Promise<boolean> {
  const result = await env.DB.batch([
    env.DB.prepare(
      'DELETE FROM deliveries WHERE webhook_id IN (SELECT id FROM webhooks WHERE id = ? AND org_id = ?)',
    ).bind(id, orgId),
    env.DB.prepare('DELETE FROM webhooks WHERE id = ? AND org_id = ?').bind(id, orgId),
  ]);
  return result[1]?.meta.changes === 1;
}

/**
 * Switches a webhook that was turned off back on. Whoever does it answers for it from now on:
 * it keeps running only while they manage the organization's integrations.
 */
export async function enableWebhook(
  env: Env,
  orgId: string,
  id: string,
  uid: string,
): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE webhooks SET disabled_at = NULL, disabled_reason = NULL, consecutive_failures = 0,
       created_by = ? WHERE id = ? AND org_id = ?`,
  )
    .bind(uid, id, orgId)
    .run();
  return result.meta.changes === 1;
}

/**
 * Before anything is queued or sent: a webhook sends the organization's case events to an
 * address someone chose, so it runs only while that person still manages the organization's
 * integrations (login's authorization API, read live) and the organization is an active partner.
 * Otherwise it is switched off, with the reason shown on the Webhooks page. Returns how many.
 */
export async function guardWebhooks(env: Env, now: number): Promise<number> {
  const { results } = await env.DB.prepare(
    'SELECT id, org_id, created_by FROM webhooks WHERE disabled_at IS NULL',
  ).all<{ id: string; org_id: string; created_by: string }>();
  const active = new Map<string, boolean>();
  const manages = new Map<string, boolean>();
  let off = 0;
  for (const hook of results) {
    let partnerActive = active.get(hook.org_id);
    if (partnerActive === undefined) {
      const partner = await core(env).partner(hook.org_id);
      partnerActive = partner.ok && partner.value.status === 'active';
      active.set(hook.org_id, partnerActive);
    }
    let reason: 'owner_left' | 'partner_inactive' | null = partnerActive
      ? null
      : 'partner_inactive';
    if (!reason) {
      const key = `${hook.org_id}|${hook.created_by}`;
      let may = manages.get(key);
      if (may === undefined) {
        may = await managesIntegrations(env, hook.org_id, hook.created_by);
        manages.set(key, may);
      }
      if (!may) reason = 'owner_left';
    }
    if (!reason) continue;
    await env.DB.prepare(
      'UPDATE webhooks SET disabled_at = ?, disabled_reason = ? WHERE id = ? AND disabled_at IS NULL',
    )
      .bind(now, reason, hook.id)
      .run();
    off++;
  }
  return off;
}

/** Whether this person may manage the organization's API keys and webhooks right now. */
export async function managesIntegrations(env: Env, orgId: string, uid: string): Promise<boolean> {
  const granted = await authz(env).permissionsOf({ subject: { type: 'user', id: uid }, orgId });
  return granted.permissions.includes('emanet:integrations.manage');
}

// ---- Delivery ---------------------------------------------------------------------------------

async function sign(secret: string, timestamp: number, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${String(timestamp)}.${body}`)),
  );
  return [...mac].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Reads new core events for every organization with a webhook, and queues them. */
export async function enqueueEvents(env: Env, now: number): Promise<number> {
  const { results: orgIds } = await env.DB.prepare(
    'SELECT DISTINCT org_id FROM webhooks WHERE disabled_at IS NULL',
  ).all<{ org_id: string }>();
  let queued = 0;
  for (const { org_id: orgId } of orgIds) {
    const row = await env.DB.prepare('SELECT cursor FROM event_cursors WHERE org_id = ?')
      .bind(orgId)
      .first<{ cursor: string | null }>();
    const result = await core(env).events(orgId, row?.cursor ?? null, 200);
    if (!result.ok || result.value.events.length === 0) continue;
    const { results: hooks } = await env.DB.prepare(
      'SELECT id, events FROM webhooks WHERE org_id = ? AND disabled_at IS NULL',
    )
      .bind(orgId)
      .all<{ id: string; events: string }>();
    const statements: D1PreparedStatement[] = [];
    for (const event of result.value.events) {
      const payload = JSON.stringify({
        id: event.id,
        type: event.type,
        created_at: event.created_at,
        data: event.data,
      });
      for (const hook of hooks) {
        if (!(JSON.parse(hook.events) as string[]).includes(event.type)) continue;
        statements.push(
          env.DB.prepare(
            `INSERT INTO deliveries (id, webhook_id, event_id, event_type, payload, next_attempt_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (webhook_id, event_id) DO NOTHING`,
          ).bind(crypto.randomUUID(), hook.id, event.id, event.type, payload, now, now),
        );
        queued++;
      }
    }
    statements.push(
      env.DB.prepare(
        `INSERT INTO event_cursors (org_id, cursor, updated_at) VALUES (?, ?, ?)
         ON CONFLICT (org_id) DO UPDATE SET cursor = excluded.cursor, updated_at = excluded.updated_at`,
      ).bind(orgId, result.value.next_cursor, now),
    );
    await env.DB.batch(statements);
  }
  return queued;
}

/** Sends due deliveries. Run by the cron every minute. */
export async function sendDue(
  env: Env,
  now: number,
  fetcher: typeof fetch = fetch,
): Promise<number> {
  let disableAfter: number | undefined;
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.webhook_id, d.event_id, d.payload, d.attempts, w.url, w.secret_enc
     FROM deliveries d JOIN webhooks w ON w.id = d.webhook_id
     WHERE d.status = 'pending' AND d.next_attempt_at <= ? AND w.disabled_at IS NULL
     ORDER BY d.next_attempt_at LIMIT 50`,
  )
    .bind(now)
    .all<{
      id: string;
      webhook_id: string;
      event_id: string;
      payload: string;
      attempts: number;
      url: string;
      secret_enc: string;
    }>();
  const started = Date.now();
  for (const delivery of results) {
    let status: number;
    // The time this request is signed with, not the time the run began: after a few slow
    // receivers the two drift apart, and a receiver refuses a signature more than five minutes old.
    const signedAt = now + Math.floor((Date.now() - started) / 1000);
    try {
      const secret = await decryptSecret(env, delivery.secret_enc);
      const response = await fetcher(delivery.url, {
        method: 'POST',
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Emanet-Webhooks/1',
          'Emanet-Event-Id': delivery.event_id,
          'Emanet-Signature': `t=${String(signedAt)},v1=${await sign(secret, signedAt, delivery.payload)}`,
        },
        body: delivery.payload,
      });
      status = response.status;
      await response.body?.cancel();
    } catch {
      status = 0;
    }
    const attempts = delivery.attempts + 1;
    if (status >= 200 && status < 300) {
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE deliveries SET status = 'delivered', attempts = ?, last_status = ?, delivered_at = ? WHERE id = ?`,
        ).bind(attempts, status, now, delivery.id),
        env.DB.prepare('UPDATE webhooks SET consecutive_failures = 0 WHERE id = ?').bind(
          delivery.webhook_id,
        ),
      ]);
      continue;
    }
    const wait = BACKOFF[attempts - 1];
    disableAfter ??= await core(env)
      .limits()
      .then((limits) => (limits.ok ? limits.value.webhook_disable_after : DISABLE_AFTER))
      .catch(() => DISABLE_AFTER);
    const [, hook] = await env.DB.batch<{
      org_id: string;
      url: string;
      disabled_at: number | null;
    }>([
      wait === undefined
        ? env.DB.prepare(
            `UPDATE deliveries SET status = 'failed', attempts = ?, last_status = ? WHERE id = ?`,
          ).bind(attempts, status, delivery.id)
        : env.DB.prepare(
            `UPDATE deliveries SET attempts = ?, last_status = ?, next_attempt_at = ? WHERE id = ?`,
          ).bind(attempts, status, now + wait, delivery.id),
      env.DB.prepare(
        `UPDATE webhooks SET consecutive_failures = consecutive_failures + 1,
           disabled_at = CASE WHEN consecutive_failures + 1 >= ? THEN ? ELSE disabled_at END,
           disabled_reason = CASE WHEN consecutive_failures + 1 >= ? THEN 'failures' ELSE disabled_reason END
         WHERE id = ? AND disabled_at IS NULL RETURNING org_id, url, disabled_at`,
      ).bind(disableAfter, now, disableAfter, delivery.webhook_id),
    ]);
    // Switched off just now: the company's operations contact is told (the core mails them) and
    // staff see it. Told once: a webhook already off isn't counted again.
    const off = hook?.results[0];
    if (off && off.disabled_at !== null) {
      try {
        await core(env).webhookDisabled(off.org_id, new URL(off.url).hostname);
      } catch (error) {
        console.error(
          JSON.stringify({
            level: 'error',
            event: 'webhook.alert_failed',
            error: error instanceof Error ? error.name : 'error',
          }),
        );
      }
    }
  }
  return results.length;
}

/** How long a finished delivery (sent, or given up) stays in the log. */
export const DELIVERY_RETENTION_DAYS = 30;

/** Cron: finished deliveries leave the log after 30 days; their payloads name cases and plates. */
export async function purgeDeliveries(env: Env, now: number): Promise<number> {
  const result = await env.DB.prepare(
    `DELETE FROM deliveries WHERE id IN (
       SELECT id FROM deliveries WHERE status IN ('delivered', 'failed') AND created_at < ? LIMIT 1000)`,
  )
    .bind(now - DELIVERY_RETENTION_DAYS * 86_400)
    .run();
  return result.meta.changes;
}
