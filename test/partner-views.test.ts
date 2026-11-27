import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { reportCsv } from '../src/partner-pages';
import { caseJson, coreHooks, formOf, post, request, signIn } from './helpers';

beforeEach(async () => {
  await coreHooks().testReset();
});

async function savedCase(cookie: string) {
  const saved = await post('/o/org-1/cases/new', cookie, {
    ...formOf(caseJson()),
    address: 'Örnek Sk. 1',
    district: 'Kadıköy',
    city: 'İstanbul',
  });
  return /cases\/([0-9a-f-]{36})/.exec(saved.headers.get('Location') ?? '')?.[1] ?? '';
}

describe('what a partner sees', () => {
  it('shows a case’s timeline, and its custody documents once delivered', async () => {
    const member = await signIn('member-1');
    const id = await savedCase(member);
    const before = await (
      await request(`/o/org-1/cases/${id}`, { headers: { Cookie: member } })
    ).text();
    expect(before).toContain('What happened');
    expect(before).not.toContain('Custody documents');

    await coreHooks().testDeliver('org-1', id);
    await env.EVIDENCE.put('claims/cl-1/doc-1', new Uint8Array([0xff, 0xd8, 0xff]), {
      httpMetadata: { contentType: 'image/jpeg' },
    });
    const after = await (
      await request(`/o/org-1/cases/${id}`, { headers: { Cookie: member } })
    ).text();
    expect(after).toContain('In custody');
    expect(after).toContain('Custodian’s receipt');
    const doc = await request(`/o/org-1/cases/${id}/documents/doc-1`, {
      headers: { Cookie: member },
    });
    expect(doc.status).toBe(200);
    expect(doc.headers.get('Content-Type')).toBe('image/jpeg');
    await doc.arrayBuffer();
    expect(await coreHooks().testViewed()).toContainEqual(['org-1', 'member-1', id, 'doc-1']);
    // Another organization's member gets nothing.
    const other = await signIn('invited-1');
    expect(
      (await request(`/o/org-1/cases/${id}/documents/doc-1`, { headers: { Cookie: other } }))
        .status,
    ).toBe(404);
  });

  it('lists invoices and shows one with its vehicles', async () => {
    const auditor = await signIn('auditor-1');
    const list = await (
      await request('/o/org-1/invoices', { headers: { Cookie: auditor } })
    ).text();
    expect(list).toContain('EMN2026000000001');
    expect(list).toContain('Open:');
    const one = await (
      await request('/o/org-1/invoices/inv-1', { headers: { Cookie: auditor } })
    ).text();
    expect(one).toContain('K-9');
    expect((await request('/o/org-1/invoices/nope', { headers: { Cookie: auditor } })).status).toBe(
      404,
    );
  });

  it('reports by month and city, and as CSV a spreadsheet can’t run', async () => {
    const member = await signIn('member-1');
    const page = await (await request('/o/org-1/reports', { headers: { Cookie: member } })).text();
    expect(page).toContain('Recovery rate');
    expect(page).toContain('50 %');
    expect(page).toContain('İstanbul');
    const csv = await request('/o/org-1/reports.csv', { headers: { Cookie: member } });
    expect(csv.headers.get('Content-Disposition')).toContain('attachment');
    const body = await csv.text();
    expect(body.split('\r\n')[0]).toBe(
      'month,added,delivered,withdrawn,expired,fees_try,days_to_custody',
    );
    expect(body).toContain("'=cmd");
    expect(
      reportCsv({ months: [], open: 0, delivered_total: 0, recovery_rate: null, by_city: [] }),
    ).toBe('month,added,delivered,withdrawn,expired,fees_try,days_to_custody\r\n');
  });

  it('serves invoices and timelines over the API with their scopes', async () => {
    const owner = await signIn('owner-1!aal2');
    const created = await post('/o/org-1/keys', owner, {
      name: 'erp',
      scopes: 'cases:read',
      expires: '90',
    });
    const key = /emk_[A-Za-z0-9_-]+/.exec(await created.text())?.[0] ?? '';
    expect(key).not.toBe('');
    const auth = { Authorization: `Bearer ${key}` };
    expect((await request('/api/v1/invoices', { headers: auth })).status).toBe(403);
    const id = await savedCase(owner);
    const timeline = await request(`/api/v1/cases/${id}/timeline`, { headers: auth });
    expect(await timeline.json()).toEqual([expect.objectContaining({ event: 'created' })]);
    const both = await post('/o/org-1/keys', owner, {
      name: 'fin',
      scopes: ['invoices:read'],
      expires: '90',
    });
    const finance = /emk_[A-Za-z0-9_-]+/.exec(await both.text())?.[0] ?? '';
    const invoices = await request('/api/v1/invoices', {
      headers: { Authorization: `Bearer ${finance}` },
    });
    expect(await invoices.json()).toEqual([expect.objectContaining({ id: 'inv-1' })]);
  });
});

describe('the overview', () => {
  it('helps an empty organization start, and confirms several cases at once', async () => {
    const member = await signIn('member-1');
    const empty = await (await request('/o/org-1', { headers: { Cookie: member } })).text();
    expect(empty).toContain('No vehicles yet');
    expect(empty).toContain('href="/o/org-1/cases/new"');
    const id = await savedCase(member);
    const confirmed = await post('/o/org-1/cases/confirm', member, { case_ids: [id] });
    expect(confirmed.headers.get('Location')).toBe('/o/org-1?confirmed=1');
    expect(
      await (await request('/o/org-1?confirmed=1', { headers: { Cookie: member } })).text(),
    ).toContain('Confirmed one case.');
    const auditor = await signIn('auditor-1');
    expect((await post('/o/org-1/cases/confirm', auditor, { case_ids: [id] })).status).toBe(403);
  });

  it('keeps API keys and webhooks under one section', async () => {
    const owner = await signIn('owner-1');
    const keys = await (await request('/o/org-1/keys', { headers: { Cookie: owner } })).text();
    expect(keys).toContain('aria-label="Integrations"');
    expect(keys).toContain('href="/o/org-1/webhooks"');
    expect(keys).not.toContain('>Webhooks</a>\n        ');
  });
});
