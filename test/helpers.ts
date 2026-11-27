import { env, exports } from 'cloudflare:workers';

export const ORIGIN = 'https://kurumsal.emanet.dev';
const ip = () => `198.51.100.${String(Math.floor(Math.random() * 250))}`;

export function request(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: BodyInit } = {},
): Promise<Response> {
  return exports.default.fetch(
    new Request(`${ORIGIN}${path}`, {
      method: init.method ?? 'GET',
      headers: { 'CF-Connecting-IP': ip(), ...(init.headers ?? {}) },
      ...(init.body === undefined ? {} : { body: init.body }),
      redirect: 'manual',
    }),
  );
}

/** A form post from our own pages. */
export function post(path: string, cookie: string, form: Record<string, string | string[]>) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) {
    for (const v of [value].flat()) body.append(key, v);
  }
  return request(path, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: ORIGIN,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
}

const cookieFrom = (response: Response, name: string) => {
  for (const header of response.headers.getSetCookie()) {
    const [pair = ''] = header.split(';');
    if (pair.startsWith(`${name}=`)) return pair;
  }
  throw new Error(`no ${name} cookie`);
};

/** Signs in through the whole flow; `!aal2` in the uid means a fresh second factor. */
export async function signIn(uid: string): Promise<string> {
  const start = await request('/signin');
  const signinCookie = cookieFrom(start, '__Host-signin');
  const location = new URL(start.headers.get('Location') ?? '');
  const state = location.searchParams.get('state') ?? '';
  const challenge = location.searchParams.get('code_challenge') ?? '';
  const callback = await request(
    `/callback?state=${encodeURIComponent(state)}&code=${encodeURIComponent(`${uid}.${challenge}`)}&iss=${encodeURIComponent('https://login.2earl.com')}`,
    { headers: { Cookie: signinCookie } },
  );
  if (callback.status !== 302) throw new Error(`callback ${String(callback.status)}`);
  return cookieFrom(callback, '__Host-session');
}

interface CoreTestHooks {
  testAddEvent(orgId: string, type: string, data: Record<string, unknown>): Promise<string>;
  testReset(): Promise<void>;
  testInvite(email: string): Promise<{ id: string; token: string }>;
  testDraftOnly(value: boolean): Promise<void>;
  testDeliver(orgId: string, caseId: string): Promise<void>;
  testViewed(): Promise<string[][]>;
}
export const coreHooks = () => env.CORE as unknown as CoreTestHooks;

export const caseJson = (overrides: Record<string, unknown> = {}) => ({
  external_ref: `K-${crypto.randomUUID().slice(0, 8)}`,
  vin: 'VF1RJA00061234567',
  plate: '34 ABC 123',
  make: 'Renault',
  model: 'Clio',
  year: 2021,
  icra_office: 'İstanbul 5. İcra Dairesi',
  icra_file_no: '2026/12345',
  serh_date: '2026-10-01',
  legal_basis: 'rehin',
  places: [{ kind: 'owner_home', address: 'Örnek Sk. 1', district: 'Kadıköy', city: 'İstanbul' }],
  ...overrides,
});

/** The text fields of a case, as the form posts them. */
export const formOf = (input: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(input).flatMap(([k, v]) =>
      typeof v === 'string' || typeof v === 'number' ? [[k, String(v)]] : [],
    ),
  );
