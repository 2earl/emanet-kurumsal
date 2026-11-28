/**
 * The API reference at /docs/api: a guide and a reference in one page, in both languages. Its
 * examples and its error table come from src/openapi.ts, so the page and the OpenAPI document
 * can't drift apart. Prose is written in both languages here and marked translate="no".
 */
import { icon } from './icons';
import { currentLocale } from './i18n';
import { API_VERSION, CASE_EXAMPLE, CASE_VIEW_EXAMPLE, ERRORS, EVENT_EXAMPLES } from './openapi';
import { esc, layout } from './pages';

type Loc = 'en' | 'tr';
type Method = 'GET' | 'POST';

interface Param {
  name: string;
  where: 'path' | 'query' | 'body';
  type: string;
  required: boolean;
  en: string;
  tr: string;
}

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  scope: string;
  title: Record<Loc, string>;
  text: Record<Loc, string>;
  params: Param[];
  request?: string;
  response: string;
}

const json = (value: unknown) => JSON.stringify(value, null, 2);

const ENDPOINTS: Endpoint[] = [
  {
    id: 'upsert-case',
    method: 'POST',
    path: '/cases',
    scope: 'cases:write',
    title: { en: 'Add or update a case', tr: 'Dosya ekle veya güncelle' },
    text: {
      en: 'Adds a case, or updates your case with the same <code>external_ref</code>. Sending a case again also confirms that its seizure order still stands, which moves <code>expires_at</code> forward. If you leave <code>vin</code> out, or the plate is recorded on another vehicle, the case starts as <code>pending_identity</code> and agents don’t see it until Emanet has settled which vehicle it is.',
      tr: 'Dosya ekler ya da aynı <code>external_ref</code> değerine sahip dosyanızı günceller. Dosyayı yeniden göndermek, yakalama şerhinin sürdüğünü de onaylar ve <code>expires_at</code> değerini ileri alır. <code>vin</code> gönderilmezse ya da plaka başka bir araçta kayıtlıysa dosya <code>pending_identity</code> olarak başlar; Emanet aracı belirleyene kadar görevliler dosyayı görmez.',
    },
    params: [
      {
        name: 'external_ref',
        where: 'body',
        type: 'string ≤ 100',
        required: true,
        en: 'Your own reference; unique in your organization. The idempotency key.',
        tr: 'Kendi referansınız; kurumunuzda tekildir. Yinelenebilirlik anahtarıdır.',
      },
      {
        name: 'plate',
        where: 'body',
        type: 'string',
        required: true,
        en: 'A Turkish plate. Spaces are ignored.',
        tr: 'Türk plakası. Boşluklar yok sayılır.',
      },
      {
        name: 'vin',
        where: 'body',
        type: 'string, 17',
        required: false,
        en: 'Chassis number. Strongly recommended: it is what identifies the vehicle.',
        tr: 'Şasi numarası. Mutlaka gönderin: aracı tanımlayan odur.',
      },
      {
        name: 'make, model',
        where: 'body',
        type: 'string ≤ 60',
        required: true,
        en: 'As on the registration.',
        tr: 'Ruhsattaki gibi.',
      },
      {
        name: 'year',
        where: 'body',
        type: 'integer',
        required: false,
        en: '1950 to 2100.',
        tr: '1950 ile 2100 arası.',
      },
      {
        name: 'colour',
        where: 'body',
        type: 'string ≤ 40',
        required: false,
        en: 'Helps the agent recognize the vehicle.',
        tr: 'Görevlinin aracı tanımasına yardım eder.',
      },
      {
        name: 'icra_office',
        where: 'body',
        type: 'string ≤ 120',
        required: true,
        en: 'The enforcement office.',
        tr: 'İcra dairesi.',
      },
      {
        name: 'icra_file_no',
        where: 'body',
        type: 'string ≤ 40',
        required: true,
        en: 'The enforcement file number.',
        tr: 'İcra dosya numarası.',
      },
      {
        name: 'serh_date',
        where: 'body',
        type: 'YYYY-MM-DD',
        required: true,
        en: 'The date of the seizure order.',
        tr: 'Yakalama şerhinin tarihi.',
      },
      {
        name: 'legal_basis',
        where: 'body',
        type: '"rehin" | "haciz"',
        required: true,
        en: 'Pledge or attachment.',
        tr: 'Rehin veya haciz.',
      },
      {
        name: 'places',
        where: 'body',
        type: 'Place[] ≤ 10',
        required: false,
        en: 'Where the vehicle may be found. When sent, replaces the case’s places.',
        tr: 'Aracın bulunabileceği yerler. Gönderildiğinde dosyanın yerlerinin yerine geçer.',
      },
      {
        name: 'attributes',
        where: 'body',
        type: 'object',
        required: false,
        en: 'Your custom fields for cases.',
        tr: 'Dosya için özel alanlarınız.',
      },
      {
        name: 'vehicle_attributes',
        where: 'body',
        type: 'object',
        required: false,
        en: 'Your custom fields for vehicles.',
        tr: 'Araç için özel alanlarınız.',
      },
    ],
    request: json(CASE_EXAMPLE),
    response: json(CASE_VIEW_EXAMPLE),
  },
  {
    id: 'list-cases',
    method: 'GET',
    path: '/cases',
    scope: 'cases:read',
    title: { en: 'List cases', tr: 'Dosyaları listele' },
    text: {
      en: 'Your cases, oldest change first, in pages. Pass <code>next_cursor</code> back as <code>cursor</code> until it is <code>null</code>.',
      tr: 'Dosyalarınız, en eski değişiklik başta, sayfalar hâlinde. <code>next_cursor</code> değeri <code>null</code> olana kadar onu <code>cursor</code> olarak geri gönderin.',
    },
    params: [
      {
        name: 'status',
        where: 'query',
        type: 'CaseStatus',
        required: false,
        en: 'Only cases in this status.',
        tr: 'Yalnızca bu durumdaki dosyalar.',
      },
      {
        name: 'updated_since',
        where: 'query',
        type: 'unix time',
        required: false,
        en: 'Only cases changed after this time.',
        tr: 'Yalnızca bu zamandan sonra değişen dosyalar.',
      },
      {
        name: 'cursor',
        where: 'query',
        type: 'string',
        required: false,
        en: 'The previous page’s next_cursor.',
        tr: 'Önceki sayfanın next_cursor değeri.',
      },
      {
        name: 'limit',
        where: 'query',
        type: '1–200',
        required: false,
        en: 'Cases per page. Default 50.',
        tr: 'Sayfa başına dosya. Varsayılan 50.',
      },
    ],
    response: json({
      cases: [
        { id: CASE_VIEW_EXAMPLE.id, external_ref: 'K-2026-0001', status: 'active', '…': '…' },
      ],
      next_cursor: `1795800000.${CASE_VIEW_EXAMPLE.id}`,
    }),
  },
  {
    id: 'get-case',
    method: 'GET',
    path: '/cases/{id}',
    scope: 'cases:read',
    title: { en: 'Get a case', tr: 'Dosyayı getir' },
    text: { en: 'One case by its ID.', tr: 'Kimliğiyle tek bir dosya.' },
    params: [
      {
        name: 'id',
        where: 'path',
        type: 'uuid',
        required: true,
        en: 'The case’s ID.',
        tr: 'Dosyanın kimliği.',
      },
    ],
    response: json(CASE_VIEW_EXAMPLE),
  },
  {
    id: 'case-timeline',
    method: 'GET',
    path: '/cases/{id}/timeline',
    scope: 'cases:read',
    title: { en: 'Get a case’s timeline', tr: 'Dosyanın zaman çizelgesi' },
    text: {
      en: 'What happened to the case and when, oldest first: <code>created</code>, <code>updated</code>, <code>identity_accepted</code>, <code>identity_rejected</code>, <code>withdrawn</code>, <code>expired</code>, <code>delivered</code>. States and times only; never who the agent was.',
      tr: 'Dosyada ne olduğu ve ne zaman olduğu, en eski başta: <code>created</code>, <code>updated</code>, <code>identity_accepted</code>, <code>identity_rejected</code>, <code>withdrawn</code>, <code>expired</code>, <code>delivered</code>. Yalnızca durumlar ve zamanlar; görevlinin kimliği hiçbir zaman yer almaz.',
    },
    params: [
      {
        name: 'id',
        where: 'path',
        type: 'uuid',
        required: true,
        en: 'The case’s ID.',
        tr: 'Dosyanın kimliği.',
      },
    ],
    response: json([
      { event: 'created', at: 1795800000 },
      { event: 'delivered', at: 1796150000 },
    ]),
  },
  {
    id: 'confirm-cases',
    method: 'POST',
    path: '/cases/confirm',
    scope: 'cases:write',
    title: { en: 'Confirm cases', tr: 'Dosyaları onayla' },
    text: {
      en: 'Confirms that the seizure orders of these cases still stand, and moves their <code>expires_at</code> forward by your organization’s confirmation interval. IDs that aren’t yours or aren’t open are skipped, so <code>confirmed</code> can be less than you sent.',
      tr: 'Bu dosyaların yakalama şerhlerinin sürdüğünü onaylar ve <code>expires_at</code> değerlerini kurumunuzun teyit aralığı kadar ileri alır. Size ait olmayan ya da açık olmayan kimlikler atlanır; bu yüzden <code>confirmed</code> gönderdiğinizden az olabilir.',
    },
    params: [
      {
        name: 'case_ids',
        where: 'body',
        type: 'uuid[] 1–1000',
        required: true,
        en: 'The cases to confirm.',
        tr: 'Onaylanacak dosyalar.',
      },
    ],
    request: json({ case_ids: [CASE_VIEW_EXAMPLE.id] }),
    response: json({ confirmed: 1 }),
  },
  {
    id: 'withdraw-case',
    method: 'POST',
    path: '/cases/{id}/withdraw',
    scope: 'cases:write',
    title: { en: 'Withdraw a case', tr: 'Dosyayı geri çek' },
    text: {
      en: 'Stops the search at once: the debt was paid, or the order was lifted. Call it as soon as you know; looking for a vehicle whose order has been lifted is unlawful. No fee is owed for a withdrawn case.',
      tr: 'Aramayı hemen durdurur: borç ödendi ya da şerh kalktı. Öğrenir öğrenmez çağırın; şerhi kalkmış bir aracı aramak hukuka aykırıdır. Geri çekilen dosya için ücret doğmaz.',
    },
    params: [
      {
        name: 'id',
        where: 'path',
        type: 'uuid',
        required: true,
        en: 'The case’s ID.',
        tr: 'Dosyanın kimliği.',
      },
      {
        name: 'reason',
        where: 'body',
        type: 'string ≤ 200',
        required: true,
        en: 'Why. Kept in the audit log.',
        tr: 'Gerekçe. Denetim kaydında tutulur.',
      },
    ],
    request: json({ reason: 'Borç ödendi; şerh kaldırıldı.' }),
    response:
      json({ ...CASE_VIEW_EXAMPLE, status: 'withdrawn' })
        .split('\n')
        .slice(0, 4)
        .join('\n') + '\n  …\n}',
  },
  {
    id: 'get-schema',
    method: 'GET',
    path: '/schema',
    scope: 'cases:read',
    title: { en: 'Get your custom fields', tr: 'Özel alanlarınızı getir' },
    text: {
      en: 'The extra fields Emanet has defined for your organization, per entity. A field’s <code>key</code> is what you send in <code>attributes</code> (case), <code>vehicle_attributes</code> (vehicle) or a place’s <code>attributes</code>. A key that isn’t in the schema is refused with <code>unknown_field</code>.',
      tr: 'Emanet’in kurumunuz için tanımladığı ek alanlar, varlık türüne göre. Alanın <code>key</code> değeri, <code>attributes</code> (dosya), <code>vehicle_attributes</code> (araç) ya da bir yerin <code>attributes</code> nesnesinde gönderdiğiniz anahtardır. Şemada olmayan anahtar <code>unknown_field</code> ile reddedilir.',
    },
    params: [],
    response: json({
      case: [
        {
          id: 'f-1',
          partnerId: 'p-1',
          entity: 'case',
          key: 'portfolio',
          labelTr: 'Portföy',
          labelEn: 'Portfolio',
          type: 'enum',
          enumValues: ['A', 'B'],
          required: false,
          maxLength: null,
          visibility: 'partner',
          pii: false,
          position: 1,
          deprecated: false,
        },
      ],
      vehicle: [],
      place: [],
    }),
  },
  {
    id: 'list-events',
    method: 'GET',
    path: '/events',
    scope: 'events:read',
    title: { en: 'List events', tr: 'Olayları listele' },
    text: {
      en: 'Events for your organization, oldest first. Store the <code>next_cursor</code> you get and send it as <code>cursor</code> next time, so you receive only what is new. When nothing is new, <code>events</code> is empty and <code>next_cursor</code> is the one you sent.',
      tr: 'Kurumunuza ait olaylar, en eski başta. Aldığınız <code>next_cursor</code> değerini saklayın ve bir sonraki çağrıda <code>cursor</code> olarak gönderin; böylece yalnızca yeni olanları alırsınız. Yeni olay yoksa <code>events</code> boştur ve <code>next_cursor</code> gönderdiğiniz değerdir.',
    },
    params: [
      {
        name: 'cursor',
        where: 'query',
        type: 'string',
        required: false,
        en: 'The next_cursor you were given last. Leave out the first time.',
        tr: 'Son aldığınız next_cursor. İlk çağrıda göndermeyin.',
      },
      {
        name: 'limit',
        where: 'query',
        type: '1–500',
        required: false,
        en: 'Events per call. Default 100.',
        tr: 'Çağrı başına olay. Varsayılan 100.',
      },
    ],
    response: json({
      events: [EVENT_EXAMPLES['case.delivered']],
      next_cursor: `1796150000.${EVENT_EXAMPLES['case.delivered'].id}`,
    }),
  },
  {
    id: 'list-invoices',
    method: 'GET',
    path: '/invoices',
    scope: 'invoices:read',
    title: { en: 'List invoices', tr: 'Faturaları listele' },
    text: {
      en: 'Your invoices, newest first (at most 500).',
      tr: 'Faturalarınız, en yeni başta (en fazla 500).',
    },
    params: [],
    response: json([
      {
        id: 'a4b3c2d1-0e9f-4a8b-9c7d-6e5f4a3b2c10',
        number: 'EMA2026000000012',
        issued_at: 1796400000,
        net_kurus: 1000000,
        kdv_kurus: 200000,
        total_kurus: 1200000,
        paid_kurus: 0,
        status: 'issued',
        cases: 1,
      },
    ]),
  },
  {
    id: 'get-invoice',
    method: 'GET',
    path: '/invoices/{id}',
    scope: 'invoices:read',
    title: { en: 'Get an invoice', tr: 'Faturayı getir' },
    text: {
      en: 'An invoice with one line per delivered case.',
      tr: 'Teslim edilen her dosya için bir satırla fatura.',
    },
    params: [
      {
        name: 'id',
        where: 'path',
        type: 'uuid',
        required: true,
        en: 'The invoice’s ID.',
        tr: 'Faturanın kimliği.',
      },
    ],
    response: json({
      id: 'a4b3c2d1-0e9f-4a8b-9c7d-6e5f4a3b2c10',
      number: 'EMA2026000000012',
      issued_at: 1796400000,
      net_kurus: 1000000,
      kdv_kurus: 200000,
      total_kurus: 1200000,
      paid_kurus: 0,
      status: 'issued',
      cases: 1,
      lines: [
        {
          case_id: CASE_VIEW_EXAMPLE.id,
          external_ref: 'K-2026-0001',
          plate: '34ABC123',
          delivered_at: 1796150000,
          net_kurus: 1000000,
          kdv_kurus: 200000,
        },
      ],
    }),
  },
];

