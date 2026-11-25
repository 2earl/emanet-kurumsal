import { hmac, randomToken } from './http';

/**
 * API keys (docs/DESIGN.md §5): one per integration, scoped, shown once. Only an HMAC of the key
 * is stored, so a copy of this database doesn't hold usable keys. A key acts for its whole
 * organization, so only owners and admins create them, after a fresh second factor.
 */

export const KEY_SCOPES = ['cases:read', 'cases:write', 'events:read'] as const;
export type KeyScope = (typeof KEY_SCOPES)[number];

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: KeyScope[];
  created_by: string;
  created_at: number;
  last_used_at: number | null;
  expires_at: number | null;
  revoked_at: number | null;
}

const KEY = /^(emk_[A-Za-z0-9_-]{8})_([A-Za-z0-9_-]{43})$/;
const MAX_KEYS_PER_ORG = 25;

export class KeyError extends Error {
  override name = 'KeyError';
}

export async function createKey(
  env: Env,
  input: {
    orgId: string;
    name: string;
    scopes: readonly string[];
    uid: string;
    expiresInDays: number | null;
  },
  now: number,
): Promise<{ id: string; key: string }> {
  const name = input.name.trim();
  if (!name || name.length > 60) throw new KeyError('Give the key a name of up to 60 characters.');
  const scopes = KEY_SCOPES.filter((scope) => input.scopes.includes(scope));
  if (scopes.length === 0) throw new KeyError('Choose at least one permission.');
  if (input.expiresInDays !== null && !(input.expiresInDays >= 1 && input.expiresInDays <= 730)) {
    throw new KeyError('A key expires after 1 to 730 days, or never.');
  }
  const count = await env.DB.prepare(
    'SELECT count(*) AS n FROM api_keys WHERE org_id = ? AND revoked_at IS NULL',
  )
    .bind(input.orgId)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_KEYS_PER_ORG) {
    throw new KeyError('This organization has 25 keys. Revoke one first.');
  }
  const prefix = `emk_${randomToken(6)}`;
  const key = `${prefix}_${randomToken(32)}`;
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO api_keys (id, org_id, name, prefix, hash, scopes, created_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.orgId,
      name,
      prefix,
      await hmac(env.SESSION_PEPPER, `apikey:${key}`),
      JSON.stringify(scopes),
      input.uid,
      now,
      input.expiresInDays === null ? null : now + input.expiresInDays * 86_400,
    )
    .run();
  return { id, key };
}

export async function listKeys(env: Env, orgId: string): Promise<ApiKey[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, name, prefix, scopes, created_by, created_at, last_used_at, expires_at, revoked_at
     FROM api_keys WHERE org_id = ? ORDER BY revoked_at IS NOT NULL, created_at DESC`,
  )
    .bind(orgId)
    .all<Omit<ApiKey, 'scopes'> & { scopes: string }>();
  return results.map((row) => ({ ...row, scopes: JSON.parse(row.scopes) as KeyScope[] }));
}

export async function revokeKey(
  env: Env,
  orgId: string,
  id: string,
  now: number,
): Promise<boolean> {
  const result = await env.DB.prepare(
    'UPDATE api_keys SET revoked_at = ? WHERE id = ? AND org_id = ? AND revoked_at IS NULL',
  )
    .bind(now, id, orgId)
    .run();
  return result.meta.changes === 1;
}

/** The key in an `Authorization: Bearer …` header, if it is valid now. */
export async function authenticate(
  env: Env,
  header: string | undefined,
  now: number,
): Promise<{ keyId: string; orgId: string; scopes: KeyScope[] } | null> {
  const match = /^Bearer (\S+)$/.exec(header ?? '');
  const key = match?.[1];
  if (!key || !KEY.test(key)) return null;
  const row = await env.DB.prepare(
    `SELECT id, org_id, scopes, expires_at, revoked_at, last_used_at FROM api_keys WHERE hash = ?`,
  )
    .bind(await hmac(env.SESSION_PEPPER, `apikey:${key}`))
    .first<{
      id: string;
      org_id: string;
      scopes: string;
      expires_at: number | null;
      revoked_at: number | null;
      last_used_at: number | null;
    }>();
  if (!row || row.revoked_at !== null || (row.expires_at !== null && row.expires_at <= now)) {
    return null;
  }
  // Last use to the minute is enough, and saves a write per request.
  if (row.last_used_at === null || now - row.last_used_at >= 60) {
    await env.DB.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
      .bind(now, row.id)
      .run();
  }
  return { keyId: row.id, orgId: row.org_id, scopes: JSON.parse(row.scopes) as KeyScope[] };
}
