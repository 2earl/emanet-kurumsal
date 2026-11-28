import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { ORIGIN, coreHooks, post, request, signIn } from './helpers';

beforeEach(async () => {
  await coreHooks().testReset();
});

describe('pages', () => {
  it('shows the start page signed out, with strict headers and no indexing', async () => {
    const response = await request('/');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Find vehicles that carry your seizure orders.');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(await (await request('/robots.txt')).text()).toContain('Disallow: /');
  });

  it('publishes its client metadata for login', async () => {
    const metadata = await (
      await request('/oauth/client.json')
    ).json<{ client_id: string; scope: string }>();
    expect(metadata).toMatchObject({
      client_id: `${ORIGIN}/oauth/client.json`,
      scope: 'emanet:partner',
    });
  });

  it('sends a member of one partner straight to its overview, others to a list', async () => {
    const member = await signIn('member-1');
    const home = await request('/', { headers: { Cookie: member } });
    expect(home.status).toBe(302);
    expect(home.headers.get('Location')).toBe('/o/org-1');

    // org-2 is not a partner: only org-1 is offered, so the owner goes straight there too.
    const owner = await signIn('owner-1');
    expect((await request('/', { headers: { Cookie: owner } })).headers.get('Location')).toBe(
      '/o/org-1',
    );

    const outsider = await signIn('outsider');
    expect(await (await request('/', { headers: { Cookie: outsider } })).text()).toContain(
      'No organization yet',
    );
  });

  it('keeps people out of organizations they are not in, or that are not active', async () => {
    const member = await signIn('member-1');
    expect((await request('/o/org-2', { headers: { Cookie: member } })).status).toBe(404);
    const invited = await signIn('invited-1');
    expect((await request('/o/org-3', { headers: { Cookie: invited } })).status).toBe(403);
    expect((await request('/o/org-1')).status).toBe(302);
  });

  it('adds a vehicle through the form, with a custom field and a Turkish date', async () => {
    const member = await signIn('member-1');
    const form = await request('/o/org-1/cases/new', { headers: { Cookie: member } });
    const page = await form.text();
    expect(page).toContain('name="case.portfolio"');
    // The city from core's list of provinces, the district offered from the districts.
    expect(page).toContain('<option value="İstanbul" translate="no">İstanbul</option>');
    expect(page).toContain('<datalist id="districts">');
    const saved = await post('/o/org-1/cases/new', member, {
      plate: '34 abc 123',
      vin: 'VF1RJA00061234567',
      make: 'Renault',
      model: 'Clio',
      year: '2021',
      external_ref: 'K-1',
      icra_office: 'İstanbul 5. İcra Dairesi',
      icra_file_no: '2026/1',
      serh_date: '01.10.2026',
      legal_basis: 'haciz',
      place_kind: 'work',
      address: 'İş Merkezi',
      district: 'Şişli',
      city: 'İstanbul',
      'case.portfolio': 'B',
    });
    expect(saved.status).toBe(303);
    const detail = await request(saved.headers.get('Location') ?? '', {
      headers: { Cookie: member },
    });
    const html = await detail.text();
    expect(html).toContain('34 ABC 123');
    expect(html).toContain('Attachment (haciz)');
    expect(html).toContain('2026-10-01');
    expect(html).toContain('İş Merkezi');
    // The custom field by its label, not its key.
    expect(html).toContain('Portfolio');
    const turkish = await (
      await request(`${saved.headers.get('Location') ?? ''}&lang=tr`, {
        headers: { Cookie: member },
      })
    ).text();
    expect(turkish).toContain('Portföy');
    expect(turkish).toContain('₺10.000,00');

    const bad = await post('/o/org-1/cases/new', member, {
      plate: 'nope',
      external_ref: 'K-2',
      make: 'a',
      model: 'b',
      icra_office: 'x',
      icra_file_no: 'y',
      serh_date: '2026-10-01',
      legal_basis: 'rehin',
    });
    expect(bad.status).toBe(422);
    expect(await bad.text()).toContain('isn’t a Turkish plate');

    const nowhere = await post('/o/org-1/cases/new', member, {
      plate: '34 abc 124',
      vin: 'VF1RJA00061234568',
      make: 'Renault',
      model: 'Clio',
      external_ref: 'K-3',
      icra_office: 'İstanbul 5. İcra Dairesi',
      icra_file_no: '2026/2',
      serh_date: '2026-10-01',
      legal_basis: 'rehin',
      place_kind: 'work',
      address: 'İş Merkezi',
      district: 'Merkez',
      city: 'İstanbul',
    });
    expect(nowhere.status).toBe(422);
    const again = await nowhere.text();
    expect(again).toContain('That district isn’t in the chosen province.');
    // The chosen city stays chosen, and only its districts are offered.
    expect(again).toContain('<option value="İstanbul" selected translate="no">');
    expect(again).toContain('<option value="Kadıköy">');
    expect(again).not.toContain('<option value="Çankaya">');
  });

  it('lets auditors read but not write', async () => {
    const auditor = await signIn('auditor-1');
    expect((await request('/o/org-1/cases', { headers: { Cookie: auditor } })).status).toBe(200);
    expect((await request('/o/org-1/cases/new', { headers: { Cookie: auditor } })).status).toBe(
      403,
    );
    expect((await request('/o/org-1/keys', { headers: { Cookie: auditor } })).status).toBe(403);
  });

  it('follows what login says the person may do, not the role alone', async () => {
    // An organization gave this auditor a role with integrations (login "Roles in apps").
    const authz = env.AUTHZ as unknown as {
      testGive(uid: string, orgId: string, permissions: string[]): Promise<void>;
    };
    await authz.testGive('auditor-1', 'org-1', ['emanet:integrations.manage']);
    const auditor = await signIn('auditor-1');
    expect((await request('/o/org-1/keys', { headers: { Cookie: auditor } })).status).toBe(200);
    expect((await request('/o/org-1/cases/new', { headers: { Cookie: auditor } })).status).toBe(
      403,
    );
    await authz.testGive('auditor-1', 'org-1', []);
    expect((await request('/o/org-1/keys', { headers: { Cookie: auditor } })).status).toBe(403);
  });

  it('refuses forms from other sites', async () => {
    const member = await signIn('member-1');
    const response = await request('/o/org-1/cases/new', {
      method: 'POST',
      headers: {
        Cookie: member,
        Origin: 'https://evil.example',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'plate=34ABC123',
    });
    expect(response.status).toBe(403);
  });

  it('checks a CSV, then imports it once', async () => {
    const member = await signIn('member-1');
    const csv = [
      'referans;plaka;sasi_no;marka;model;icra_dairesi;dosya_no;serh_tarihi;dayanak;yer_turu;adres;ilce;il;case.portfolio',
      'R-1;34 ABC 123;VF1RJA00061234567;Renault;Clio;İstanbul 1. İcra;2026/1;01.10.2026;rehin;ev;A Sk. 1;Kadıköy;İstanbul;A',
      'R-1;;;;;;;;;iş;B Cd. 2;Şişli;İstanbul;',
      'R-2;06 AB 1234;;Fiat;Egea;Ankara 2. İcra;2026/2;2026-09-15;haciz;;;;;',
    ].join('\n');
    const body = new FormData();
    body.append('file', new File([csv], 'cases.csv', { type: 'text/csv' }));
    const checked = await request('/o/org-1/upload', {
      method: 'POST',
      headers: { Cookie: member, Origin: ORIGIN },
      body,
    });
    const html = await checked.text();
    expect(checked.status).toBe(200);
    expect(html).toContain('The file is ready');
    const uploadId = /action="\/o\/org-1\/upload\/([0-9a-f-]{36})"/.exec(html)?.[1] ?? '';
    const imported = await post(`/o/org-1/upload/${uploadId}`, member, {});
    expect(await imported.text()).toContain('Imported <span translate="no">2</span> cases.');
    expect((await post(`/o/org-1/upload/${uploadId}`, member, {})).status).toBe(410);

    const list = await (await request('/o/org-1/cases', { headers: { Cookie: member } })).text();
    expect(list).toContain('34 ABC 123');
    expect(list).toContain('06 AB 1234');
    expect(list).toContain('Most recently changed first.');

    const found = await (
      await request('/o/org-1/cases?q=34%20abc%20123', { headers: { Cookie: member } })
    ).text();
    expect(found).toContain('34 ABC 123');
    expect(found).not.toContain('06 AB 1234');
    expect(found).toContain('value="34 abc 123"');
    const none = await (
      await request('/o/org-1/cases?q=nothing', { headers: { Cookie: member } })
    ).text();
    expect(none).toContain('No case matches.');
    const none2 = await (
      await request('/o/org-1/cases?status=withdrawn', { headers: { Cookie: member } })
    ).text();
    expect(none2).toContain('No cases with this status.');

    expect(list).toContain('href="/o/org-1/cases.csv"');
    expect(found).toContain('href="/o/org-1/cases.csv?q=34%20abc%20123"');
    const file = await request('/o/org-1/cases.csv?q=34%20abc%20123', {
      headers: { Cookie: member },
    });
    expect(file.headers.get('Content-Disposition')).toContain('emanet-cases.csv');
    const lines = (await file.text()).trim().split('\r\n');
    expect(lines[0]).toContain('your_reference,plate,chassis_number');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('R-1,34ABC123,VF1RJA00061234567,Renault,Clio');
    expect((await request('/o/org-1/cases.csv')).status).toBe(302);
  });

  it('reports CSV problems by row and imports nothing', async () => {
    const member = await signIn('member-1');
    const body = new FormData();
    body.append(
      'file',
      new File(
        ['referans,plaka,serh_tarihi,dayanak,renkk\nR-9,34ABC123,yesterday,rehin,x\n'],
        'bad.csv',
      ),
    );
    const checked = await request('/o/org-1/upload', {
      method: 'POST',
      headers: { Cookie: member, Origin: ORIGIN },
      body,
    });
    expect(checked.status).toBe(422);
    expect(await checked.text()).toContain('Unknown column “renkk”');
  });
});

describe('API keys', () => {
  it('needs an owner or admin with a fresh second factor, and shows the key once', async () => {
    const owner = await signIn('owner-1');
    expect(await (await request('/o/org-1/keys', { headers: { Cookie: owner } })).text()).toContain(
      'Verify it now',
    );
    expect((await post('/o/org-1/keys', owner, { name: 'x', scopes: 'cases:read' })).status).toBe(
      303,
    );

    const fresh = await signIn('owner-1!aal2');
    const created = await post('/o/org-1/keys', fresh, {
      name: 'Core banking',
      scopes: ['cases:read', 'cases:write'],
      expires: '90',
    });
    const html = await created.text();
    const key = /emk_[A-Za-z0-9_-]{8}_[A-Za-z0-9_-]{43}/.exec(html)?.[0] ?? '';
    expect(key).not.toBe('');
    // Who made it is in the core's audit log.
    expect((await coreHooks().testIntegrations()).at(-1)?.slice(0, 3)).toEqual([
      'org-1',
      'owner-1',
      'key_created',
    ]);
    const stored = await env.DB.prepare('SELECT hash FROM api_keys WHERE name = ?')
      .bind('Core banking')
      .first<{ hash: string }>();
    expect(stored?.hash).not.toContain(key.slice(13));
    expect(
      await (await request('/o/org-1/keys', { headers: { Cookie: fresh } })).text(),
    ).not.toContain(key);
  });
});