/** The routes the page documents, for the test that compares them with src/api.ts. */
export const DOCUMENTED = ENDPOINTS.map(
  (e) => `${e.method} ${e.path.replace(/\{(\w+)\}/g, ':$1')}`,
);

const pre = (code: string, label?: string) =>
  `<figure class="code">${label ? `<figcaption>${esc(label)}</figcaption>` : ''}<pre translate="no">${esc(code)}</pre></figure>`;

const VERIFY_NODE = `import { createHmac, timingSafeEqual } from 'node:crypto';

// rawBody: the request body exactly as received (a string or Buffer), before JSON.parse.
export function verify(rawBody, header, secret, toleranceSeconds = 300) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSeconds) return false;
  const expected = createHmac('sha256', secret).update(\`\${t}.\${rawBody}\`).digest('hex');
  const given = String(parts.v1 ?? '');
  return (
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  );
}`;

const VERIFY_PYTHON = `import hashlib, hmac, time

# raw_body: the request body exactly as received (bytes), before json.loads.
def verify(raw_body: bytes, header: str, secret: str, tolerance: int = 300) -> bool:
    parts = dict(p.split("=", 1) for p in header.split(","))
    t = int(parts.get("t", "0"))
    if not t or abs(time.time() - t) > tolerance:
        return False
    expected = hmac.new(
        secret.encode(), f"{t}.".encode() + raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(parts.get("v1", ""), expected)`;

