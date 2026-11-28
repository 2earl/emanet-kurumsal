/**
 * Cloudflare Turnstile, for the one form anyone with a 2earl account can send: asking for an
 * invitation (src/request-pages.ts). The widget gives the browser a token; the server checks it
 * with Cloudflare before anything else happens, and checks it was solved on this site, for this
 * form. Without both keys the form is closed: it never opens because a check can't run.
 */

export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
const SITEVERIFY = `${TURNSTILE_ORIGIN}/turnstile/v0/siteverify`;
/** The widget's action, so a token solved for another form (or site) is refused. */
export const REQUEST_ACTION = 'invitation_request';
/** The form field the widget fills in. */
export const TOKEN_FIELD = 'cf-turnstile-response';

/** The site key to show the widget with, or null when the form must stay closed. */
export function captchaSiteKey(env: Env): string | null {
  return env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET ? env.TURNSTILE_SITE_KEY : null;
}

export type CaptchaResult = 'ok' | 'missing' | 'failed' | 'unavailable';

export async function verifyCaptcha(
  env: Env,
  token: unknown,
  ip: string | null,
  fetcher: typeof fetch = fetch,
): Promise<CaptchaResult> {
  const secret = env.TURNSTILE_SECRET;
  if (!secret || !env.TURNSTILE_SITE_KEY) return 'unavailable';
  if (typeof token !== 'string' || token.length === 0) return 'missing';
  if (token.length > 2048) return 'failed';
  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  if (ip) body.set('remoteip', ip);
  let outcome: { success?: unknown; hostname?: unknown; action?: unknown };
  try {
    const response = await fetcher(SITEVERIFY, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return 'unavailable';
    outcome = await response.json();
  } catch {
    return 'unavailable';
  }
  if (outcome.success !== true) return 'failed';
  if (outcome.hostname !== new URL(env.SITE_ORIGIN).hostname) return 'failed';
  if (outcome.action !== REQUEST_ACTION) return 'failed';
  return 'ok';
}
