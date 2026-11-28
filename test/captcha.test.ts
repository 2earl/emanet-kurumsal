import { describe, expect, it } from 'vitest';
import { captchaSiteKey, verifyCaptcha } from '../src/captcha';

const env = (keys: Record<string, string | undefined> = {}) =>
  ({
    SITE_ORIGIN: 'https://kurumsal.emanet.dev',
    TURNSTILE_SITE_KEY: 'site',
    TURNSTILE_SECRET: 'secret',
    ...keys,
  }) as unknown as Env;

const answer = (body: unknown, status = 200) =>
  (() => Promise.resolve(Response.json(body, { status }))) as unknown as typeof fetch;

describe('Turnstile', () => {
  it('keeps the form closed without both keys', async () => {
    expect(captchaSiteKey(env())).toBe('site');
    expect(captchaSiteKey(env({ TURNSTILE_SECRET: '' }))).toBeNull();
    expect(captchaSiteKey(env({ TURNSTILE_SITE_KEY: undefined }))).toBeNull();
    expect(await verifyCaptcha(env({ TURNSTILE_SECRET: undefined }), 'x', null)).toBe(
      'unavailable',
    );
  });

  it('fails closed when Cloudflare can’t be asked', async () => {
    const down = (() => Promise.reject(new Error('down'))) as unknown as typeof fetch;
    expect(await verifyCaptcha(env(), 'x', null, down)).toBe('unavailable');
    expect(await verifyCaptcha(env(), 'x', null, answer({}, 500))).toBe('unavailable');
  });

  it('checks success, this site and this form', async () => {
    const good = { success: true, hostname: 'kurumsal.emanet.dev', action: 'invitation_request' };
    expect(await verifyCaptcha(env(), 'x', '1.2.3.4', answer(good))).toBe('ok');
    expect(await verifyCaptcha(env(), '', null, answer(good))).toBe('missing');
    expect(await verifyCaptcha(env(), 'x'.repeat(2049), null, answer(good))).toBe('failed');
    expect(await verifyCaptcha(env(), 'x', null, answer({ ...good, success: false }))).toBe(
      'failed',
    );
    expect(
      await verifyCaptcha(env(), 'x', null, answer({ ...good, hostname: 'evil.example' })),
    ).toBe('failed');
    expect(await verifyCaptcha(env(), 'x', null, answer({ ...good, action: 'login' }))).toBe(
      'failed',
    );
  });
});
