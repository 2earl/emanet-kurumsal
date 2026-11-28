import { describe, expect, it } from 'vitest';
import { createApi } from '../src/api';
import { DOCUMENTED } from '../src/api-docs';
import { ERRORS, openapi, toYaml } from '../src/openapi';
import { request } from './helpers';

/** The reference page, the OpenAPI document and the routes all describe the same API. */

type Doc = {
  openapi: string;
  paths: Record<
    string,
    Record<string, { operationId: string; responses: Record<string, unknown> }>
  >;
  components: { schemas: Record<string, unknown> };
  webhooks: Record<string, unknown>;
};

describe('the OpenAPI document', () => {
  const doc = openapi('https://kurumsal.test') as unknown as Doc;
  const routes = createApi(() => 0)
    .routes.filter((r) => r.method !== 'ALL')
    .map((r) => `${r.method} ${r.path}`)
    .sort();

  it('has every route of the API, and no other', () => {
    const described = Object.entries(doc.paths)
      .flatMap(([path, methods]) =>
        Object.keys(methods).map((m) => `${m.toUpperCase()} ${path.replace(/\{(\w+)\}/g, ':$1')}`),
      )
      .sort();
    expect(described).toEqual(routes);
    expect([...DOCUMENTED].sort()).toEqual(routes);
  });

  it('gives each operation a unique name and resolves every reference', () => {
    const ids = Object.values(doc.paths).flatMap((methods) =>
      Object.values(methods).map((op) => op.operationId),
    );
    expect(new Set(ids).size).toBe(ids.length);
    const refs = [...JSON.stringify(doc).matchAll(/"\$ref":"#\/components\/schemas\/(\w+)"/g)].map(
      (m) => m[1] ?? '',
    );
    expect(refs.length).toBeGreaterThan(10);
    for (const name of refs) expect(doc.components.schemas, name).toHaveProperty(name);
    expect(doc.openapi).toBe('3.1.0');
    expect(Object.keys(doc.webhooks).sort()).toEqual([
      'case.delivered',
      'case.expired',
      'case.rejected',
      'invoice.issued',
    ]);
  });

  it('lists each error once, with a status the API uses', () => {
    const codes = ERRORS.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const e of ERRORS) expect([400, 401, 403, 404, 409, 422, 429], e.code).toContain(e.status);
  });

  it('is served as JSON and as YAML, readable from other origins', async () => {
    const json = await request('/docs/openapi.json');
    expect(json.status).toBe(200);
    expect(json.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const body: Doc = await json.json();
    expect(body.paths['/cases']?.post?.operationId).toBe('upsertCase');
    const yaml = await request('/docs/openapi.yaml');
    expect(yaml.headers.get('Content-Type')).toContain('application/yaml');
    const text = await yaml.text();
    expect(text.startsWith('openapi: "3.1.0"\n')).toBe(true);
    expect(text).toContain('operationId: upsertCase');
    expect(text).toContain("'/cases/{id}/withdraw':".replace(/'/g, '"'));
  });

  it('writes YAML that keeps strings strings', () => {
    expect(
      toYaml({ a: 'yes', b: '3.1.0', c: [1, 'x y'], d: {}, e: [], f: 'a: b', g: 'l1\nl2' }),
    ).toBe(
      'a: "yes"\nb: "3.1.0"\nc:\n  - 1\n  - x y\nd: {}\ne: []\nf: "a: b"\ng: |-\n  l1\n  l2\n',
    );
  });
});

describe('the reference page', () => {
  it('documents every endpoint in both languages, with the download links', async () => {
    const en = await (await request('/docs/api?lang=en')).text();
    const tr = await (await request('/docs/api', { headers: { 'Accept-Language': 'tr' } })).text();
    for (const page of [en, tr]) {
      expect(page).toContain('href="/docs/openapi.json"');
      expect(page).toContain('id="upsert-case"');
      expect(page).toContain('id="webhooks"');
      expect(page).toContain('Emanet-Signature');
      expect(page).toContain('<code>delivery_in_review</code>');
    }
    expect(en).toContain('Idempotency and retries');
    expect(tr).toContain('Yinelenebilirlik ve yeniden deneme');
    expect(tr).not.toContain('Idempotency and retries');
  });
});
