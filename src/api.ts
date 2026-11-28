import { Hono, type Context } from 'hono';
import { CASE_STATUSES, core, type CaseStatus, type Result } from './core';
import { authenticate, type KeyScope } from './keys';
import { managesIntegrations } from './webhooks';

/**
 * The creditors' API at /api/v1 (docs/API.md). Authenticated by an API key; every call acts for
 * the key's organization only. JSON in and out; errors are `{ "error": code, "detail"?: text }`.
 * `external_ref` is the idempotency key: sending the same case again updates it.
 */

type ApiEnv = {
  Bindings: Env;
  Variables: { orgId: string; keyId: string; scopes: KeyScope[]; now: number };
};
type ApiContext = Context<ApiEnv>;

const MAX_BODY_BYTES = 1_000_000;

/** HTTP status for each core error code. */
function statusOf(error: string): 400 | 401 | 403 | 404 | 409 | 422 | 429 {
  if (error === 'not_found') return 404;
  if (error === 'not_a_partner' || error === 'partner_not_active') return 403;
  if (
    [
      'duplicate_case',
      'case_closed',
      'vin_mismatch',
      'conflict_retry',
      'delivery_in_review',
    ].includes(error)
  )
    return 409;
  if (error === 'invalid_json' || error === 'invalid_cursor') return 400;
  return 422;
}

function reply<T>(c: ApiContext, result: Result<T>) {
  if (result.ok) return c.json(result.value);
  const response = c.json(
    result.detail === undefined
      ? { error: result.error }
      : { error: result.error, detail: result.detail },
    statusOf(result.error),
  );
  if (result.error === 'conflict_retry') response.headers.set('Retry-After', '1');
  return response;
}

