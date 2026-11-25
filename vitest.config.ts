import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

/**
 * Tests run the Worker with stand-ins for its two neighbours:
 * - login: a token endpoint that checks PKCE, validateToken, and an OrganizationDirectory with
 *   fixed memberships. A code is "<uid>.<code_challenge>"; a uid ending "!aal2" signed in with a
 *   second factor a minute ago.
 * - emanet-core's PartnerApi: an in-memory version of the contract in src/core.ts, with one
 *   active partner (org-1), one invited (org-3), and a test hook to add events.
 */

const LOGIN = `
import { WorkerEntrypoint } from 'cloudflare:workers';
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
const MEMBERS = {
  'owner-1': [['org-1', 'Test Bankası', 'owner'], ['org-2', 'Not a partner', 'owner']],
  'member-1': [['org-1', 'Test Bankası', 'member']],
  'auditor-1': [['org-1', 'Test Bankası', 'auditor']],
  'invited-1': [['org-3', 'Yeni Varlık', 'owner']],
  'outsider': [],
};
const base = (uid) => uid.split('!')[0];
export class OrganizationDirectory extends WorkerEntrypoint {
  async membershipsOf(uid) {
    return (MEMBERS[base(uid)] ?? []).map(([orgId, name, role]) => ({ orgId, name, role }));
  }
  async roleOf(orgId, uid) {
    return (MEMBERS[base(uid)] ?? []).find(([o]) => o === orgId)?.[2] ?? null;
  }
}
export default class extends WorkerEntrypoint {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== '/oauth/token') return new Response('no', { status: 404 });
    const form = await request.formData();
    const code = String(form.get('code'));
    const dot = code.lastIndexOf('.');
    const uid = code.slice(0, dot);
    const challenge = code.slice(dot + 1);
    const digest = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(String(form.get('code_verifier'))));
    const ok = form.get('grant_type') === 'authorization_code'
      && form.get('resource') === 'https://emanet-kurumsal.2earl.com'
      && form.get('client_id') === 'https://emanet-kurumsal.2earl.com/oauth/client.json'
      && b64(digest) === challenge;
    if (!ok) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    return Response.json({ access_token: 'token-' + uid, token_type: 'Bearer' });
  }
  async validateToken(resource, token) {
    if (!token.startsWith('token-')) return null;
    const uid = token.slice(6);
    return { audience: resource, scope: ['emanet:partner'],
      props: { uid: base(uid), aal2At: uid.endsWith('!aal2') ? Math.floor(Date.now() / 1000) - 60 : null } };
  }
}
`;