function endpoint(e: Endpoint, base: string, l: Loc): string {
  const T = (en: string, tr: string) => (l === 'tr' ? tr : en);
  const where = { path: T('path', 'yol'), query: T('query', 'sorgu'), body: T('body', 'gövde') };
  const params =
    e.params.length === 0
      ? ''
      : `<table class="params"><thead><tr><th>${T('Field', 'Alan')}</th><th>${T('In', 'Yer')}</th><th>${T('Type', 'Tür')}</th><th>${T('Description', 'Açıklama')}</th></tr></thead><tbody>${e.params
          .map(
            (p) =>
              `<tr><td><code>${esc(p.name)}</code>${p.required ? ` <span class="req">${T('required', 'zorunlu')}</span>` : ''}</td><td>${where[p.where]}</td><td><code>${esc(p.type)}</code></td><td>${esc(l === 'tr' ? p.tr : p.en)}</td></tr>`,
          )
          .join('')}</tbody></table>`;
  const url = `${base}${e.path.replace('{id}', CASE_VIEW_EXAMPLE.id)}${e.id === 'list-cases' ? '?status=active&limit=50' : ''}`;
  const curl =
    e.method === 'GET'
      ? `curl "${url}" \\\n  -H "Authorization: Bearer $EMANET_API_KEY"`
      : `curl -X POST "${url}" \\\n  -H "Authorization: Bearer $EMANET_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${(e.request ?? '{}').replace(/\n\s*/g, ' ')}'`;
  return `<section class="endpoint" id="${e.id}">
    <h3>${esc(e.title[l])}</h3>
    <p class="route"><span class="method ${e.method.toLowerCase()}">${e.method}</span><code>/api/v1${esc(e.path)}</code><span class="scope">${icon('key')}${e.scope}</span></p>
    <p>${e.text[l]}</p>
    ${params}
    <div class="samples">
      ${pre(curl, T('Request', 'İstek'))}
      ${pre(e.response, T('Response · 200', 'Yanıt · 200'))}
    </div>
  </section>`;
}

