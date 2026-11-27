import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { maskEmail } from '../src/onboarding-pages';
import { sniff } from '../src/onboarding';
import { ORIGIN, coreHooks, post, request, signIn } from './helpers';

const DETAILS = {
  legalName: 'Örnek Bank A.Ş.',
  address: 'Büyükdere Cad. No: 1, Şişli, İstanbul',
  taxOffice: 'Büyük Mükellefler',
  vkn: '1234567890',
  mersis: '',
  kep: '',
  signatoryName: 'Mehmet Demir',
  signatoryTitle: 'Genel Müdür Yardımcısı',
  billingEmail: 'fatura@bank.example',
  operationsName: 'Ayşe Yılmaz',
  operationsEmail: 'ops@bank.example',
  operationsPhone: '+90 212 555 00 00',
  eInvoice: '1',
};

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);

function upload(path: string, cookie: string, kind: string, file: File) {
  const body = new FormData();
  body.append('kind', kind);
  body.append('file', file);
  return request(path, { method: 'POST', headers: { Cookie: cookie, Origin: ORIGIN }, body });
}

/** An invitation taken by joiner-1 (signed in), with an organization and details. */
async function started(uid = 'joiner-1', email = 'ops@bank.example') {
  const { id, token } = await coreHooks().testInvite(email);
  const cookie = await signIn(uid);
  const claimed = await post(`/join/${token}`, cookie, {});
  expect(claimed.headers.get('Location')).toBe(`/onboarding/${id}`);
  return { id, token, cookie };
}

