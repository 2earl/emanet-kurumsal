import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import { collectMissing } from '../src/i18n';
import { ORIGIN, caseJson, coreHooks, formOf, post, request, signIn } from './helpers';

/** Every page in Turkish, and nothing left in English (src/locales/tr.ts). */

const tr = { 'Accept-Language': 'tr-TR,tr;q=0.9' };

describe('Turkish', () => {
  let member = '';
  let owner = '';
  let caseId = '';

  beforeAll(async () => {
    member = await signIn('member-1');
    owner = await signIn('owner-1!aal2');
    const saved = await post('/o/org-1/cases/new', member, {
      ...formOf(caseJson({ external_ref: 'TR-1' })),
      address: 'Örnek Sk. 1',
      district: 'Kadıköy',
      city: 'İstanbul',
    });
    caseId = /cases\/([0-9a-f-]{36})/.exec(saved.headers.get('Location') ?? '')?.[1] ?? '';
  });

  it('serves every page without an untranslated sentence', async () => {
    const missing = collectMissing();
    const pages: [string, string][] = [
      ['/', ''],
      ['/docs/api', ''],
      ['/', await signIn('outsider')],
      ['/o/org-1', member],
      ['/o/org-1/cases', member],
      ['/o/org-1/cases?status=delivered', member],
      ['/o/org-1/cases?q=nothing', member],
      ['/o/org-1/cases?status=withdrawn', member],
      ['/o/org-1/cases/new', member],
      [`/o/org-1/cases/${caseId}`, member],
      [`/o/org-1/cases/${caseId}?saved=1`, member],
      ['/o/org-1/upload', member],
      ['/o/org-1/keys', owner],
      ['/o/org-1/keys', await signIn('owner-1')],
      ['/o/org-1/webhooks', await signIn('owner-1')],
      ['/o/org-1/cases/new', await signIn('auditor-1')],
      ['/o/org-3', await signIn('invited-1')],
      ['/o/org-1/webhooks', owner],
      ['/o/org-2', member],
      ['/nope', ''],
    ];
    for (const [path, cookie] of pages) {
      const response = await request(path, {
        headers: { ...tr, ...(cookie ? { Cookie: cookie } : {}) },
      });
      expect(response.headers.get('Content-Language')).toBe('tr');
    }
    // Pages that only appear after an action.
    await post('/o/org-1/keys', owner, { name: 'x', scopes: 'cases:read', expires: 'never' }).then(
      (r) => r.text(),
    );
    const keyCreated = await request('/o/org-1/keys', {
      method: 'POST',
      headers: {
        ...tr,
        Cookie: owner,
        Origin: ORIGIN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'name=y&scopes=cases%3Aread&expires=90',
    });
    await keyCreated.text();
    const hookCreated = await request('/o/org-1/webhooks', {
      method: 'POST',
      headers: {
        ...tr,
        Cookie: owner,
        Origin: ORIGIN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'url=https%3A%2F%2Fbank.example%2Fh&events=case.delivered',
    });
    await hookCreated.text();
    const badForm = await request('/o/org-1/cases/new', {
      method: 'POST',
      headers: {
        ...tr,
        Cookie: member,
        Origin: ORIGIN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'plate=x&external_ref=z&make=a&model=b&icra_office=o&icra_file_no=1&serh_date=2026-01-01&legal_basis=rehin',
    });
    await badForm.text();
    const body = new FormData();
    body.append('file', new File(['plaka,foo\n34ABC123,1\n'], 'x.csv'));
    await (
      await request('/o/org-1/upload', {
        method: 'POST',
        headers: { ...tr, Cookie: member, Origin: ORIGIN },
        body,
      })
    ).text();
    const good = new FormData();
    good.append(
      'file',
      new File(
        [
          'external_ref,plate,make,model,icra_office,icra_file_no,serh_date,legal_basis\nQ,34ABC123,R,C,O,1,2026-01-01,rehin\n',
        ],
        'y.csv',
      ),
    );
    await (
      await request('/o/org-1/upload', {
        method: 'POST',
        headers: { ...tr, Cookie: member, Origin: ORIGIN },
        body: good,
      })
    ).text();
    // A case without a VIN or places, withdrawn; an import with a failure; a failing webhook.
    const bare = await post('/o/org-1/cases/new', member, {
      ...formOf(caseJson({ external_ref: 'TR-2', vin: '' })),
    });
    const bareId = /cases\/([0-9a-f-]{36})/.exec(bare.headers.get('Location') ?? '')?.[1] ?? '';
    await (
      await request(`/o/org-1/cases/${bareId}`, { headers: { ...tr, Cookie: member } })
    ).text();
    await post(`/o/org-1/cases/${bareId}/withdraw`, member, { reason: 'Ödendi' });
    await (
      await request(`/o/org-1/cases/${bareId}?withdrawn=1`, { headers: { ...tr, Cookie: member } })
    ).text();
    await (
      await request(`/o/org-1/cases/${caseId}?confirmed=1`, { headers: { ...tr, Cookie: member } })
    ).text();
    const mixed = new FormData();
    mixed.append(
      'file',
      new File(
        [
          'external_ref,plate,make,model,icra_office,icra_file_no,serh_date,legal_basis,case.portfolio\nM1,34ABC123,R,C,O,1,2026-01-01,rehin,A\n',
        ],
        'z.csv',
      ),
    );
    const checked = await (
      await request('/o/org-1/upload', {
        method: 'POST',
        headers: { ...tr, Cookie: member, Origin: ORIGIN },
        body: mixed,
      })
    ).text();
    const uploadId = /upload\/([0-9a-f-]{36})/.exec(checked)?.[1] ?? '';
    await (
      await request(`/o/org-1/upload/${uploadId}`, {
        method: 'POST',
        headers: { ...tr, Cookie: member, Origin: ORIGIN },
      })
    ).text();
    await env.DB.prepare(`UPDATE webhooks SET disabled_at = 1`).run();
    await env.DB.prepare(
      `INSERT INTO deliveries (id, webhook_id, event_id, event_type, payload, status, attempts, last_status, next_attempt_at, created_at)
       SELECT ?, id, 'e1', 'case.delivered', '{}', 'failed', 7, 503, 0, 1 FROM webhooks LIMIT 1`,
    )
      .bind(crypto.randomUUID())
      .run();
    await (await request('/o/org-1/webhooks', { headers: { ...tr, Cookie: owner } })).text();
    expect([...missing].sort()).toEqual([]);
  });

  it('serves the onboarding pages without an untranslated sentence', async () => {
    const missing = collectMissing();
    const get = async (path: string, cookie = '') =>
      (await request(path, { headers: { ...tr, ...(cookie ? { Cookie: cookie } : {}) } })).text();
    const send = async (path: string, cookie: string, form: Record<string, string>) =>
      (
        await request(path, {
          method: 'POST',
          headers: {
            ...tr,
            Cookie: cookie,
            Origin: ORIGIN,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(form),
        })
      ).text();
    const { id, token } = await coreHooks().testInvite('ops@bank.example');
    const joiner = await signIn('joiner-1');
    const other = await signIn('joiner-2');
    await get(`/join/${token}`);
    await get(`/join/${token}`, other);
    await get(`/join/${token}`, joiner);
    await get('/join/nope');
    await send(`/join/${token}`, joiner, {});
    await get(`/join/${token}`, other);
    await get(`/onboarding/${id}`, joiner);
    await get(`/onboarding/${id}/org`, joiner);
    await send(`/onboarding/${id}/org`, joiner, { mode: 'existing', org: 'org-1' });
    await send(`/onboarding/${id}/org`, joiner, { mode: 'new', name: 'Örnek Bank' });
    await get(`/onboarding/${id}/org`, joiner);
    await get(`/onboarding/${id}/details`, joiner);
    for (const vkn of ['12', '1234567890']) {
      await send(`/onboarding/${id}/details`, joiner, {
        legalName: 'Örnek Bank A.Ş.',
        address: 'Büyükdere Cad. No: 1, İstanbul',
        taxOffice: 'Şişli',
        vkn,
        signatoryName: 'Mehmet Demir',
        signatoryTitle: 'GMY',
        billingEmail: 'f@bank.example',
        operationsName: 'Ayşe Yılmaz',
        operationsEmail: 'ops@bank.example',
        operationsPhone: '+902125550000',
      });
    }
    await get(`/onboarding/${id}/documents`, joiner);
    const bad = new FormData();
    bad.append('kind', 'tax_certificate');
    bad.append('file', new File(['nope'], 'x.pdf'));
    await (
      await request(`/onboarding/${id}/documents`, {
        method: 'POST',
        headers: { ...tr, Cookie: joiner, Origin: ORIGIN },
        body: bad,
      })
    ).text();
    for (const kind of ['signature_circular', 'tax_certificate']) {
      const good = new FormData();
      good.append('kind', kind);
      good.append('file', new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'x.pdf'));
      await (
        await request(`/onboarding/${id}/documents`, {
          method: 'POST',
          headers: { ...tr, Cookie: joiner, Origin: ORIGIN },
          body: good,
        })
      ).text();
    }
    await get(`/onboarding/${id}/documents`, joiner);
    await get(`/onboarding/${id}/agreement`, joiner);
    const aal2 = await signIn('joiner-1!aal2');
    await coreHooks().testDraftOnly(true);
    await get(`/onboarding/${id}/agreement`, aal2);
    await send(`/onboarding/${id}/agreement`, aal2, {
      version: 'v',
      sha256: 'x',
      name: 'Mehmet Demir',
      title: 'GMY',
      authorised: '1',
      accept: '1',
    });
    await coreHooks().testDraftOnly(false);
    const form = await get(`/onboarding/${id}/agreement`, aal2);
    const version = /name="version" value="([^"]+)"/.exec(form)?.[1] ?? '';
    const sha256 = /name="sha256" value="([^"]+)"/.exec(form)?.[1] ?? '';
    await send(`/onboarding/${id}/agreement`, aal2, {
      version,
      sha256: 'x',
      name: 'Mehmet Demir',
      title: 'GMY',
      authorised: '1',
      accept: '1',
    });
    await send(`/onboarding/${id}/agreement`, aal2, {
      version,
      sha256,
      name: 'Mehmet Demir',
      title: 'GMY',
      authorised: '1',
      accept: '1',
    });
    await get(`/onboarding/${id}?signed=1`, aal2);
    await get(`/onboarding/${id}/agreement`, aal2);
    await get(`/onboarding/${id}/documents`, aal2);
    await get(`/onboarding/${id}/details`, aal2);
    await get(`/onboarding/${id}/org`, aal2);
    await get(`/onboarding/${id}`, other);
    const second = await coreHooks().testInvite('ops@bank.example');
    await send(`/join/${second.token}`, joiner, {});
    await get('/onboarding', joiner);
    // Invoices, reports and a delivered case's documents.
    const member = await signIn('member-1');
    await get('/o/org-1/invoices', member);
    await get('/o/org-1/invoices/inv-1', member);
    await get('/o/org-1/invoices/nope', member);
    await get('/o/org-1/support', member);
    await get('/o/org-1/support/new', member);
    await send('/o/org-1/support/new', member, { subject: 'x', category: 'invoice', message: 'y' });
    await get('/o/org-1/reports', member);
    await send('/o/org-1/cases/new', member, {
      external_ref: 'TR-DOC',
      vin: 'VF1RJA00061234567',
      plate: '34 ABC 123',
      make: 'Renault',
      model: 'Clio',
      icra_office: 'O',
      icra_file_no: '1',
      serh_date: '2026-01-01',
      legal_basis: 'rehin',
    });
    const listed = await get('/o/org-1/cases', member);
    const caseId = /cases\/([0-9a-f-]{36})/.exec(listed)?.[1] ?? '';
    await coreHooks().testDeliver('org-1', caseId);
    await get(`/o/org-1/cases/${caseId}`, member);
    await get(`/o/org-1/cases/${caseId}/documents/nope`, member);

    expect([...missing].sort()).toEqual([]);
  });
});