const CORE = `
import { WorkerEntrypoint } from 'cloudflare:workers';
const PARTNERS = {
  'org-1': { id: 'p-1', orgId: 'org-1', kind: 'bank', legalName: 'Test Bankası A.Ş.', status: 'active', reconfirmDays: 14 },
  'org-3': { id: 'p-3', orgId: 'org-3', kind: 'vys', legalName: 'Yeni Varlık A.Ş.', status: 'invited', reconfirmDays: 14 },
};
const cases = new Map();
const events = [];
const ok = (value) => ({ ok: true, value });
const fail = (error, detail) => (detail === undefined ? { ok: false, error } : { ok: false, error, detail });
const now = () => Math.floor(Date.now() / 1000);
const FIELDS = { case: [{ key: 'portfolio', labelTr: 'Portföy', labelEn: 'Portfolio', type: 'enum',
  enumValues: ['A', 'B'], required: false, deprecated: false, entity: 'case' }], vehicle: [], place: [] };
export class PartnerApi extends WorkerEntrypoint {
  async partner(orgId) { return PARTNERS[orgId] ? ok(PARTNERS[orgId]) : fail('not_a_partner'); }
  async upsertCase(orgId, actor, input) {
    const p = PARTNERS[orgId];
    if (!p) return fail('not_a_partner');
    if (p.status !== 'active') return fail('partner_not_active');
    if (typeof input.plate !== 'string' || !/^\\d{2}[A-Z]{1,3}\\d{2,4}$/.test(input.plate.replace(/\\s/g, '').toUpperCase())) return fail('invalid_plate');
    for (const k of Object.keys(input.attributes ?? {})) if (k !== 'portfolio') return fail('unknown_field', k);
    const key = orgId + '|' + input.external_ref;
    const existing = cases.get(key);
    const t = now();
    const view = {
      id: existing?.id ?? crypto.randomUUID(), external_ref: input.external_ref,
      status: input.vin ? 'active' : 'pending_identity',
      vehicle: { vin: input.vin ?? null, plate: input.plate.replace(/\\s/g, '').toUpperCase(), make: input.make,
        model: input.model, year: input.year ?? null, colour: input.colour ?? null, attributes: input.vehicle_attributes ?? {} },
      icra_office: input.icra_office, icra_file_no: input.icra_file_no, serh_date: input.serh_date,
      legal_basis: input.legal_basis, places: (input.places ?? []).map((p) => ({ id: crypto.randomUUID(), ...p })),
      attributes: input.attributes ?? {}, fee_kurus: 1000000, last_confirmed_at: t, expires_at: t + 14 * 86400,
      delivered_at: null, created_at: existing?.created_at ?? t, updated_at: t, actor,
    };
    cases.set(key, { orgId, ...view });
    return ok(view);
  }
  async getCase(orgId, id) {
    for (const c of cases.values()) if (c.orgId === orgId && c.id === id) return ok(c);
    return fail('not_found');
  }
  async listCases(orgId, query) {
    const all = [...cases.values()].filter((c) => c.orgId === orgId && (!query.status || c.status === query.status));
    return ok({ cases: all.slice(0, query.limit ?? 50), next_cursor: null });
  }
  async counts(orgId) {
    const counts = { pending_identity: 0, active: 0, delivered: 0, withdrawn: 0, expired: 0 };
    for (const c of cases.values()) if (c.orgId === orgId) counts[c.status]++;
    return ok(counts);
  }
  async confirmCases(orgId, actor, ids) { return ok({ confirmed: ids.length }); }
  async withdrawCase(orgId, actor, id, reason) {
    for (const [k, c] of cases) if (c.orgId === orgId && c.id === id) {
      if (c.status === 'withdrawn') return fail('case_closed');
      c.status = 'withdrawn'; return ok(c);
    }
    return fail('not_found');
  }
  async schema(orgId, entity) { return PARTNERS[orgId] ? ok(FIELDS[entity]) : fail('not_a_partner'); }
  async events(orgId, cursor, limit = 100) {
    const mine = events.filter((e) => e.orgId === orgId);
    const start = cursor === null ? 0 : mine.findIndex((e) => e.cursor === cursor) + 1;
    const page = mine.slice(start, start + limit);
    const last = page[page.length - 1];
    return ok({ events: page.map(({ orgId, cursor, ...e }) => e), next_cursor: last ? last.cursor : cursor });
  }
  async testAddEvent(orgId, type, data) {
    const id = crypto.randomUUID();
    const created_at = now();
    events.push({ orgId, id, type, data, created_at, cursor: created_at + '.' + id });
    return id;
  }
  async testReset() { cases.clear(); events.length = 0; }
}
export default { fetch() { return new Response(null, { status: 404 }); } };
`;

export default defineConfig(async () => {
  const migrations = await readD1Migrations('./migrations');
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            SESSION_PEPPER: 'test-session-pepper',
            // 32 zero bytes, base64: test only.
            WEBHOOK_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          },
          workers: [
            { name: 'login', modules: true, compatibilityDate: '2026-11-01', script: LOGIN },
            { name: 'emanet-core', modules: true, compatibilityDate: '2026-11-01', script: CORE },
          ],
        },
      }),
    ],
    test: { setupFiles: ['./test/apply-migrations.ts'] },
  };
});
