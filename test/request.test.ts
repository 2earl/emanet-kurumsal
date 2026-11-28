import { describe, expect, it } from 'vitest';
import { coreHooks, post, request, signIn } from './helpers';

const form = (over: Record<string, string> = {}) => ({
  company: 'Firma Varlık Yönetim A.Ş.',
  kind: 'vys',
  contactName: 'Zeynep Kaya',
  contactEmail: 'Zeynep@Firma.example',
  phone: '+90 212 555 00 00',
  jobTitle: 'Hukuk Müdürü',
  volume: 'medium',
  message: 'Yaklaşık 300 dosya.',
  'cf-turnstile-response': 'pass',
  ...over,
});

const page = async (path: string, cookie: string) => request(path, { headers: { Cookie: cookie } });

describe('asking for an invitation', () => {
  it('sends someone signed out to sign in first', async () => {
    const res = await request('/request');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/signin?return=%2Frequest');
    expect(await (await request('/')).text()).toContain('href="/request"');
  });

  it('offers the form to an account without an organization, and shows where it stands', async () => {
    const cookie = await signIn('asker-1');
    expect(await (await page('/', cookie)).text()).toContain('Ask for an invitation');
    const blank = await (await page('/request', cookie)).text();
    expect(blank).toContain('name="company"');

    // The address must be one on the 2earl account: the invitation goes to it.
    const wrong = await post('/request', cookie, form({ contactEmail: 'someone@else.example' }));
    expect(wrong.status).toBe(400);
    const wrongText = await wrong.text();
    expect(wrongText).toContain('Use an email address on your 2earl account');
    expect(wrongText).toContain('value="Firma Varlık Yönetim A.Ş."');

    const bad = await post('/request', cookie, form({ kind: 'casino' }));
    expect(await bad.text()).toContain('Choose what kind of organization it is.');

    const sent = await post('/request', cookie, form());
    expect(sent.status).toBe(303);
    expect(sent.headers.get('Location')).toBe('/?requested=1');
    const home = await (await page('/?requested=1', cookie)).text();
    expect(home).toContain('Request sent.');
    expect(home).toContain('We have your request');
    expect(home).toContain('zeynep@firma.example');

    // One open request: the form sends them back.
    expect((await page('/request', cookie)).headers.get('Location')).toBe('/');
    expect((await post('/request', cookie, form())).status).toBe(303);

    await coreHooks().testHandleRequest('asker-1', 'invited');
    expect(await (await page('/', cookie)).text()).toContain('Your invitation is on its way');
    expect((await page('/request', cookie)).headers.get('Location')).toBe('/');
  });

  it('lets someone declined ask again, without giving the reason', async () => {
    const cookie = await signIn('asker-2');
    const sent = await post(
      '/request',
      cookie,
      form({ contactEmail: 'ali@firma.example', contactName: 'Ali Demir' }),
    );
    expect(sent.status).toBe(303);
    await coreHooks().testHandleRequest('asker-2', 'declined');
    const home = await (await page('/', cookie)).text();
    expect(home).toContain('couldn’t go ahead');
    expect(home).toContain('Ask again');
    expect((await page('/request', cookie)).status).toBe(200);
  });

  it('keeps it away from people who already have an organization', async () => {
    const member = await signIn('member-1');
    expect((await page('/request', member)).headers.get('Location')).toBe('/');
    expect((await post('/request', member, form())).status).toBe(303);
  });

  it('asks for the Turnstile check, and refuses a request without a good one', async () => {
    const cookie = await signIn('asker-5');
    const blank = await page('/request', cookie);
    const csp = blank.headers.get('Content-Security-Policy') ?? '';
    expect(csp).toContain('script-src https://challenges.cloudflare.com');
    expect(csp).toContain('frame-src https://challenges.cloudflare.com');
    const html = await blank.text();
    expect(html).toContain('data-sitekey="1x00000000000000000000AA"');
    expect(html).toContain('data-action="invitation_request"');
    // Only this page may load the script.
    expect((await request('/')).headers.get('Content-Security-Policy')).not.toContain('script-src');
    for (const [token, text] of [
      ['', 'Complete the check'],
      ['nope', 'The check didn’t pass'],
      ['other-site', 'The check didn’t pass'],
      ['other-form', 'The check didn’t pass'],
    ] as const) {
      const refused = await post(
        '/request',
        cookie,
        form({ contactEmail: 'a5@firma.example', 'cf-turnstile-response': token }),
      );
      expect(refused.status).toBe(400);
      expect(await refused.text()).toContain(text);
    }
    // Nothing reached the core.
    expect(await (await page('/', cookie)).text()).not.toContain('We have your request');
  });
});