async function readJson(c: ApiContext): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const length = Number(c.req.header('Content-Length') ?? '0');
  if (length > MAX_BODY_BYTES) return { ok: false };
  const text = await c.req.text();
  if (text.length > MAX_BODY_BYTES) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function createApi(now: () => number) {
  const api = new Hono<ApiEnv>();

  api.use('*', async (c, next) => {
    c.set('now', now());
    c.header('Cache-Control', 'no-store');
    c.header('X-Robots-Tag', 'noindex, nofollow');
    const key = await authenticate(c.env, c.req.header('Authorization'), c.get('now'));
    if (!key) {
      // Wrong keys are counted per address (right ones per key, below), so an address trying keys
      // is slowed without touching other integrations behind the same address.
      const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
      const attempts = await c.env.API_RATE_LIMITER.limit({ key: `badkey:${ip}` });
      if (!attempts.success) {
        c.header('Retry-After', '60');
        return c.json({ error: 'rate_limited' }, 429);
      }
      c.header('WWW-Authenticate', 'Bearer realm="emanet-kurumsal"');
      return c.json(
        { error: 'invalid_key', detail: 'Send a valid API key as a Bearer token.' },
        401,
      );
    }
    const { success } = await c.env.API_RATE_LIMITER.limit({ key: key.keyId });
    if (!success) {
      c.header('Retry-After', '60');
      return c.json({ error: 'rate_limited' }, 429);
    }
    // As on the pages: a key works only while its organization is an active partner. A suspended
    // company, or one whose organization was deleted, reads nothing more through an old key.
    const partner = await core(c.env).partner(key.orgId);
    if (!partner.ok || partner.value.status !== 'active') {
      return c.json(
        { error: 'partner_not_active', detail: 'This organization isn’t active in Emanet.' },
        403,
      );
    }
    // A key acts for the person who made it: it stops working the moment they leave the
    // organization or stop managing its integrations (read live from login, like a page).
    if (!(await managesIntegrations(c.env, key.orgId, key.createdBy))) {
      return c.json(
        {
          error: 'key_owner_left',
          detail:
            'The person who made this key no longer manages integrations in this organization. Make a new key.',
        },
        403,
      );
    }
    c.set('orgId', key.orgId);
    c.set('keyId', key.keyId);
    c.set('scopes', key.scopes);
    await next();
  });

  const allowed = (c: ApiContext, scope: KeyScope) =>
    c.get('scopes').includes(scope)
      ? null
      : c.json({ error: 'insufficient_scope', detail: `This key lacks ${scope}.` }, 403);

  const actor = (c: ApiContext) => `apikey:${c.get('keyId')}`;

  api.get('/schema', async (c) => {
    const denied = allowed(c, 'cases:read');
    if (denied) return denied;
    const [caseFields, vehicleFields, placeFields] = await Promise.all([
      core(c.env).schema(c.get('orgId'), 'case'),
      core(c.env).schema(c.get('orgId'), 'vehicle'),
      core(c.env).schema(c.get('orgId'), 'place'),
    ]);
    if (!caseFields.ok) return reply(c, caseFields);
    if (!vehicleFields.ok) return reply(c, vehicleFields);
    if (!placeFields.ok) return reply(c, placeFields);
    return c.json({
      case: caseFields.value,
      vehicle: vehicleFields.value,
      place: placeFields.value,
    });
  });

  api.post('/cases', async (c) => {
    const denied = allowed(c, 'cases:write');
    if (denied) return denied;
    const body = await readJson(c);
    if (!body.ok || !isObject(body.value)) return c.json({ error: 'invalid_json' }, 400);
    const result = await core(c.env).upsertCase(
      c.get('orgId'),
      actor(c),
      body.value as unknown as Parameters<ReturnType<typeof core>['upsertCase']>[2],
    );
    return reply(c, result);
  });

  api.get('/cases', async (c) => {
    const denied = allowed(c, 'cases:read');
    if (denied) return denied;
    const status = c.req.query('status');
    if (status !== undefined && !CASE_STATUSES.includes(status as CaseStatus)) {
      return c.json({ error: 'invalid_status' }, 400);
    }
    const since = c.req.query('updated_since');
    const limit = c.req.query('limit');
    const cursor = c.req.query('cursor');
    return reply(
      c,
      await core(c.env).listCases(c.get('orgId'), {
        ...(status === undefined ? {} : { status: status as CaseStatus }),
        ...(since === undefined ? {} : { updatedSince: Number(since) || 0 }),
        ...(cursor === undefined ? {} : { cursor }),
        ...(limit === undefined ? {} : { limit: Number(limit) || 50 }),
      }),
    );
  });

  api.get('/cases/:id', async (c) => {
    const denied = allowed(c, 'cases:read');
    if (denied) return denied;
    return reply(c, await core(c.env).getCase(c.get('orgId'), c.req.param('id')));
  });

  api.get('/cases/:id/timeline', async (c) => {
    const denied = allowed(c, 'cases:read');
    if (denied) return denied;
    return reply(c, await core(c.env).caseTimeline(c.get('orgId'), c.req.param('id')));
  });

  api.get('/invoices', async (c) => {
    const denied = allowed(c, 'invoices:read');
    if (denied) return denied;
    return reply(c, await core(c.env).invoices(c.get('orgId')));
  });

  api.get('/invoices/:id', async (c) => {
    const denied = allowed(c, 'invoices:read');
    if (denied) return denied;
    return reply(c, await core(c.env).invoice(c.get('orgId'), c.req.param('id')));
  });

  api.post('/cases/:id/withdraw', async (c) => {
    const denied = allowed(c, 'cases:write');
    if (denied) return denied;
    const body = await readJson(c);
    if (!body.ok || !isObject(body.value) || typeof body.value.reason !== 'string') {
      return c.json({ error: 'invalid_json', detail: 'Send { "reason": "…" }.' }, 400);
    }
    return reply(
      c,
      await core(c.env).withdrawCase(
        c.get('orgId'),
        actor(c),
        c.req.param('id'),
        body.value.reason,
      ),
    );
  });

  api.post('/cases/confirm', async (c) => {
    const denied = allowed(c, 'cases:write');
    if (denied) return denied;
    const body = await readJson(c);
    const ids = body.ok && isObject(body.value) ? body.value.case_ids : undefined;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
      return c.json({ error: 'invalid_json', detail: 'Send { "case_ids": ["…"] }.' }, 400);
    }
    return reply(c, await core(c.env).confirmCases(c.get('orgId'), actor(c), ids));
  });

  api.get('/events', async (c) => {
    const denied = allowed(c, 'events:read');
    if (denied) return denied;
    const limit = Number(c.req.query('limit') ?? '100') || 100;
    return reply(c, await core(c.env).events(c.get('orgId'), c.req.query('cursor') ?? null, limit));
  });

  api.notFound((c) => c.json({ error: 'not_found' }, 404));
  return api;
}
