import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { WebhookError, checkUrl, createWebhook, enqueueEvents, sendDue } from '../src/webhooks';
import { coreHooks } from './helpers';

const now = () => Math.floor(Date.now() / 1000);

beforeEach(async () => {
  await coreHooks().testReset();
  await env.DB.batch(
    ['deliveries', 'webhooks', 'event_cursors'].map((t) => env.DB.prepare(`DELETE FROM ${t}`)),
  );
});

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)),
  );
  return [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('webhook addresses', () => {
  it('accepts only public https host names', () => {
    expect(checkUrl('https://bank.example/hooks/emanet#x')).toBe(
      'https://bank.example/hooks/emanet',
    );
    for (const bad of [
      'http://bank.example/x',
      'https://127.0.0.1/x',
      'https://localhost/x',
      'https://[::1]/x',
      'https://bank.example:8443/x',
      'https://u:p@bank.example/x',
      'https://intranet/x',
      'nonsense',
    ]) {
      expect(() => checkUrl(bad)).toThrow(WebhookError);
    }
  });
});

describe('delivery', () => {
  it('sends new events, signed, once; not the history before the webhook existed', async () => {
    await coreHooks().testAddEvent('org-1', 'case.delivered', { case_id: 'old' });
    const { secret } = await createWebhook(
      env,
      {
        orgId: 'org-1',
        url: 'https://bank.example/hook',
        events: ['case.delivered'],
        uid: 'owner-1',
      },
      now(),
    );
    const eventId = await coreHooks().testAddEvent('org-1', 'case.delivered', { case_id: 'c-1' });
    await coreHooks().testAddEvent('org-1', 'invoice.issued', { invoice_id: 'i-1' });

    expect(await enqueueEvents(env, now())).toBe(1);
    expect(await enqueueEvents(env, now())).toBe(0);

    const calls: { url: string; headers: Headers; body: string }[] = [];
    const fake = ((url: string, init: RequestInit) => {
      calls.push({ url, headers: new Headers(init.headers), body: init.body as string });
      return Promise.resolve(new Response('ok', { status: 200 }));
    }) as unknown as typeof fetch;
    expect(await sendDue(env, now(), fake)).toBe(1);
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toBe('https://bank.example/hook');
    expect(call?.headers.get('Emanet-Event-Id')).toBe(eventId);
    expect(JSON.parse(call?.body ?? '{}')).toMatchObject({
      type: 'case.delivered',
      data: { case_id: 'c-1' },
    });
    const [t, v1] = (call?.headers.get('Emanet-Signature') ?? '')
      .split(',')
      .map((p) => p.split('=')[1] ?? '');
    expect(v1).toBe(await hmacHex(secret, `${t ?? ''}.${call?.body ?? ''}`));
    expect(await sendDue(env, now(), fake)).toBe(0);
  });

  it('tells the partner when 2earl rejects a case it couldn’t identify', async () => {
    await createWebhook(
      env,
      {
        orgId: 'org-1',
        url: 'https://bank.example/rejections',
        events: ['case.rejected'],
        uid: 'owner-1',
      },
      now(),
    );
    await coreHooks().testAddEvent('org-1', 'case.rejected', {
      case_id: 'c-9',
      external_ref: 'K-9',
      reason: 'Wrong chassis number',
    });
    expect(await enqueueEvents(env, now())).toBe(1);
    const bodies: string[] = [];
    const fake = ((_url: string, init: RequestInit) => {
      bodies.push(init.body as string);
      return Promise.resolve(new Response('ok', { status: 200 }));
    }) as unknown as typeof fetch;
    expect(await sendDue(env, now(), fake)).toBe(1);
    expect(JSON.parse(bodies[0] ?? '{}')).toMatchObject({
      type: 'case.rejected',
      data: { external_ref: 'K-9', reason: 'Wrong chassis number' },
    });
  });

  it('retries with backoff, and switches a failing webhook off', async () => {
    await createWebhook(
      env,
      {
        orgId: 'org-1',
        url: 'https://bank.example/down',
        events: ['case.expired'],
        uid: 'owner-1',
      },
      now(),
    );
    for (let i = 0; i < 20; i++)
      await coreHooks().testAddEvent('org-1', 'case.expired', { case_id: `c-${String(i)}` });
    await enqueueEvents(env, now());
    const failing = (() =>
      Promise.resolve(new Response('no', { status: 503 }))) as unknown as typeof fetch;
    expect(await sendDue(env, now(), failing)).toBe(20);
    const delivery = await env.DB.prepare(
      'SELECT attempts, last_status, next_attempt_at FROM deliveries LIMIT 1',
    ).first<{ attempts: number; last_status: number; next_attempt_at: number }>();
    expect(delivery).toMatchObject({ attempts: 1, last_status: 503 });
    expect((delivery?.next_attempt_at ?? 0) - now()).toBeGreaterThanOrEqual(59);
    const hook = await env.DB.prepare('SELECT disabled_at FROM webhooks').first<{
      disabled_at: number | null;
    }>();
    expect(hook?.disabled_at).not.toBeNull();
    // Switched off: nothing more is sent, even when due.
    expect(await sendDue(env, now() + 10_000, failing)).toBe(0);
  });

  it('keeps the signing secret encrypted at rest', async () => {
    const { secret } = await createWebhook(
      env,
      {
        orgId: 'org-1',
        url: 'https://bank.example/hook',
        events: ['case.delivered'],
        uid: 'owner-1',
      },
      now(),
    );
    const row = await env.DB.prepare('SELECT secret_enc FROM webhooks').first<{
      secret_enc: string;
    }>();
    expect(row?.secret_enc).not.toContain(secret.slice(6));
  });
});
