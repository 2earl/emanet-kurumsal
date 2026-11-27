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
// Accounts joining Emanet, by the address they sign in with; organizations created for them.
const ADDRESSES = { 'joiner-1': 'ops@bank.example', 'joiner-2': 'ops2@bank.example', 'owner-1': 'owner@bank.example' };
const created = [];
const members = (uid) => [...(MEMBERS[base(uid)] ?? []), ...created.filter(([u]) => u === base(uid)).map(([, o, n]) => [o, n, 'owner'])];
export class OrganizationDirectory extends WorkerEntrypoint {
  async membershipsOf(uid) {
    return members(uid).map(([orgId, name, role]) => ({ orgId, name, role }));
  }
  async roleOf(orgId, uid) {
    return members(uid).find(([o]) => o === orgId)?.[2] ?? null;
  }
}
export class OrganizationProvisioning extends WorkerEntrypoint {
  async hasAddress(uid, email) { return ADDRESSES[base(uid)] === email.toLowerCase(); }
  async create(r) {
    if (ADDRESSES[base(r.ownerId)] !== r.email) return { ok: false, reason: 'wrong_address' };
    if (r.invitedBy !== 'staff-1') return { ok: false, reason: 'not_staff' };
    if (!r.name.trim()) return { ok: false, reason: 'invalid_name' };
    const orgId = 'org_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    created.push([base(r.ownerId), orgId, r.name.trim()]);
    return { ok: true, orgId };
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
const viewed = [];
const INVOICE = { id: 'inv-1', number: 'EMN2026000000001', issued_at: Math.floor(Date.now() / 1000) - 86400, net_kurus: 1000000,
  kdv_kurus: 200000, total_kurus: 1200000, paid_kurus: 0, status: 'issued', cases: 1 };
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

  // Timelines, custody documents, invoices and the report.
  async testDeliver(orgId, caseId) {
    for (const c of cases.values()) if (c.orgId === orgId && c.id === caseId) {
      c.status = 'delivered'; c.delivered_at = now();
      c.documents = [{ id: 'doc-1', kind: 'yediemin_receipt', sha256: 'ab'.repeat(32), taken_at: now() - 3600, created_at: now() - 3000, file_ref: 'claims/cl-1/doc-1' }];
    }
  }
  async caseTimeline(orgId, caseId) {
    for (const c of cases.values()) if (c.orgId === orgId && c.id === caseId) {
      return ok([{ event: 'created', at: c.created_at }, ...(c.status === 'delivered' ? [{ event: 'delivered', at: c.delivered_at }] : [])]);
    }
    return fail('not_found');
  }
  async caseDocuments(orgId, caseId) {
    for (const c of cases.values()) if (c.orgId === orgId && c.id === caseId) return ok((c.documents ?? []).map(({ file_ref, ...d }) => d));
    return ok([]);
  }
  async caseDocument(orgId, actor, caseId, documentId) {
    for (const c of cases.values()) if (c.orgId === orgId && c.id === caseId) {
      const d = (c.documents ?? []).find((x) => x.id === documentId);
      if (d) { viewed.push([orgId, actor, caseId, documentId]); return ok({ file_ref: d.file_ref, kind: d.kind }); }
    }
    return fail('not_found');
  }
  async testViewed() { return viewed; }
  async invoices(orgId) {
    if (!PARTNERS[orgId]) return fail('not_a_partner');
    return ok(orgId === 'org-1' ? [INVOICE] : []);
  }
  async invoice(orgId, id) {
    if (orgId !== 'org-1' || id !== INVOICE.id) return fail('not_found');
    return ok({ ...INVOICE, lines: [{ case_id: 'c-x', external_ref: 'K-9', plate: '34ABC123', delivered_at: now() - 86400, net_kurus: 1000000, kdv_kurus: 200000 }] });
  }
  async report(orgId) {
    if (!PARTNERS[orgId]) return fail('not_a_partner');
    return ok({ open: 3, delivered_total: 1, recovery_rate: 0.5,
      months: [{ month: '2026-11', added: 4, delivered: 1, withdrawn: 1, expired: 0, fees_kurus: 1000000, days_to_custody: 2.5 },
               { month: '=cmd', added: 0, delivered: 0, withdrawn: 0, expired: 0, fees_kurus: 0, days_to_custody: null }],
      by_city: [{ city: 'İstanbul', open: 3, delivered: 1 }] });
  }

  // Onboarding, as src/core.ts describes it; a token is 43 characters.
  async testDraftOnly(value) { draftOnly = value; }
  async testInvite(email) {
    const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '').slice(0, 43);
    const id = crypto.randomUUID();
    onboardings.set(id, { id, token, kind: 'bank', company: 'Örnek Bank', contact_name: 'Ayşe Yılmaz',
      contact_email: email, locale: 'tr', price_list: { default_kurus: 1500000, rules: [{ make: 'Ford', fee_kurus: 2000000 }] },
      reconfirm_days: 14, status: 'invited', invited_by: 'staff-1', expires_at: now() + 14 * 86400,
      claimed_by: null, org_id: null, details: null, contract_version: null, contract_sha256: null,
      contract_text: null, signer_name: null, signer_title: null, signed_at: null, decision_reason: null,
      partner_id: null, documents: [] });
    return { id, token };
  }
  async onboardingInvitation(token) {
    const o = [...onboardings.values()].find((x) => x.token === token);
    if (!o || ['approved', 'rejected', 'cancelled', 'expired'].includes(o.status)) return fail('not_found');
    const { id, company, contact_name, contact_email, locale, invited_by, status, expires_at, claimed_by } = o;
    return ok({ id, company, contact_name, contact_email, locale, invited_by, status, expires_at, claimed_by });
  }
  async claimOnboarding(token, uid) {
    const o = [...onboardings.values()].find((x) => x.token === token);
    if (!o) return fail('not_found');
    if (o.claimed_by && o.claimed_by !== uid) return fail('claimed_by_another');
    o.claimed_by = uid; if (o.status === 'invited') o.status = 'in_progress';
    return ok({ id: o.id });
  }
  async myOnboardings(uid) {
    return ok([...onboardings.values()].filter((o) => o.claimed_by === uid).map(({ token, ...o }) => o));
  }
  async onboarding(id, uid) {
    const o = onboardings.get(id);
    if (!o || o.claimed_by !== uid) return fail('not_found');
    const { token, ...rest } = o;
    return ok(rest);
  }
  async linkOnboardingOrganization(id, uid, orgId) {
    const o = onboardings.get(id);
    if (!o || o.claimed_by !== uid) return fail('not_found');
    if (o.status !== 'in_progress') return fail('not_editable');
    if (PARTNERS[orgId]) return fail('partner_exists');
    o.org_id = orgId; return ok(null);
  }
  async saveOnboardingDetails(id, uid, d) {
    const o = onboardings.get(id);
    if (!o || o.claimed_by !== uid) return fail('not_found');
    if (o.status !== 'in_progress') return fail('not_editable');
    if (!/^\\d{10,11}$/.test(d.vkn)) return fail('invalid_details', 'vkn');
    o.details = { ...d, mersis: d.mersis || null, kep: d.kep || null }; return ok(o.details);
  }
  async addOnboardingDocument(id, uid, doc) {
    const o = onboardings.get(id);
    if (!o || o.claimed_by !== uid) return fail('not_found');
    if (!doc.file_ref.startsWith('onboarding/' + id + '/')) return fail('invalid_ref');
    const d = { id: crypto.randomUUID(), uploaded_at: now(), ...doc };
    o.documents.push(d); return ok({ id: d.id });
  }
  async onboardingContract(id, uid) {
    const o = onboardings.get(id);
    if (!o || o.claimed_by !== uid) return fail('not_found');
    if (!o.details) return fail('details_missing');
    const text = 'EMANET HİZMET SÖZLEŞMESİ\\n\\n' + o.details.legalName + ' ' + o.details.vkn;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return ok({ version: '2026-11-27-draft', sha256, text, final: !draftOnly,
      sections: [{ title: 'EMANET HİZMET SÖZLEŞMESİ', paragraphs: [o.details.legalName + ' ' + o.details.vkn] }] });
  }
  async signOnboarding(id, uid, input) {
    const o = onboardings.get(id);
    if (!o || o.claimed_by !== uid) return fail('not_found');
    if (!o.org_id) return fail('org_missing');
    if (!input.authorised) return fail('not_authorised');
    const c = await this.onboardingContract(id, uid);
    if (!c.ok) return c;
    if (!c.value.final) return fail('provider_incomplete');
    if (input.version !== c.value.version || input.sha256 !== c.value.sha256) return fail('contract_changed');
    Object.assign(o, { status: 'signed', contract_version: c.value.version, contract_sha256: c.value.sha256,
      contract_text: c.value.text, signer_name: input.name, signer_title: input.title, signed_at: now(), signer_ip: input.ip });
    return ok(null);
  }
}
const onboardings = new Map();
let draftOnly = false;
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
