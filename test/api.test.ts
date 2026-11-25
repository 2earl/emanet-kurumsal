import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { createKey } from '../src/keys';
import { caseJson, coreHooks, request } from './helpers';

const now = () => Math.floor(Date.now() / 1000);

async function key(
  scopes: string[] = ['cases:read', 'cases:write', 'events:read'],
  orgId = 'org-1',
) {
  return (
    await createKey(
      env,
      { orgId, name: `k-${crypto.randomUUID()}`, scopes, uid: 'owner-1', expiresInDays: 30 },
      now(),
    )
  ).key;
}

const api = (path: string, apiKey: string, init: { method?: string; body?: unknown } = {}) =>
  request(`/api/v1${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });

beforeEach(async () => {
  await coreHooks().testReset();
});

describe('API', () => {
  it('refuses requests without a valid key', async () => {
    expect((await request('/api/v1/cases')).status).toBe(401);
    expect((await api('/cases', 'emk_AAAAAAAA_' + 'A'.repeat(43))).status).toBe(401);
  });

  it('adds, reads, lists and withdraws cases for the key’s organization', async () => {
    const k = await key();
    const created = await api('/cases', k, {
      method: 'POST',
      body: caseJson({ external_ref: 'API-1' }),
    });
    expect(created.status).toBe(200);
    const view = await created.json<{ id: string; status: string }>();
    expect(view.status).toBe('active');
    expect((await api(`/cases/${view.id}`, k)).status).toBe(200);
    const list = await (await api('/cases?status=active', k)).json<{ cases: unknown[] }>();
    expect(list.cases).toHaveLength(1);
    const withdrawn = await api(`/cases/${view.id}/withdraw`, k, {
      method: 'POST',
      body: { reason: 'Paid' },
    });
    expect(await withdrawn.json()).toMatchObject({ status: 'withdrawn' });
    expect(
      (await api(`/cases/${view.id}/withdraw`, k, { method: 'POST', body: { reason: 'Paid' } }))
        .status,
    ).toBe(409);
  });

  it('maps core errors to statuses and keeps detail', async () => {
    const k = await key();
    const bad = await api('/cases', k, { method: 'POST', body: caseJson({ plate: 'xx' }) });
    expect(bad.status).toBe(422);
    expect(await bad.json()).toEqual({ error: 'invalid_plate' });
    const unknown = await api('/cases', k, {
      method: 'POST',
      body: caseJson({ attributes: { colourr: 1 } }),
    });
    expect(await unknown.json()).toEqual({ error: 'unknown_field', detail: 'colourr' });
    expect(
      (
        await request('/api/v1/cases', {
          method: 'POST',
          headers: { Authorization: `Bearer ${k}` },
          body: '{not json',
        })
      ).status,
    ).toBe(400);
    expect((await api('/cases?status=lost', k)).status).toBe(400);
    expect((await api('/cases/nope', k)).status).toBe(404);
  });

  it('enforces the key’s permissions and revocation', async () => {
    const readOnly = await key(['cases:read']);
    const denied = await api('/cases', readOnly, { method: 'POST', body: caseJson() });
    expect(denied.status).toBe(403);
    expect(await denied.json()).toMatchObject({ error: 'insufficient_scope' });
    expect((await api('/events', readOnly)).status).toBe(403);
    await env.DB.prepare('UPDATE api_keys SET revoked_at = 1').run();
    expect((await api('/cases', readOnly)).status).toBe(401);
  });

  it('serves the schema and events', async () => {
    const k = await key();
    const schema = await (await api('/schema', k)).json<{ case: { key: string }[] }>();
    expect(schema.case.map((f) => f.key)).toEqual(['portfolio']);
    await coreHooks().testAddEvent('org-1', 'case.delivered', { case_id: 'c-1' });
    const events = await (
      await api('/events', k)
    ).json<{ events: { type: string }[]; next_cursor: string }>();
    expect(events.events.map((e) => e.type)).toEqual(['case.delivered']);
    const after = await (
      await api(`/events?cursor=${encodeURIComponent(events.next_cursor)}`, k)
    ).json<{ events: unknown[] }>();
    expect(after.events).toHaveLength(0);
  });
});