describe('joining Emanet', () => {
  it('shows the invitation to anyone with the link, and asks them to sign in', async () => {
    const { token } = await coreHooks().testInvite('ops@bank.example');
    const page = await request(`/join/${token}`);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('Örnek Bank');
    // The address is masked; the sign-in returns to the invitation.
    expect(html).toContain('o•••@bank.example');
    expect(html).not.toContain('ops@bank.example');
    expect(html).toContain(`/signin?return=${encodeURIComponent(`/join/${token}`)}`);
    // The link never leaves this site in a Referer.
    expect(page.headers.get('Referrer-Policy')).toBe('same-origin');
    expect((await request('/join/not-a-token')).status).toBe(404);
  });

  it('lets only an account with the invited address take it', async () => {
    const { token } = await coreHooks().testInvite('ops@bank.example');
    const wrong = await signIn('joiner-2');
    expect((await request(`/join/${token}`, { headers: { Cookie: wrong } })).status).toBe(403);
    expect((await post(`/join/${token}`, wrong, {})).status).toBe(403);
    const right = await signIn('joiner-1');
    const page = await request(`/join/${token}`, { headers: { Cookie: right } });
    expect(await page.text()).toContain('Start');
    expect((await post(`/join/${token}`, right, {})).status).toBe(303);
  });

  it('keeps one account out of another’s application', async () => {
    const { id } = await started();
    const other = await signIn('joiner-2');
    expect((await request(`/onboarding/${id}`, { headers: { Cookie: other } })).status).toBe(404);
    expect(
      (await request(`/onboarding/${id}/agreement.txt`, { headers: { Cookie: other } })).status,
    ).toBe(404);
    expect((await request(`/onboarding/${id}`)).status).toBe(302);
  });

  it('goes through the four steps to an accepted agreement', async () => {
    const { id, cookie } = await started();
    // Organization: a new one from login.
    const org = await post(`/onboarding/${id}/org`, cookie, { mode: 'new', name: 'Örnek Bank' });
    expect(org.headers.get('Location')).toBe(`/onboarding/${id}/details`);
    // Details: a bad VKN is shown back with its own message.
    const bad = await post(`/onboarding/${id}/details`, cookie, { ...DETAILS, vkn: '12' });
    expect(bad.status).toBe(422);
    expect(await bad.text()).toContain('The tax number has 10 digits');
    const good = await post(`/onboarding/${id}/details`, cookie, DETAILS);
    expect(good.headers.get('Location')).toBe(`/onboarding/${id}/documents`);
    // Documents: what the bytes are, not what the name says.
    const fake = await upload(
      `/onboarding/${id}/documents`,
      cookie,
      'tax_certificate',
      new File(['MZ not a pdf'], 'vergi.pdf', { type: 'application/pdf' }),
    );
    expect(fake.status).toBe(415);
    for (const kind of ['signature_circular', 'tax_certificate']) {
      const ok = await upload(
        `/onboarding/${id}/documents`,
        cookie,
        kind,
        new File([PDF], `${kind}.pdf`),
      );
      expect(ok.status).toBe(303);
    }
    const listed = await env.DOCUMENTS.list({ prefix: `onboarding/${id}/` });
    expect(listed.objects).toHaveLength(2);
    // The agreement needs a fresh second factor to accept.
    const page = await request(`/onboarding/${id}/agreement`, { headers: { Cookie: cookie } });
    const html = await page.text();
    expect(html).toContain('EMANET HİZMET SÖZLEŞMESİ');
    expect(html).toContain('second_factor=1');
    expect(html).not.toContain('Accept the agreement');
    const aal2 = await signIn('joiner-1!aal2');
    const form = await (
      await request(`/onboarding/${id}/agreement`, { headers: { Cookie: aal2 } })
    ).text();
    const version = /name="version" value="([^"]+)"/.exec(form)?.[1] ?? '';
    const sha256 = /name="sha256" value="([^"]+)"/.exec(form)?.[1] ?? '';
    expect(sha256).toMatch(/^[0-9a-f]{64}$/);
    // Without the authority box, or with a stale hash: refused.
    const unticked = await post(`/onboarding/${id}/agreement`, aal2, {
      version,
      sha256,
      name: 'Mehmet Demir',
      title: 'GMY',
      accept: '1',
    });
    expect(unticked.status).toBe(422);
    const stale = await post(`/onboarding/${id}/agreement`, aal2, {
      version,
      sha256: 'f'.repeat(64),
      name: 'Mehmet Demir',
      title: 'GMY',
      authorised: '1',
      accept: '1',
    });
    expect(await stale.text()).toContain('The agreement changed since you opened it');
    const signed = await post(`/onboarding/${id}/agreement`, aal2, {
      version,
      sha256,
      name: 'Mehmet Demir',
      title: 'GMY',
      authorised: '1',
      accept: '1',
    });
    expect(signed.headers.get('Location')).toBe(`/onboarding/${id}?signed=1`);
    const overview = await (
      await request(`/onboarding/${id}?signed=1`, { headers: { Cookie: aal2 } })
    ).text();
    expect(overview).toContain('2earl is checking');
    const download = await request(`/onboarding/${id}/agreement.txt`, {
      headers: { Cookie: aal2 },
    });
    expect(download.headers.get('Content-Disposition')).toContain(
      'emanet-sozlesme-2026-11-27-draft.txt',
    );
    expect(await download.text()).toContain('Örnek Bank A.Ş. 1234567890');
  });

  it('lets the agreement be read, not accepted, while 2earl’s details are missing', async () => {
    const { id, cookie } = await started();
    await post(`/onboarding/${id}/org`, cookie, { mode: 'new', name: 'Örnek Bank' });
    await post(`/onboarding/${id}/details`, cookie, DETAILS);
    await coreHooks().testDraftOnly(true);
    try {
      const aal2 = await signIn('joiner-1!aal2');
      const page = await (
        await request(`/onboarding/${id}/agreement`, { headers: { Cookie: aal2 } })
      ).text();
      expect(page).toContain('EMANET HİZMET SÖZLEŞMESİ');
      expect(page).toContain('2earl is completing its own details');
      expect(page).not.toContain('Accept the agreement');
      const refused = await post(`/onboarding/${id}/agreement`, aal2, {
        version: 'v',
        sha256: 'x',
        name: 'Mehmet Demir',
        title: 'GMY',
        authorised: '1',
        accept: '1',
      });
      expect(await refused.text()).toContain('Try again shortly');
    } finally {
      await coreHooks().testDraftOnly(false);
    }
  });

  it('accepts only an organization the person manages', async () => {
    const { id, cookie } = await started();
    const refused = await post(`/onboarding/${id}/org`, cookie, { mode: 'existing', org: 'org-1' });
    expect(refused.status).toBe(422);
  });

  it('sends someone still joining to their application from the start page', async () => {
    const { cookie } = await started();
    const home = await request('/', { headers: { Cookie: cookie } });
    expect(home.headers.get('Location')).toBe('/onboarding');
  });

  it('refuses form posts from other sites', async () => {
    const { token } = await coreHooks().testInvite('ops@bank.example');
    const cookie = await signIn('joiner-1');
    const response = await request(`/join/${token}`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'https://evil.example' },
    });
    expect(response.status).toBe(403);
  });
});

describe('helpers', () => {
  it('masks an address', () => {
    expect(maskEmail('ayse.yilmaz@bank.com.tr')).toBe('a•••@bank.com.tr');
    expect(maskEmail('nope')).toBe('•••');
  });

  it('knows a file by its first bytes', () => {
    expect(sniff(PDF)).toBe('application/pdf');
    expect(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'image/png',
    );
    expect(sniff(new TextEncoder().encode('<svg'))).toBe(null);
  });
});