export function apiDocs(origin: string): string {
  const l: Loc = currentLocale() === 'tr' ? 'tr' : 'en';
  const T = (en: string, tr: string) => (l === 'tr' ? tr : en);
  const base = `${origin}/api/v1`;
  const toc: [string, string][] = [
    ['overview', T('Overview', 'Genel bakış')],
    ['quickstart', T('Quick start', 'Hızlı başlangıç')],
    ['auth', T('Authentication', 'Kimlik doğrulama')],
    ['conventions', T('Conventions', 'Kurallar')],
    ['idempotency', T('Idempotency and retries', 'Yinelenebilirlik ve yeniden deneme')],
    ['pagination', T('Pagination', 'Sayfalama')],
    ['limits', T('Rate limits', 'İstek sınırları')],
    ['errors', T('Errors', 'Hatalar')],
    ['lifecycle', T('A case’s life', 'Dosyanın yaşam döngüsü')],
    ['endpoints', T('Endpoints', 'Uç noktalar')],
    ['webhooks', T('Webhooks', 'Webhook’lar')],
    ['openapi', T('OpenAPI and tools', 'OpenAPI ve araçlar')],
    ['changelog', T('Changelog', 'Değişiklik günlüğü')],
  ];
  const errorRows = ERRORS.map(
    (e) =>
      `<tr><td><code>${e.code}</code></td><td>${String(e.status)}</td><td>${esc(l === 'tr' ? e.tr : e.en)}</td></tr>`,
  ).join('');
  const endpointLinks = ENDPOINTS.map(
    (e) =>
      `<a class="sub" href="#${e.id}"><span class="method ${e.method.toLowerCase()}">${e.method}</span>${esc(e.path)}</a>`,
  ).join('');
  const quick = `# 1. ${T('Add a vehicle', 'Araç ekleyin')}
curl -X POST "${base}/cases" \\
  -H "Authorization: Bearer $EMANET_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "external_ref": "K-2026-0001",
    "vin": "VF1RJA00061234567",
    "plate": "34 ABC 123",
    "make": "Renault", "model": "Clio",
    "icra_office": "İstanbul 5. İcra Dairesi",
    "icra_file_no": "2026/12345",
    "serh_date": "2026-10-01",
    "legal_basis": "rehin",
    "places": [{ "kind": "owner_home", "address": "Örnek Mah. Deneme Sk. No:1",
                 "district": "Kadıköy", "city": "İstanbul" }]
  }'

# 2. ${T('Follow what happens', 'Olanları izleyin')}
curl "${base}/events" -H "Authorization: Bearer $EMANET_API_KEY"

# 3. ${T('Confirm before it expires', 'Süresi dolmadan onaylayın')}
curl -X POST "${base}/cases/confirm" \\
  -H "Authorization: Bearer $EMANET_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "case_ids": ["<id>"] }'`;

  const body = `<div class="docs" translate="no" lang="${l}">
  <header class="page-head docs-head"><div>
    <p class="eyebrow">${T('Emanet Kurumsal API', 'Emanet Kurumsal API')} · v${API_VERSION}</p>
    <h1>${T('API reference', 'API başvurusu')}</h1>
    <p class="lede">${T('Add the vehicles that carry your seizure orders, follow each one to custody, and read your invoices, from your own systems.', 'Yakalama şerhi bulunan araçlarınızı kendi sistemlerinizden ekleyin, her birini yediemine kadar izleyin ve faturalarınızı okuyun.')}</p></div>
    <p class="actions"><a class="button" href="/docs/openapi.json" download="emanet-kurumsal-openapi.json">${icon('download')}<span>OpenAPI (JSON)</span></a> <a class="button secondary" href="/docs/openapi.yaml" download="emanet-kurumsal-openapi.yaml">${icon('download')}<span>YAML</span></a></p>
  </header>
  <div class="with-toc">
  <nav class="toc" aria-labelledby="toc-title"><strong id="toc-title">${T('On this page', 'Bu sayfada')}</strong>${toc
    .map(
      ([id, label]) =>
        `<a href="#${id}">${esc(label)}</a>${id === 'endpoints' ? endpointLinks : ''}`,
    )
    .join('')}</nav>
  <article class="prose toc-body">

  <section id="overview">
    <h2>${T('Overview', 'Genel bakış')}</h2>
    <div class="facts-grid">
      <div><span>${T('Base URL', 'Temel adres')}</span><code>${esc(base)}</code></div>
      <div><span>${T('Format', 'Biçim')}</span><strong>JSON · UTF-8 · HTTPS</strong></div>
      <div><span>${T('Authentication', 'Kimlik doğrulama')}</span><strong>${T('Bearer API key', 'Bearer API anahtarı')}</strong></div>
      <div><span>${T('Rate limit', 'İstek sınırı')}</span><strong>${T('300 requests a minute per key', 'Anahtar başına dakikada 300 istek')}</strong></div>
    </div>
    <p>${T('There are three ways to work with Emanet, and they can be mixed: the pages of Emanet Kurumsal, CSV upload, and this API. The API does what the pages do for cases: add, update, confirm, withdraw, and read. Everything you send is visible on the pages and the other way round.', 'Emanet ile çalışmanın üç yolu vardır ve birlikte kullanılabilir: Emanet Kurumsal sayfaları, CSV yükleme ve bu API. API, dosyalar için sayfaların yaptığını yapar: ekleme, güncelleme, onaylama, geri çekme ve okuma. Gönderdiğiniz her şey sayfalarda görünür; sayfalarda yaptığınız her şey API’de görünür.')}</p>
    <p class="callout">${T('<strong>What agents see.</strong> An agent sees the vehicle (plate, make, model, colour) and the city. The street addresses you send are shown only to the one agent who has claimed the vehicle, only while the claim lasts, and are erased after the case closes. Never send the debtor’s name or the amount of the debt: no field takes them, and notes must not contain them.', '<strong>Görevliler ne görür.</strong> Görevli aracı (plaka, marka, model, renk) ve ili görür. Gönderdiğiniz açık adresler yalnızca aracı üstlenen tek görevliye, yalnızca üstlenme süresince gösterilir ve dosya kapandıktan sonra silinir. Borçlunun adını veya borç tutarını hiçbir zaman göndermeyin: bunlar için alan yoktur ve notlarda yer almamalıdır.')}</p>
  </section>

  <section id="quickstart">
    <h2>${T('Quick start', 'Hızlı başlangıç')}</h2>
    <ol>
      <li>${T('In Emanet Kurumsal, an owner or admin opens <strong>Integrations → API keys</strong> and creates a key with the permissions the integration needs. The key is shown once; store it as a secret.', 'Emanet Kurumsal’da sahip veya yönetici <strong>Entegrasyonlar → API anahtarları</strong> sayfasını açar ve entegrasyonun gerektirdiği izinlerle bir anahtar oluşturur. Anahtar bir kez gösterilir; gizli bilgi olarak saklayın.')}</li>
      <li>${T('Add a vehicle, then poll <code>/events</code> or register a webhook to hear when it is delivered.', 'Bir araç ekleyin; ardından teslim edildiğini öğrenmek için <code>/events</code> uç noktasını yoklayın ya da bir webhook tanımlayın.')}</li>
      <li>${T('Confirm your open cases before they expire, on a schedule (daily is enough).', 'Açık dosyalarınızı süreleri dolmadan, zamanlanmış olarak onaylayın (günde bir kez yeterlidir).')}</li>
    </ol>
    ${pre(quick, 'curl')}
  </section>

  <section id="auth">
    <h2>${T('Authentication', 'Kimlik doğrulama')}</h2>
    <p>${T('Send the key as a Bearer token on every request:', 'Anahtarı her istekte Bearer belirteci olarak gönderin:')}</p>
    ${pre('Authorization: Bearer emk_AbCdEfGh_…')}
    <p>${T('A key belongs to one organization and acts only for it. Each key carries the permissions chosen when it was created:', 'Anahtar tek bir kuruma aittir ve yalnızca onun adına işlem yapar. Her anahtar, oluşturulurken seçilen izinleri taşır:')}</p>
    <table><thead><tr><th>${T('Permission', 'İzin')}</th><th>${T('Allows', 'Ne sağlar')}</th></tr></thead><tbody>
      <tr><td><code>cases:read</code></td><td>${T('Read cases, timelines and your custom fields.', 'Dosyaları, zaman çizelgelerini ve özel alanlarınızı okuma.')}</td></tr>
      <tr><td><code>cases:write</code></td><td>${T('Add, update, confirm and withdraw cases.', 'Dosya ekleme, güncelleme, onaylama ve geri çekme.')}</td></tr>
      <tr><td><code>events:read</code></td><td>${T('Read events.', 'Olayları okuma.')}</td></tr>
      <tr><td><code>invoices:read</code></td><td>${T('Read invoices.', 'Faturaları okuma.')}</td></tr>
    </tbody></table>
    <ul>
      <li>${T('Use one key per integration and give it only what it needs. A key can have an expiry date and can be revoked at once; creating and revoking keys is recorded in the audit log.', 'Her entegrasyon için ayrı anahtar kullanın ve yalnızca gereken izinleri verin. Anahtarın son kullanma tarihi olabilir ve anahtar hemen iptal edilebilir; anahtar oluşturma ve iptal işlemleri denetim kaydına işlenir.')}</li>
      <li>${T('Keys work only while your organization is an active partner. A suspended organization gets <code>403 partner_not_active</code>.', 'Anahtarlar yalnızca kurumunuz etkin olduğu sürece çalışır. Askıya alınan kurum <code>403 partner_not_active</code> alır.')}</li>
      <li>${T('Never put a key in a browser, a mobile app or a URL. Call the API from your servers.', 'Anahtarı tarayıcıya, mobil uygulamaya veya adrese koymayın. API’yi sunucularınızdan çağırın.')}</li>
    </ul>
  </section>

  <section id="conventions">
    <h2>${T('Conventions', 'Kurallar')}</h2>
    <table><thead><tr><th>${T('What', 'Ne')}</th><th>${T('How', 'Nasıl')}</th></tr></thead><tbody>
      <tr><td>${T('Bodies', 'Gövdeler')}</td><td>${T('JSON objects in UTF-8, at most 1 MB. Send <code>Content-Type: application/json</code>.', 'UTF-8 JSON nesneleri, en fazla 1 MB. <code>Content-Type: application/json</code> gönderin.')}</td></tr>
      <tr><td>${T('Times', 'Zamanlar')}</td><td>${T('Unix time in seconds, UTC (<code>1795800000</code>). <code>serh_date</code> is a calendar date: <code>YYYY-MM-DD</code>.', 'Saniye cinsinden Unix zamanı, UTC (<code>1795800000</code>). <code>serh_date</code> bir takvim tarihidir: <code>YYYY-AA-GG</code>.')}</td></tr>
      <tr><td>${T('Money', 'Para')}</td><td>${T('Whole kuruş: <code>1000000</code> is ₺10,000.00. Fields end in <code>_kurus</code>.', 'Tam sayı kuruş: <code>1000000</code>, ₺10.000,00 demektir. Alan adları <code>_kurus</code> ile biter.')}</td></tr>
      <tr><td>${T('IDs', 'Kimlikler')}</td><td>${T('UUIDs. Your own reference is <code>external_ref</code>.', 'UUID. Kendi referansınız <code>external_ref</code> alanıdır.')}</td></tr>
      <tr><td>${T('Plates and chassis numbers', 'Plaka ve şasi numarası')}</td><td>${T('Accepted with or without spaces; returned without (<code>34ABC123</code>).', 'Boşluklu veya boşluksuz kabul edilir; boşluksuz döner (<code>34ABC123</code>).')}</td></tr>
      <tr><td>${T('Unknown fields', 'Bilinmeyen alanlar')}</td><td>${T('Ignored at the top level; refused inside <code>attributes</code>. New fields may be added to responses at any time: ignore what you don’t know.', 'Üst düzeyde yok sayılır; <code>attributes</code> içinde reddedilir. Yanıtlara her an yeni alan eklenebilir: tanımadığınız alanları yok sayın.')}</td></tr>
      <tr><td>${T('Versioning', 'Sürümleme')}</td><td>${T('The path carries the major version (<code>/api/v1</code>). Changes that could break a client get a new path; additions don’t.', 'Yol ana sürümü taşır (<code>/api/v1</code>). İstemciyi bozabilecek değişiklikler yeni bir yol alır; eklemeler almaz.')}</td></tr>
    </tbody></table>
  </section>

  <section id="idempotency">
    <h2>${T('Idempotency and retries', 'Yinelenebilirlik ve yeniden deneme')}</h2>
    <p>${T('<code>external_ref</code> is the idempotency key. Sending the same case twice never creates two cases: the second call updates the first and confirms it. So when a request times out or you get a 5xx, send it again as it was.', '<code>external_ref</code> yinelenebilirlik anahtarıdır. Aynı dosyayı iki kez göndermek hiçbir zaman iki dosya oluşturmaz: ikinci çağrı ilkini günceller ve onaylar. Bu yüzden istek zaman aşımına uğrarsa ya da 5xx alırsanız isteği olduğu gibi yeniden gönderin.')}</p>
    <table><thead><tr><th>${T('You get', 'Yanıt')}</th><th>${T('Do', 'Yapılacak')}</th></tr></thead><tbody>
      <tr><td>${T('Timeout, 5xx', 'Zaman aşımı, 5xx')}</td><td>${T('Retry with backoff (1 s, 2 s, 4 s … up to a minute).', 'Artan bekleme ile yeniden deneyin (1 sn, 2 sn, 4 sn … bir dakikaya kadar).')}</td></tr>
      <tr><td><code>409 conflict_retry</code></td><td>${T('Retry after <code>Retry-After</code> (one second).', '<code>Retry-After</code> kadar (bir saniye) bekleyip yeniden deneyin.')}</td></tr>
      <tr><td><code>409 delivery_in_review</code></td><td>${T('The vehicle’s delivery is being checked. Retry in an hour; the case will most likely be <code>delivered</code> by then.', 'Aracın teslimi inceleniyor. Bir saat sonra yeniden deneyin; dosya büyük olasılıkla <code>delivered</code> olacaktır.')}</td></tr>
      <tr><td><code>429 rate_limited</code></td><td>${T('Wait for <code>Retry-After</code> (60 seconds).', '<code>Retry-After</code> kadar (60 saniye) bekleyin.')}</td></tr>
      <tr><td>${T('Other 4xx', 'Diğer 4xx')}</td><td>${T('Don’t retry: fix the request. <code>error</code> names what is wrong.', 'Yeniden denemeyin: isteği düzeltin. <code>error</code> neyin yanlış olduğunu söyler.')}</td></tr>
    </tbody></table>
  </section>

  <section id="pagination">
    <h2>${T('Pagination', 'Sayfalama')}</h2>
    <p>${T('Lists are paged with a cursor. A response carries <code>next_cursor</code>; pass it as <code>cursor</code> to get what follows. Cursors are opaque: don’t build or change them.', 'Listeler imleçle sayfalanır. Yanıt <code>next_cursor</code> taşır; devamını almak için onu <code>cursor</code> olarak gönderin. İmleçler opaktır: kendiniz oluşturmayın veya değiştirmeyin.')}</p>
    <ul>
      <li>${T('<code>GET /cases</code>: <code>next_cursor</code> is <code>null</code> on the last page.', '<code>GET /cases</code>: son sayfada <code>next_cursor</code> <code>null</code> olur.')}</li>
      <li>${T('<code>GET /events</code>: <code>next_cursor</code> is never <code>null</code> once you have seen an event. Store it; it is your place in the stream.', '<code>GET /events</code>: bir olay gördükten sonra <code>next_cursor</code> hiçbir zaman <code>null</code> olmaz. Saklayın; akıştaki yerinizdir.')}</li>
    </ul>
  </section>

  <section id="limits">
    <h2>${T('Rate limits', 'İstek sınırları')}</h2>
    <p>${T('300 requests a minute per key. Past that, requests get <code>429 rate_limited</code> with <code>Retry-After: 60</code>. Requests with a wrong key are counted per IP address and slowed separately, so a misconfigured client can’t lock out your other integrations.', 'Anahtar başına dakikada 300 istek. Aşıldığında istekler <code>Retry-After: 60</code> ile <code>429 rate_limited</code> alır. Hatalı anahtarla yapılan istekler IP adresi başına ayrı sayılır ve yavaşlatılır; böylece yanlış yapılandırılmış bir istemci diğer entegrasyonlarınızı kilitleyemez.')}</p>
    <p>${T('For a first load of many cases, CSV upload in Emanet Kurumsal is usually simpler; use the API for the changes after that.', 'Çok sayıda dosyanın ilk yüklemesi için Emanet Kurumsal’daki CSV yükleme genellikle daha kolaydır; sonraki değişiklikler için API’yi kullanın.')}</p>
  </section>

  <section id="errors">
    <h2>${T('Errors', 'Hatalar')}</h2>
    <p>${T('An error is a JSON object with a stable <code>error</code> code and, sometimes, a <code>detail</code> for a person to read. Branch on <code>error</code>; never on <code>detail</code>, whose wording can change.', 'Hata, kararlı bir <code>error</code> kodu ve bazen insanın okuması için bir <code>detail</code> içeren JSON nesnesidir. Kararlarınızı <code>error</code> üzerinden verin; ifadesi değişebilen <code>detail</code> üzerinden asla.')}</p>
    ${pre(json({ error: 'invalid_place', detail: 'lat/lng' }))}
    <table class="errors"><thead><tr><th>${T('Code', 'Kod')}</th><th>HTTP</th><th>${T('Meaning and what to do', 'Anlamı ve yapılacak')}</th></tr></thead><tbody>${errorRows}</tbody></table>
  </section>

  <section id="lifecycle">
    <h2>${T('A case’s life', 'Dosyanın yaşam döngüsü')}</h2>
    <ol class="flow"><li>pending_identity</li><li>active</li><li>delivered</li></ol>
    <table><thead><tr><th>${T('Status', 'Durum')}</th><th>${T('Meaning', 'Anlamı')}</th><th>${T('How it ends', 'Nasıl biter')}</th></tr></thead><tbody>
      <tr><td><code>pending_identity</code></td><td>${T('Emanet is settling which vehicle this is. Agents don’t see it.', 'Emanet aracın hangisi olduğunu belirliyor. Görevliler görmez.')}</td><td>${T('<code>active</code>, or <code>withdrawn</code> with a <code>case.rejected</code> event.', '<code>active</code> ya da <code>case.rejected</code> olayıyla <code>withdrawn</code>.')}</td></tr>
      <tr><td><code>active</code></td><td>${T('Agents can look for the vehicle.', 'Görevliler aracı arayabilir.')}</td><td>${T('<code>delivered</code>, <code>withdrawn</code> (by you) or <code>expired</code>.', '<code>delivered</code>, <code>withdrawn</code> (sizin tarafınızdan) ya da <code>expired</code>.')}</td></tr>
      <tr><td><code>delivered</code></td><td>${T('The police seized the vehicle and a custodian car park took it in. The fee is owed. Final.', 'Kolluk aracı yakaladı ve yediemin otoparkı teslim aldı. Ücret doğdu. Kesindir.')}</td><td>—</td></tr>
      <tr><td><code>withdrawn</code></td><td>${T('You withdrew it, or its identity was rejected. No fee.', 'Siz geri çektiniz ya da kimliği reddedildi. Ücret yok.')}</td><td>${T('Send the case again to reopen it.', 'Yeniden açmak için dosyayı yeniden gönderin.')}</td></tr>
      <tr><td><code>expired</code></td><td>${T('Not confirmed before <code>expires_at</code>. Agents stopped looking. No fee.', '<code>expires_at</code> öncesinde onaylanmadı. Görevliler aramayı bıraktı. Ücret yok.')}</td><td>${T('Send the case again to reopen it.', 'Yeniden açmak için dosyayı yeniden gönderin.')}</td></tr>
    </tbody></table>
    <p>${T('<strong>Confirming.</strong> Every open case has an <code>expires_at</code>. Confirm it before then, with <code>POST /cases/confirm</code> or by sending the case again, and it moves forward by your organization’s confirmation interval (set in your agreement, usually 14 days). This is how Emanet knows the seizure order still stands.', '<strong>Onaylama.</strong> Her açık dosyanın bir <code>expires_at</code> değeri vardır. Bu zamandan önce <code>POST /cases/confirm</code> ile ya da dosyayı yeniden göndererek onaylayın; değer kurumunuzun teyit aralığı kadar (sözleşmenizde belirlenir, genellikle 14 gün) ileri alınır. Emanet, yakalama şerhinin sürdüğünü böyle bilir.')}</p>
  </section>

  <section id="endpoints">
    <h2>${T('Endpoints', 'Uç noktalar')}</h2>
    <p>${T('Paths are relative to', 'Yollar şu adrese göredir:')} <code>${esc(base)}</code>. ${T('The key icon shows the permission an endpoint needs.', 'Anahtar simgesi uç noktanın gerektirdiği izni gösterir.')}</p>
    ${ENDPOINTS.map((e) => endpoint(e, base, l)).join('')}
  </section>

  <section id="webhooks">
    <h2>${T('Webhooks', 'Webhook’lar')}</h2>
    <p>${T('Instead of polling <code>/events</code>, register an HTTPS address under <strong>Integrations → Webhooks</strong> and choose the events it wants. Emanet sends each event as a POST with a JSON body, the same object <code>/events</code> returns.', '<code>/events</code> uç noktasını yoklamak yerine <strong>Entegrasyonlar → Webhook’lar</strong> altında bir HTTPS adresi tanımlayın ve almak istediği olayları seçin. Emanet her olayı JSON gövdeli bir POST olarak gönderir; gövde <code>/events</code> uç noktasının döndürdüğü nesnenin aynısıdır.')}</p>
    <table><thead><tr><th>${T('Event', 'Olay')}</th><th>${T('When', 'Ne zaman')}</th><th><code>data</code></th></tr></thead><tbody>
      <tr><td><code>case.delivered</code></td><td>${T('The vehicle reached custody and Emanet confirmed it. The custodian’s documents are on the case.', 'Araç yediemine ulaştı ve Emanet teslimi onayladı. Yediemin belgeleri dosyada.')}</td><td><code>case_id</code>, <code>external_ref</code>, <code>delivered_at</code></td></tr>
      <tr><td><code>case.expired</code></td><td>${T('The case wasn’t confirmed in time.', 'Dosya zamanında onaylanmadı.')}</td><td><code>case_id</code>, <code>external_ref</code></td></tr>
      <tr><td><code>case.rejected</code></td><td>${T('Emanet couldn’t accept the vehicle’s identity; the case is withdrawn.', 'Emanet aracın kimliğini kabul edemedi; dosya geri çekildi.')}</td><td><code>case_id</code>, <code>external_ref</code>, <code>reason</code></td></tr>
      <tr><td><code>invoice.issued</code></td><td>${T('An invoice was issued to you.', 'Adınıza fatura kesildi.')}</td><td><code>invoice_id</code>, <code>total_kurus</code></td></tr>
    </tbody></table>
    ${pre(
      `POST /your/endpoint HTTP/1.1
Content-Type: application/json
User-Agent: Emanet-Webhooks/1
Emanet-Event-Id: ${EVENT_EXAMPLES['case.delivered'].id}
Emanet-Signature: t=1796150000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd

${JSON.stringify(EVENT_EXAMPLES['case.delivered'])}`,
      T('A delivery', 'Bir gönderim'),
    )}
    <h3>${T('Verify the signature', 'İmzayı doğrulayın')}</h3>
    <p>${T('Each request is signed with the webhook’s secret (shown once when you create the webhook). <code>Emanet-Signature</code> is <code>t=&lt;unix time&gt;,v1=&lt;hex&gt;</code>, where the hex is HMAC-SHA256 of <code>&lt;t&gt;.&lt;raw body&gt;</code>. Compute it over the body exactly as received, compare in constant time, and refuse a <code>t</code> more than five minutes from your clock.', 'Her istek webhook’un gizli anahtarıyla imzalanır (webhook oluşturulurken bir kez gösterilir). <code>Emanet-Signature</code>, <code>t=&lt;unix zamanı&gt;,v1=&lt;hex&gt;</code> biçimindedir; hex, <code>&lt;t&gt;.&lt;ham gövde&gt;</code> değerinin HMAC-SHA256 özetidir. Özeti gövdenin alındığı hâli üzerinden hesaplayın, sabit zamanlı karşılaştırın ve saatinizden beş dakikadan fazla sapan <code>t</code> değerini reddedin.')}</p>
    <div class="samples">${pre(VERIFY_NODE, 'Node.js')}${pre(VERIFY_PYTHON, 'Python')}</div>
    <h3>${T('Delivery, retries and order', 'Gönderim, yeniden deneme ve sıra')}</h3>
    <ul>
      <li>${T('Answer with any <strong>2xx</strong> within <strong>10 seconds</strong>. Do the work after you have answered.', '<strong>10 saniye</strong> içinde herhangi bir <strong>2xx</strong> ile yanıt verin. İşi yanıt verdikten sonra yapın.')}</li>
      <li>${T('Anything else is retried after 1 minute, 5 minutes, 30 minutes, 2 hours, 6 hours, 12 hours and 24 hours, then given up.', 'Diğer her yanıtta 1 dakika, 5 dakika, 30 dakika, 2 saat, 6 saat, 12 saat ve 24 saat sonra yeniden denenir; ardından vazgeçilir.')}</li>
      <li>${T('A delivery can arrive more than once, and events can arrive out of order. Use <code>Emanet-Event-Id</code> to ignore a repeat, and <code>created_at</code> to order.', 'Bir gönderim birden fazla kez gelebilir ve olaylar sırasız gelebilir. Tekrarı yok saymak için <code>Emanet-Event-Id</code>, sıralamak için <code>created_at</code> kullanın.')}</li>
      <li>${T('A webhook that keeps failing is switched off and your operations contact is mailed. Nothing is lost: read what you missed from <code>/events</code>, then switch the webhook back on.', 'Sürekli hata veren webhook kapatılır ve operasyon iletişim adresinize e-posta gider. Hiçbir şey kaybolmaz: kaçırdıklarınızı <code>/events</code> üzerinden okuyun, ardından webhook’u yeniden açın.')}</li>
      <li>${T('The address must be public HTTPS. Redirects aren’t followed.', 'Adres herkese açık HTTPS olmalıdır. Yönlendirmeler izlenmez.')}</li>
    </ul>
  </section>

  <section id="openapi">
    <h2>${T('OpenAPI and tools', 'OpenAPI ve araçlar')}</h2>
    <p>${T('The whole API is described in an OpenAPI 3.1 document: every endpoint, schema, error and webhook, with examples. It is generated from the same source as this page.', 'API’nin tamamı bir OpenAPI 3.1 belgesinde tanımlıdır: her uç nokta, şema, hata ve webhook, örnekleriyle. Bu sayfayla aynı kaynaktan üretilir.')}</p>
    <div class="facts-grid">
      <div><span>JSON</span><code>${esc(origin)}/docs/openapi.json</code></div>
      <div><span>YAML</span><code>${esc(origin)}/docs/openapi.yaml</code></div>
    </div>
    <table><thead><tr><th>${T('Tool', 'Araç')}</th><th>${T('How to import', 'Nasıl içe aktarılır')}</th></tr></thead><tbody>
      <tr><td>Postman</td><td>${T('Import → paste the JSON address. Set the collection’s authorization to Bearer Token with your key.', 'Import → JSON adresini yapıştırın. Koleksiyonun yetkilendirmesini anahtarınızla Bearer Token olarak ayarlayın.')}</td></tr>
      <tr><td>Insomnia · Bruno</td><td>${T('Import → From URL, with either address.', 'Import → From URL; iki adresten biriyle.')}</td></tr>
      <tr><td>Swagger UI · Redoc</td><td>${T('Point them at the JSON address; it allows cross-origin reads.', 'JSON adresini gösterin; başka kaynaktan okumaya izin verir.')}</td></tr>
      <tr><td>${T('Code generators', 'Kod üreteçleri')}</td><td><code>npx @openapitools/openapi-generator-cli generate -i ${esc(origin)}/docs/openapi.json -g typescript-fetch -o ./emanet</code></td></tr>
    </tbody></table>
  </section>

  <section id="changelog">
    <h2>${T('Changelog', 'Değişiklik günlüğü')}</h2>
    <table><thead><tr><th>${T('Version', 'Sürüm')}</th><th>${T('Date', 'Tarih')}</th><th>${T('Change', 'Değişiklik')}</th></tr></thead><tbody>
      <tr><td>1.3.0</td><td>2026-11-28</td><td>${T('A place’s <code>city</code> must be one of Turkey’s 81 provinces and its <code>district</code> a district of that province; any spelling or the plate code is accepted and the official name is stored and returned. Otherwise <code>invalid_place</code> with detail <code>city</code> or <code>district</code>.', 'Bir yerin <code>city</code> alanı Türkiye’nin 81 ilinden biri, <code>district</code> alanı o ilin bir ilçesi olmalıdır; her yazım ya da plaka kodu kabul edilir, resmî ad saklanır ve döndürülür. Aksi hâlde detail <code>city</code> ya da <code>district</code> olan <code>invalid_place</code>.')}</td></tr>
      <tr><td>1.2.0</td><td>2026-11-28</td><td>${T('OpenAPI 3.1 document published. The number of webhooks per organization and the failures after which one is switched off are now set by Emanet per deployment.', 'OpenAPI 3.1 belgesi yayımlandı. Kurum başına webhook sayısı ve webhook’un kaç hatadan sonra kapatılacağı artık Emanet tarafından ayarlanıyor.')}</td></tr>
      <tr><td>1.1.0</td><td>2026-11-27</td><td>${T('Keys work only for active partners (<code>partner_not_active</code>). New conflict <code>delivery_in_review</code>. Each webhook delivery is signed with the time it is sent.', 'Anahtarlar yalnızca etkin kurumlar için çalışır (<code>partner_not_active</code>). Yeni çakışma <code>delivery_in_review</code>. Her webhook gönderimi gönderildiği zamanla imzalanır.')}</td></tr>
      <tr><td>1.0.0</td><td>2026-11</td><td>${T('First version: cases, events, invoices, custom fields, webhooks.', 'İlk sürüm: dosyalar, olaylar, faturalar, özel alanlar, webhook’lar.')}</td></tr>
    </tbody></table>
    <p>${T('Questions, or something this page gets wrong:', 'Sorularınız ya da bu sayfada yanlış bulduğunuz bir şey için:')} <a href="mailto:iletisim@emanet.dev">iletisim@emanet.dev</a></p>
  </section>

  </article></div></div>`;
  return layout('API', { signedIn: false }, body);
}
