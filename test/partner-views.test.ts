import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { reportCsv } from '../src/partner-pages';
import { ORIGIN, caseJson, coreHooks, formOf, post, request, signIn } from './helpers';

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
    expect(list).toContain('To pay');
    const one = await (
      await request('/o/org-1/invoices/inv-1', { headers: { Cookie: auditor } })
    ).text();
    expect(one).toContain('K-9');
    expect((await request('/o/org-1/invoices/nope', { headers: { Cookie: auditor } })).status).toBe(
      404,
    );
  });

  it('downloads invoices and their vehicles as CSV', async () => {
    const auditor = await signIn('auditor-1');
    const list = await request('/o/org-1/invoices.csv', { headers: { Cookie: auditor } });
    expect(list.headers.get('Content-Disposition')).toContain('attachment');
    const rows = (await list.text()).trim().split('\r\n');
    expect(rows[0]).toBe('number,issued,vehicles,net_try,vat_try,total_try,paid_try,status');
    expect(rows[1]).toContain('EMN2026000000001');
    const lines = await request('/o/org-1/invoices/inv-1/lines.csv', {
      headers: { Cookie: auditor },
    });
    expect(await lines.text()).toContain('34ABC123,K-9');
    expect(
      (await request('/o/org-1/invoices/nope/lines.csv', { headers: { Cookie: auditor } })).status,
    ).toBe(404);
    expect((await request('/o/org-1/invoices.csv')).status).toBe(302);
    const page = await (
      await request('/o/org-1/invoices/inv-1', { headers: { Cookie: auditor } })
    ).text();
    expect(page).toContain('e-invoice (e-Fatura)');
    expect(page).not.toContain('Ask about this invoice');
    const member = await signIn('member-1');
    const asked = await (
      await request('/o/org-1/invoices/inv-1', { headers: { Cookie: member } })
    ).text();
    expect(asked).toContain('/support/new?category=invoice&amp;about=EMN2026000000001');
    const form = await (
      await request('/o/org-1/support/new?category=invoice&about=EMN2026000000001', {
        headers: { Cookie: member },
      })
    ).text();
    expect(form).toContain('value="EMN2026000000001"');
    expect(form).toContain('3 in 4 questions got a first answer within 3 days');
  });

  it('lets a company write to support; an auditor only reads', async () => {
    const member = await signIn('member-1');
    expect(
      await (await request('/o/org-1/support', { headers: { Cookie: member } })).text(),
    ).toContain('No messages yet.');
    const bad = await post('/o/org-1/support/new', member, {
      subject: 'x',
      category: 'invoice',
      message: 'Where is it?',
    });
    expect(bad.status).toBe(422);
    const sent = await post('/o/org-1/support/new', member, {
      subject: 'Invoice question',
      category: 'invoice',
      message: 'Where is the e-invoice?',
    });
    expect(sent.status).toBe(303);
    const where = (sent.headers.get('Location') ?? '').split('?')[0] ?? '';
    expect(sent.headers.get('Location')).toMatch(/\/support\/tk-\d+\?done=ticket_sent$/);
    await coreHooks().testStaffReply(where.split('/').pop() ?? '', 'It is on its way.');
    const banner = await (
      await request('/o/org-1/invoices', { headers: { Cookie: member } })
    ).text();
    expect(banner).toContain('2earl answered your message');
    const thread = await (await request(where, { headers: { Cookie: member } })).text();
    expect(thread).toContain('It is on its way.');
    expect(thread).toContain('2earl answered');
    // Did it help: one click, changeable; an auditor can't mark it.
    expect(thread).toContain('Did our answer help?');
    const rated = await post(`${where}/rate`, member, { helped: '1' });
    expect(rated.headers.get('Location')).toBe(`${where}?done=ticket_rated`);
    expect(await (await request(where, { headers: { Cookie: member } })).text()).toContain(
      'You said it helped.',
    );
    expect((await post(`${where}/rate`, await signIn('auditor-1'), { helped: '0' })).status).toBe(
      403,
    );
    const reply = await post(`${where}/reply`, member, { message: 'Thanks' });
    expect(reply.headers.get('Location')).toBe(`${where}?done=ticket_replied`);

    const auditor = await signIn('auditor-1');
    expect((await request(where, { headers: { Cookie: auditor } })).status).toBe(200);
    expect((await post(`${where}/reply`, auditor, { message: 'Hello there' })).status).toBe(403);
    expect((await request('/o/org-1/support/new', { headers: { Cookie: auditor } })).status).toBe(
      403,
    );
    const closed = await post(`${where}/close`, member, {});
    expect(closed.headers.get('Location')).toBe('/o/org-1/support?done=ticket_closed');
    expect((await request('/o/org-1/support/nope', { headers: { Cookie: member } })).status).toBe(
      404,
    );
  });

  it('attaches a picture to a support message and serves it sandboxed to the company only', async () => {
    const member = await signIn('member-1');
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
    const form = new FormData();
    form.set('subject', 'Ekran görüntüsü');
    form.set('category', 'integration');
    form.set('message', 'Hata ekte.');
    form.append('files', new File([png], 'hata.png', { type: 'image/png' }));
    const sent = await request('/o/org-1/support/new', {
      method: 'POST',
      headers: { Cookie: member, Origin: ORIGIN },
      body: form,
    });
    expect(sent.status).toBe(303);
    const where = (sent.headers.get('Location') ?? '').split('?')[0] ?? '';
    const page = await (await request(where, { headers: { Cookie: member } })).text();
    const link = /<img src="([^"]+)"/.exec(page)?.[1] ?? '';
    expect(link).toMatch(/\/files\//);
    const file = await request(link, { headers: { Cookie: member } });
    expect(file.headers.get('Content-Type')).toBe('image/png');
    expect(file.headers.get('Content-Security-Policy')).toContain('sandbox');
    const outsider = await signIn('owner-1!aal2');
    expect(
      (await request(link.replace('/o/org-1/', '/o/org-2/'), { headers: { Cookie: outsider } }))
        .status,
    ).not.toBe(200);
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
