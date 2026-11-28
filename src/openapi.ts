/**
 * The partners' API as an OpenAPI 3.1 document: the machine-readable twin of the reference page
 * (src/api-docs.ts). Served at /docs/openapi.json and /docs/openapi.yaml so it can be imported
 * straight into Postman, Insomnia, Swagger UI or a code generator.
 *
 * `test/openapi.test.ts` fails when a route in src/api.ts is missing here, or the other way round.
 */

export const API_VERSION = '1.3.0';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Schema = { [key: string]: Json };

const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
const unix = (description: string): Schema => ({
  type: 'integer',
  format: 'int64',
  description: `${description} Unix time in seconds (UTC).`,
  examples: [1795800000],
});
const kurus = (description: string): Schema => ({
  type: 'integer',
  description: `${description} In kuruş: 1 000 000 is ₺10,000.00.`,
  examples: [1000000],
});

/** Every error code the API returns, with its HTTP status and what to do about it. */
export const ERRORS: {
  code: string;
  status: number;
  en: string;
  tr: string;
}[] = [
  {
    code: 'invalid_json',
    status: 400,
    en: 'The body isn’t valid JSON, isn’t an object, or is larger than 1 MB.',
    tr: 'Gövde geçerli JSON değil, nesne değil ya da 1 MB’tan büyük.',
  },
  {
    code: 'invalid_status',
    status: 400,
    en: 'The status filter isn’t one of the case statuses.',
    tr: 'Durum filtresi dosya durumlarından biri değil.',
  },
  {
    code: 'invalid_cursor',
    status: 400,
    en: 'The cursor wasn’t issued by this API. Start again without one.',
    tr: 'İmleç bu API tarafından verilmemiş. İmleçsiz yeniden başlayın.',
  },
  {
    code: 'invalid_key',
    status: 401,
    en: 'No API key, or the key is wrong, revoked or expired.',
    tr: 'API anahtarı yok ya da anahtar hatalı, iptal edilmiş veya süresi dolmuş.',
  },
  {
    code: 'insufficient_scope',
    status: 403,
    en: 'The key lacks the permission this endpoint needs.',
    tr: 'Anahtarda bu uç noktanın gerektirdiği izin yok.',
  },
  {
    code: 'partner_not_active',
    status: 403,
    en: 'The organization isn’t an active partner (not approved yet, or suspended).',
    tr: 'Kurum etkin değil (henüz onaylanmadı ya da askıya alındı).',
  },
  {
    code: 'not_a_partner',
    status: 403,
    en: 'The key’s organization isn’t known to Emanet.',
    tr: 'Anahtarın kurumu Emanet’te kayıtlı değil.',
  },
  {
    code: 'not_found',
    status: 404,
    en: 'No such case, invoice or path for this organization.',
    tr: 'Bu kurum için böyle bir dosya, fatura veya yol yok.',
  },
  {
    code: 'duplicate_case',
    status: 409,
    en: 'Another of your cases, with a different external_ref, is already open on this vehicle.',
    tr: 'Bu araç için farklı external_ref ile açık başka bir dosyanız var.',
  },
  {
    code: 'case_closed',
    status: 409,
    en: 'The case is closed: a delivered case can’t be changed, and only an open case can be withdrawn.',
    tr: 'Dosya kapalı: teslim edilen dosya değiştirilemez, yalnızca açık dosya geri çekilebilir.',
  },
  {
    code: 'vin_mismatch',
    status: 409,
    en: 'The chassis number differs from the one this case was created with.',
    tr: 'Şasi numarası, dosyanın oluşturulduğu numaradan farklı.',
  },
  {
    code: 'delivery_in_review',
    status: 409,
    en: 'A delivery of this vehicle is being reviewed; the case can’t change until it is decided. Retry later.',
    tr: 'Bu aracın teslimi inceleniyor; karar verilene kadar dosya değiştirilemez. Daha sonra yeniden deneyin.',
  },
  {
    code: 'conflict_retry',
    status: 409,
    en: 'Two changes met. Retry after the Retry-After header (one second).',
    tr: 'İki değişiklik çakıştı. Retry-After başlığı kadar (bir saniye) bekleyip yeniden deneyin.',
  },
  {
    code: 'no_price_list',
    status: 422,
    en: 'No price list is set for your organization yet. Contact Emanet.',
    tr: 'Kurumunuz için henüz fiyat listesi tanımlanmadı. Emanet ile iletişime geçin.',
  },
  {
    code: 'invalid_external_ref',
    status: 422,
    en: 'external_ref is missing or longer than 100 characters.',
    tr: 'external_ref eksik ya da 100 karakterden uzun.',
  },
  {
    code: 'invalid_plate',
    status: 422,
    en: 'Not a Turkish plate: province 01–81, one to three letters, two to four digits.',
    tr: 'Türk plakası değil: il kodu 01–81, bir ila üç harf, iki ila dört rakam.',
  },
  {
    code: 'invalid_vin',
    status: 422,
    en: 'A chassis number has 17 characters, without I, O and Q.',
    tr: 'Şasi numarası 17 karakterdir; I, O ve Q içermez.',
  },
  {
    code: 'invalid_vehicle',
    status: 422,
    en: 'make and model are required, up to 60 characters each.',
    tr: 'make ve model zorunludur; her biri en fazla 60 karakter.',
  },
  {
    code: 'invalid_year',
    status: 422,
    en: 'year is a whole number from 1950 to 2100.',
    tr: 'year 1950 ile 2100 arasında bir tam sayıdır.',
  },
  {
    code: 'invalid_colour',
    status: 422,
    en: 'colour is up to 40 characters.',
    tr: 'colour en fazla 40 karakterdir.',
  },
  {
    code: 'invalid_icra_file',
    status: 422,
    en: 'icra_office (up to 120 characters) and icra_file_no (up to 40) are required.',
    tr: 'icra_office (en fazla 120 karakter) ve icra_file_no (en fazla 40) zorunludur.',
  },
  {
    code: 'invalid_serh_date',
    status: 422,
    en: 'serh_date is a date as YYYY-MM-DD.',
    tr: 'serh_date YYYY-AA-GG biçiminde bir tarihtir.',
  },
  {
    code: 'invalid_legal_basis',
    status: 422,
    en: 'legal_basis is "rehin" or "haciz".',
    tr: 'legal_basis "rehin" ya da "haciz" olmalıdır.',
  },
  {
    code: 'invalid_places',
    status: 422,
    en: 'places is a list of at most 10.',
    tr: 'places en fazla 10 öğeli bir listedir.',
  },
  {
    code: 'invalid_place',
    status: 422,
    en: 'A place is wrong; detail names the part: kind, address, city (not one of the 81 provinces), district (not a district of that province), lat/lng or note.',
    tr: 'Bir yer hatalı; detail hangi kısmın hatalı olduğunu söyler: kind, address, city (81 ilden biri değil), district (o ilin ilçesi değil), lat/lng veya note.',
  },
  {
    code: 'invalid_attributes',
    status: 422,
    en: 'attributes must be an object of your custom fields.',
    tr: 'attributes, özel alanlarınızdan oluşan bir nesne olmalıdır.',
  },
  {
    code: 'unknown_field',
    status: 422,
    en: 'A key in attributes isn’t one of your custom fields; detail names it. See GET /schema.',
    tr: 'attributes içindeki bir anahtar özel alanlarınızdan değil; detail adını verir. GET /schema’ya bakın.',
  },
  {
    code: 'invalid_field',
    status: 422,
    en: 'A custom field’s value is missing or of the wrong type; detail names it.',
    tr: 'Bir özel alanın değeri eksik ya da türü yanlış; detail adını verir.',
  },
  {
    code: 'deprecated_field',
    status: 422,
    en: 'A custom field that was retired got a new value; detail names it.',
    tr: 'Kullanımdan kaldırılmış bir özel alana yeni değer gönderildi; detail adını verir.',
  },
  {
    code: 'invalid_reason',
    status: 422,
    en: 'reason is required, up to 200 characters.',
    tr: 'reason zorunludur; en fazla 200 karakter.',
  },
  {
    code: 'invalid_case_ids',
    status: 422,
    en: 'case_ids is a list of 1 to 1000 case IDs.',
    tr: 'case_ids 1 ile 1000 arasında dosya kimliği içeren bir listedir.',
  },
  {
    code: 'rate_limited',
    status: 429,
    en: 'Too many requests. Wait for the Retry-After header (60 seconds).',
    tr: 'Çok fazla istek. Retry-After başlığı kadar (60 saniye) bekleyin.',
  },
];

const errorResponse = (description: string, codes: string[]): Schema => ({
  description,
  content: {
    'application/json': {
      schema: ref('Error'),
      examples: Object.fromEntries(
        codes.map((code) => [code, { value: { error: code } }]),
      ) as Schema,
    },
  },
});

const jsonBody = (schema: Schema, example?: Json): Schema => ({
  'application/json': example === undefined ? { schema } : { schema, example },
});

export const CASE_EXAMPLE = {
  external_ref: 'K-2026-0001',
  vin: 'VF1RJA00061234567',
  plate: '34 ABC 123',
  make: 'Renault',
  model: 'Clio',
  year: 2021,
  colour: 'Beyaz',
  icra_office: 'İstanbul 5. İcra Dairesi',
  icra_file_no: '2026/12345',
  serh_date: '2026-10-01',
  legal_basis: 'rehin',
  places: [
    {
      kind: 'owner_home',
      address: 'Örnek Mah. Deneme Sk. No:1 D:2',
      district: 'Kadıköy',
      city: 'İstanbul',
      lat: 40.9903,
      lng: 29.0291,
      note: 'Araç genellikle arka sokağa park ediliyor.',
    },
  ],
  attributes: {},
  vehicle_attributes: {},
} as const;

export const CASE_VIEW_EXAMPLE = {
  id: '0b6f6d0e-6f0e-4c56-9d6b-3f6f1f3c2a10',
  external_ref: 'K-2026-0001',
  status: 'active',
  vehicle: {
    vin: 'VF1RJA00061234567',
    plate: '34ABC123',
    make: 'Renault',
    model: 'Clio',
    year: 2021,
    colour: 'Beyaz',
    attributes: {},
  },
  icra_office: 'İstanbul 5. İcra Dairesi',
  icra_file_no: '2026/12345',
  serh_date: '2026-10-01',
  legal_basis: 'rehin',
  places: [
    {
      id: '7a1d1c1e-2f8b-4a2a-9b65-0d0f8a7b6c11',
      kind: 'owner_home',
      address: 'Örnek Mah. Deneme Sk. No:1 D:2',
      district: 'Kadıköy',
      city: 'İstanbul',
      lat: 40.9903,
      lng: 29.0291,
      note: 'Araç genellikle arka sokağa park ediliyor.',
    },
  ],
  attributes: {},
  fee_kurus: 1000000,
  last_confirmed_at: 1795800000,
  expires_at: 1797009600,
  delivered_at: null,
  created_at: 1795800000,
  updated_at: 1795800000,
} as const;

export const EVENT_EXAMPLES = {
  'case.delivered': {
    id: '5d0c8f66-0a5e-4b61-8d1c-1b1e7f0a9c21',
    type: 'case.delivered',
    created_at: 1796150000,
    data: {
      case_id: '0b6f6d0e-6f0e-4c56-9d6b-3f6f1f3c2a10',
      external_ref: 'K-2026-0001',
      delivered_at: 1796150000,
    },
  },
  'case.expired': {
    id: '0f4a2b1c-7d3e-4c2b-a1f0-9e8d7c6b5a43',
    type: 'case.expired',
    created_at: 1797009600,
    data: { case_id: '0b6f6d0e-6f0e-4c56-9d6b-3f6f1f3c2a10', external_ref: 'K-2026-0001' },
  },
  'case.rejected': {
    id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c65',
    type: 'case.rejected',
    created_at: 1795900000,
    data: {
      case_id: '0b6f6d0e-6f0e-4c56-9d6b-3f6f1f3c2a10',
      external_ref: 'K-2026-0001',
      reason: 'Şasi numarası ruhsattaki numarayla eşleşmiyor.',
    },
  },
  'invoice.issued': {
    id: '3c2b1a09-8f7e-4d6c-b5a4-3f2e1d0c9b87',
    type: 'invoice.issued',
    created_at: 1796400000,
    data: { invoice_id: 'a4b3c2d1-0e9f-4a8b-9c7d-6e5f4a3b2c10', total_kurus: 1200000 },
  },
} as const;

/** The OpenAPI document for the API served at `origin`. */
export function openapi(origin: string): Schema {
  const auth = [{ apiKey: [] }] as Json;
  const common = {
    '401': errorResponse('No valid API key.', ['invalid_key']),
    '403': errorResponse('The key may not do this, or the organization isn’t active.', [
      'insufficient_scope',
      'partner_not_active',
    ]),
    '429': {
      ...errorResponse('Too many requests.', ['rate_limited']),
      headers: {
        'Retry-After': { schema: { type: 'integer' }, description: 'Seconds to wait.' },
      },
    },
  } as Schema;
  const caseId = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'The case’s ID, as returned when it was added.',
    schema: { type: 'string', format: 'uuid' },
  } as Schema;
  return {
    openapi: '3.1.0',
    info: {
      title: 'Emanet Kurumsal API',
      version: API_VERSION,
      summary:
        'Add vehicles that carry a seizure order, follow them to custody, and read your invoices.',
      description: [
        'The API of Emanet Kurumsal, for creditors (banks, asset-management companies, leasing companies, law firms).',
        '',
        '- **JSON over HTTPS.** Every request and response body is JSON in UTF-8.',
        '- **One organization per key.** A key reads and writes only its own organization’s cases.',
        '- **Idempotent writes.** `external_ref` is your own reference: sending a case with the same `external_ref` again updates it and confirms it, so a retry is always safe.',
        '- **Times** are Unix seconds (UTC), except `serh_date`, a calendar date (`YYYY-MM-DD`).',
        '- **Money** is in kuruş (integer): `1000000` is ₺10,000.00.',
        '- **Errors** are `{ "error": "<code>", "detail": "<text>" }`. Branch on `error`; `detail` is for people.',
        '',
        `Human-readable reference: ${origin}/docs/api`,
      ].join('\n'),
      contact: { name: 'Emanet', email: 'iletisim@emanet.dev', url: 'https://emanet.dev' },
      termsOfService: 'https://emanet.dev/kullanim-sartlari',
    },
    servers: [{ url: `${origin}/api/v1`, description: 'Production' }],
    externalDocs: { description: 'API reference', url: `${origin}/docs/api` },
    tags: [
      { name: 'Cases', description: 'One creditor’s claim on one vehicle.' },
      {
        name: 'Custom fields',
        description: 'The extra fields your organization has on cases, vehicles and places.',
      },
      {
        name: 'Events',
        description:
          'What happened to your cases, for polling. The same events are sent to webhooks.',
      },
      { name: 'Invoices', description: 'What Emanet has invoiced you for delivered vehicles.' },
    ],
    security: auth,
    paths: {
      '/cases': {
        post: {
          tags: ['Cases'],
          operationId: 'upsertCase',
          summary: 'Add or update a case',
          description:
            'Adds a case, or updates your case with the same `external_ref`. Sending a case again also confirms that its seizure order still stands, which moves `expires_at` forward. Needs `cases:write`.',
          requestBody: {
            required: true,
            content: jsonBody(ref('CaseInput'), CASE_EXAMPLE as unknown as Json),
          },
          responses: {
            '200': {
              description: 'The case as stored.',
              content: jsonBody(ref('Case'), CASE_VIEW_EXAMPLE as unknown as Json),
            },
            '400': errorResponse('The body isn’t a JSON object.', ['invalid_json']),
            ...common,
            '409': errorResponse('The case can’t be changed now.', [
              'duplicate_case',
              'case_closed',
              'vin_mismatch',
              'delivery_in_review',
              'conflict_retry',
            ]),
            '422': errorResponse('A field is missing or wrong; `error` names it.', [
              'invalid_plate',
              'invalid_vin',
              'invalid_serh_date',
              'unknown_field',
            ]),
          },
        },
        get: {
          tags: ['Cases'],
          operationId: 'listCases',
          summary: 'List cases',
          description:
            'Your cases, oldest change first, in pages. Pass `next_cursor` back as `cursor` until it is `null`. To sync, remember the largest `updated_at` you have seen and pass it as `updated_since`. Needs `cases:read`.',
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: ref('CaseStatus'),
              description: 'Only cases in this status.',
            },
            {
              name: 'updated_since',
              in: 'query',
              schema: { type: 'integer', format: 'int64' },
              description: 'Only cases changed after this Unix time.',
            },
            {
              name: 'cursor',
              in: 'query',
              schema: { type: 'string' },
              description: 'The `next_cursor` of the previous page.',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
              description: 'Cases per page.',
            },
          ],
          responses: {
            '200': {
              description: 'A page of cases.',
              content: jsonBody(
                {
                  type: 'object',
                  required: ['cases', 'next_cursor'],
                  properties: {
                    cases: { type: 'array', items: ref('Case') },
                    next_cursor: {
                      type: ['string', 'null'],
                      description: 'Pass as `cursor` for the next page; `null` on the last page.',
                    },
                  },
                },
                { cases: [CASE_VIEW_EXAMPLE as unknown as Json], next_cursor: null },
              ),
            },
            '400': errorResponse('A query parameter is wrong.', [
              'invalid_status',
              'invalid_cursor',
            ]),
            ...common,
          },
        },
      },
      '/cases/{id}': {
        get: {
          tags: ['Cases'],
          operationId: 'getCase',
          summary: 'Get a case',
          description: 'Needs `cases:read`.',
          parameters: [caseId],
          responses: {
            '200': {
              description: 'The case.',
              content: jsonBody(ref('Case'), CASE_VIEW_EXAMPLE as unknown as Json),
            },
            ...common,
            '404': errorResponse('No such case.', ['not_found']),
          },
        },
      },
      '/cases/{id}/timeline': {
        get: {
          tags: ['Cases'],
          operationId: 'getCaseTimeline',
          summary: 'Get a case’s timeline',
          description:
            'What happened to the case and when, oldest first. States and times only: never who the agent was. Needs `cases:read`.',
          parameters: [caseId],
          responses: {
            '200': {
              description: 'The timeline.',
              content: jsonBody({ type: 'array', items: ref('TimelineEntry') }, [
                { event: 'created', at: 1795800000 },
                { event: 'delivered', at: 1796150000 },
              ]),
            },
            ...common,
            '404': errorResponse('No such case.', ['not_found']),
          },
        },
      },
      '/cases/{id}/withdraw': {
        post: {
          tags: ['Cases'],
          operationId: 'withdrawCase',
          summary: 'Withdraw a case',
          description:
            'Stops the search at once: the debt was paid, or the seizure order was lifted. Agents no longer see the vehicle unless another of its cases is active. No fee is owed. Needs `cases:write`.',
          parameters: [caseId],
          requestBody: {
            required: true,
            content: jsonBody(
              {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: {
                    type: 'string',
                    maxLength: 200,
                    description: 'Why, for your own records and Emanet’s audit log.',
                  },
                },
              },
              { reason: 'Borç ödendi; şerh kaldırıldı.' },
            ),
          },
          responses: {
            '200': { description: 'The case, now withdrawn.', content: jsonBody(ref('Case')) },
            '400': errorResponse('The body isn’t `{ "reason": "…" }`.', ['invalid_json']),
            ...common,
            '404': errorResponse('No such case.', ['not_found']),
            '409': errorResponse('The case can’t be withdrawn now.', [
              'case_closed',
              'delivery_in_review',
            ]),
            '422': errorResponse('The reason is missing or too long.', ['invalid_reason']),
          },
        },
      },
      '/cases/confirm': {
        post: {
          tags: ['Cases'],
          operationId: 'confirmCases',
          summary: 'Confirm cases',
          description:
            'Confirms that the seizure orders of these cases still stand, which moves their `expires_at` forward by your organization’s confirmation interval. A case that isn’t confirmed in time expires and agents stop looking. IDs that aren’t yours or aren’t open are skipped. Needs `cases:write`.',
          requestBody: {
            required: true,
            content: jsonBody(
              {
                type: 'object',
                required: ['case_ids'],
                properties: {
                  case_ids: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 1000,
                    items: { type: 'string', format: 'uuid' },
                  },
                },
              },
              { case_ids: ['0b6f6d0e-6f0e-4c56-9d6b-3f6f1f3c2a10'] },
            ),
          },
          responses: {
            '200': {
              description: 'How many cases were confirmed.',
              content: jsonBody(
                {
                  type: 'object',
                  required: ['confirmed'],
                  properties: { confirmed: { type: 'integer' } },
                },
                { confirmed: 1 },
              ),
            },
            '400': errorResponse('The body isn’t `{ "case_ids": ["…"] }`.', ['invalid_json']),
            ...common,
            '422': errorResponse('The list is empty or too long.', ['invalid_case_ids']),
          },
        },
      },
      '/schema': {
        get: {
          tags: ['Custom fields'],
          operationId: 'getSchema',
          summary: 'Get your custom fields',
          description:
            'The extra fields Emanet has defined for your organization, per entity. Their keys are what `attributes` (case), `vehicle_attributes` (vehicle) and a place’s `attributes` accept. Needs `cases:read`.',
          responses: {
            '200': {
              description: 'The fields, per entity.',
              content: jsonBody({
                type: 'object',
                required: ['case', 'vehicle', 'place'],
                properties: {
                  case: { type: 'array', items: ref('Field') },
                  vehicle: { type: 'array', items: ref('Field') },
                  place: { type: 'array', items: ref('Field') },
                },
              }),
            },
            ...common,
          },
        },
      },
      '/events': {
        get: {
          tags: ['Events'],
          operationId: 'listEvents',
          summary: 'List events',
          description:
            'Events for your organization, oldest first. Keep the `next_cursor` you were given and pass it as `cursor` next time: you get only what is new. When nothing is new, `events` is empty and `next_cursor` is the cursor you sent. Use this instead of webhooks, or to catch up after your endpoint was down. Needs `events:read`.',
          parameters: [
            {
              name: 'cursor',
              in: 'query',
              schema: { type: 'string' },
              description: 'The `next_cursor` you were given last.',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
              description: 'Events per call.',
            },
          ],
          responses: {
            '200': {
              description: 'Events after the cursor.',
              content: jsonBody(
                {
                  type: 'object',
                  required: ['events', 'next_cursor'],
                  properties: {
                    events: { type: 'array', items: ref('Event') },
                    next_cursor: {
                      type: ['string', 'null'],
                      description: 'Store this and send it as `cursor` next time.',
                    },
                  },
                },
                {
                  events: [EVENT_EXAMPLES['case.delivered']],
                  next_cursor: '1796150000.5d0c8f66-0a5e-4b61-8d1c-1b1e7f0a9c21',
                },
              ),
            },
            '400': errorResponse('The cursor is wrong.', ['invalid_cursor']),
            ...common,
          },
        },
      },
      '/invoices': {
        get: {
          tags: ['Invoices'],
          operationId: 'listInvoices',
          summary: 'List invoices',
          description: 'Your invoices, newest first (at most 500). Needs `invoices:read`.',
          responses: {
            '200': {
              description: 'The invoices.',
              content: jsonBody({ type: 'array', items: ref('Invoice') }),
            },
            ...common,
          },
        },
      },
      '/invoices/{id}': {
        get: {
          tags: ['Invoices'],
          operationId: 'getInvoice',
          summary: 'Get an invoice',
          description: 'An invoice with one line per delivered case. Needs `invoices:read`.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'The invoice’s ID.',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'The invoice with its lines.',
              content: jsonBody(ref('InvoiceWithLines')),
            },
            ...common,
            '404': errorResponse('No such invoice.', ['not_found']),
          },
        },
      },
    },
    webhooks: Object.fromEntries(
      (Object.keys(EVENT_EXAMPLES) as (keyof typeof EVENT_EXAMPLES)[]).map((type) => [
        type,
        {
          post: {
            tags: ['Events'],
            operationId: `on_${type.replace('.', '_')}`,
            summary: WEBHOOK_SUMMARY[type],
            description:
              'Sent to each of your webhooks subscribed to this event. Answer with any 2xx status within 10 seconds. Verify `Emanet-Signature` before trusting the body, and use `Emanet-Event-Id` to ignore a repeat.',
            parameters: [
              {
                name: 'Emanet-Signature',
                in: 'header',
                required: true,
                schema: { type: 'string' },
                description:
                  '`t=<unix time>,v1=<hex>`: HMAC-SHA256 of `<t>.<raw body>` with the webhook’s secret.',
                example:
                  't=1796150000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd',
              },
              {
                name: 'Emanet-Event-Id',
                in: 'header',
                required: true,
                schema: { type: 'string', format: 'uuid' },
                description: 'The event’s ID; the same on every retry.',
              },
            ],
            requestBody: {
              required: true,
              content: jsonBody(ref('Event'), EVENT_EXAMPLES[type] as unknown as Json),
            },
            responses: { '2XX': { description: 'Received. Anything else is retried.' } },
          },
        },
      ]),
    ),
    components: {
      securitySchemes: {
        apiKey: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'emk_…',
          description:
            'An API key created under Integrations → API keys by an owner or admin of the organization. Send it as `Authorization: Bearer emk_…`. Each key has scopes: `cases:read`, `cases:write`, `events:read`, `invoices:read`.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'A stable code to branch on.',
              enum: ERRORS.map((e) => e.code),
            },
            detail: {
              type: 'string',
              description: 'More for a person to read: the field at fault, or what to send.',
            },
          },
        },
        CaseStatus: {
          type: 'string',
          enum: ['pending_identity', 'active', 'delivered', 'withdrawn', 'expired'],
          description:
            '`pending_identity`: Emanet is settling which vehicle this is (no chassis number, or the plate is on another vehicle); agents don’t see it. `active`: agents can look for it. `delivered`: in a custodian car park. `withdrawn`: you withdrew it, or its identity was rejected. `expired`: not confirmed in time.',
        },
        Place: {
          type: 'object',
          required: ['kind', 'address', 'district', 'city'],
          properties: {
            kind: { type: 'string', enum: ['owner_home', 'work', 'last_seen', 'other'] },
            address: {
              type: 'string',
              maxLength: 300,
              description:
                'Street address. Shown only to the agent who claimed the vehicle, only while the claim lasts; erased after the case closes.',
            },
            district: {
              type: 'string',
              maxLength: 60,
              description:
                'İlçe: a district of `city`. Any spelling ("kadikoy", "KADIKÖY") is accepted and stored as the official name ("Kadıköy"). Central districts of the 51 non-metropolitan provinces are "Merkez".',
            },
            city: {
              type: 'string',
              maxLength: 60,
              description:
                'İl: one of Turkey’s 81 provinces, by name in any spelling or by plate code ("34"); stored as the official name ("İstanbul"). Agents search by city and district.',
            },
            lat: {
              type: 'number',
              minimum: -90,
              maximum: 90,
              description: 'With `lng`, or neither.',
            },
            lng: { type: 'number', minimum: -180, maximum: 180 },
            note: {
              type: 'string',
              maxLength: 500,
              description:
                'Anything that helps find the vehicle. Never the debtor’s name or the debt.',
            },
            attributes: {
              type: 'object',
              additionalProperties: true,
              description: 'Your custom fields for places (see `/schema`).',
            },
          },
        },
        CaseInput: {
          type: 'object',
          required: [
            'external_ref',
            'plate',
            'make',
            'model',
            'icra_office',
            'icra_file_no',
            'serh_date',
            'legal_basis',
          ],
          properties: {
            external_ref: {
              type: 'string',
              maxLength: 100,
              description:
                'Your own reference for this case; unique within your organization. The idempotency key.',
            },
            vin: {
              type: 'string',
              pattern: '^[A-HJ-NPR-Z0-9]{17}$',
              description:
                'Chassis number (şasi no). Spaces and dashes are ignored. Without it the case waits for Emanet to identify the vehicle.',
            },
            plate: {
              type: 'string',
              description: 'A Turkish plate; spaces are ignored.',
              examples: ['34 ABC 123'],
            },
            make: { type: 'string', maxLength: 60 },
            model: { type: 'string', maxLength: 60 },
            year: { type: 'integer', minimum: 1950, maximum: 2100 },
            colour: { type: 'string', maxLength: 40 },
            icra_office: { type: 'string', maxLength: 120, description: 'The enforcement office.' },
            icra_file_no: {
              type: 'string',
              maxLength: 40,
              description: 'The enforcement file number.',
            },
            serh_date: {
              type: 'string',
              format: 'date',
              description: 'The date of the seizure order (yakalama şerhi).',
            },
            legal_basis: {
              type: 'string',
              enum: ['rehin', 'haciz'],
              description: 'Pledge or attachment.',
            },
            places: {
              type: 'array',
              maxItems: 10,
              items: ref('Place'),
              description: 'Where the vehicle may be found. Replaces the case’s places when sent.',
            },
            attributes: {
              type: 'object',
              additionalProperties: true,
              description: 'Your custom fields for cases.',
            },
            vehicle_attributes: {
              type: 'object',
              additionalProperties: true,
              description: 'Your custom fields for vehicles.',
            },
          },
        },
        Case: {
          type: 'object',
          required: [
            'id',
            'external_ref',
            'status',
            'vehicle',
            'icra_office',
            'icra_file_no',
            'serh_date',
            'legal_basis',
            'places',
            'attributes',
            'fee_kurus',
            'last_confirmed_at',
            'expires_at',
            'delivered_at',
            'created_at',
            'updated_at',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            external_ref: { type: 'string' },
            status: ref('CaseStatus'),
            vehicle: {
              type: 'object',
              description: 'The vehicle as you described it.',
              required: ['vin', 'plate', 'make', 'model', 'year', 'colour', 'attributes'],
              properties: {
                vin: { type: ['string', 'null'] },
                plate: { type: 'string', description: 'Without spaces: `34ABC123`.' },
                make: { type: 'string' },
                model: { type: 'string' },
                year: { type: ['integer', 'null'] },
                colour: { type: ['string', 'null'] },
                attributes: { type: 'object', additionalProperties: true },
              },
            },
            icra_office: { type: 'string' },
            icra_file_no: { type: 'string' },
            serh_date: { type: 'string', format: 'date' },
            legal_basis: { type: 'string', enum: ['rehin', 'haciz'] },
            places: {
              type: 'array',
              items: {
                allOf: [
                  ref('Place'),
                  {
                    type: 'object',
                    required: ['id'],
                    properties: { id: { type: 'string', format: 'uuid' } },
                  },
                ],
              },
            },
            attributes: { type: 'object', additionalProperties: true },
            fee_kurus: kurus(
              'The fee owed if the vehicle is delivered, fixed from your price list when the case was added.',
            ),
            last_confirmed_at: unix('When you last confirmed the case.'),
            expires_at: unix('When the case expires unless confirmed.'),
            delivered_at: {
              ...unix('When the vehicle reached custody.'),
              type: ['integer', 'null'],
            },
            created_at: unix('When the case was added.'),
            updated_at: unix('When the case last changed.'),
          },
        },
        TimelineEntry: {
          type: 'object',
          required: ['event', 'at'],
          properties: {
            event: {
              type: 'string',
              enum: [
                'created',
                'updated',
                'identity_accepted',
                'identity_rejected',
                'withdrawn',
                'expired',
                'delivered',
              ],
            },
            at: unix('When it happened.'),
          },
        },
        Field: {
          type: 'object',
          required: [
            'id',
            'entity',
            'key',
            'labelTr',
            'labelEn',
            'type',
            'required',
            'visibility',
            'pii',
            'position',
            'deprecated',
          ],
          properties: {
            id: { type: 'string' },
            partnerId: {
              type: ['string', 'null'],
              description: 'Null for a field every partner has.',
            },
            entity: { type: 'string', enum: ['vehicle', 'case', 'place'] },
            key: { type: 'string', description: 'The key to use in `attributes`.' },
            labelTr: { type: 'string' },
            labelEn: { type: 'string' },
            type: {
              type: 'string',
              enum: ['text', 'number', 'date', 'enum', 'bool', 'phone', 'money'],
            },
            enumValues: { type: ['array', 'null'], items: { type: 'string' } },
            required: { type: 'boolean' },
            maxLength: { type: ['integer', 'null'] },
            visibility: {
              type: 'string',
              enum: ['partner', 'admin', 'agent_after_claim'],
              description: 'Who sees the value besides you.',
            },
            pii: { type: 'boolean', description: 'Personal data: stored encrypted.' },
            position: { type: 'integer' },
            deprecated: {
              type: 'boolean',
              description: 'Retired: existing values stay, new ones are refused.',
            },
          },
        },
        Event: {
          type: 'object',
          required: ['id', 'type', 'data', 'created_at'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique per event; the same in the API and in every webhook delivery.',
            },
            type: { type: 'string', enum: Object.keys(EVENT_EXAMPLES) },
            created_at: unix('When it happened.'),
            data: {
              type: 'object',
              description:
                '`case.delivered`: `case_id`, `external_ref`, `delivered_at`. `case.expired`: `case_id`, `external_ref`. `case.rejected`: `case_id`, `external_ref`, `reason`. `invoice.issued`: `invoice_id`, `total_kurus`.',
              additionalProperties: true,
            },
          },
        },
        Invoice: {
          type: 'object',
          required: [
            'id',
            'number',
            'issued_at',
            'net_kurus',
            'kdv_kurus',
            'total_kurus',
            'paid_kurus',
            'status',
            'cases',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            number: {
              type: ['string', 'null'],
              description: 'The e-invoice number, once recorded.',
            },
            issued_at: unix('When it was issued.'),
            net_kurus: kurus('Before VAT.'),
            kdv_kurus: kurus('VAT (KDV).'),
            total_kurus: kurus('Net plus VAT.'),
            paid_kurus: kurus('What Emanet has received.'),
            status: { type: 'string', enum: ['issued', 'paid', 'cancelled'] },
            cases: { type: 'integer', description: 'How many delivered cases it covers.' },
          },
        },
        InvoiceWithLines: {
          allOf: [
            ref('Invoice'),
            {
              type: 'object',
              required: ['lines'],
              properties: {
                lines: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: [
                      'case_id',
                      'external_ref',
                      'plate',
                      'delivered_at',
                      'net_kurus',
                      'kdv_kurus',
                    ],
                    properties: {
                      case_id: { type: 'string', format: 'uuid' },
                      external_ref: { type: 'string' },
                      plate: { type: ['string', 'null'] },
                      delivered_at: { type: ['integer', 'null'], format: 'int64' },
                      net_kurus: { type: 'integer' },
                      kdv_kurus: { type: 'integer' },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
}

const WEBHOOK_SUMMARY: Record<keyof typeof EVENT_EXAMPLES, string> = {
  'case.delivered': 'A vehicle reached custody',
  'case.expired': 'A case expired',
  'case.rejected': 'A case’s vehicle identity was rejected',
  'invoice.issued': 'An invoice was issued',
};

// ---- YAML ----------------------------------------------------------------------------------------

const PLAIN = /^[A-Za-z_][A-Za-z0-9_ ./()’'-]*$/;
const RESERVED = /^(true|false|null|yes|no|on|off|~)$/i;

function scalar(value: string | number | boolean | null): string {
  if (value === null) return 'null';
  if (typeof value !== 'string') return String(value);
  if (value.includes('\n')) return '';
  return PLAIN.test(value) && !RESERVED.test(value) && !value.endsWith(' ') && !value.includes(': ')
    ? value
    : JSON.stringify(value);
}

const yamlKey = (key: string) =>
  /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(key) ? key : JSON.stringify(key);

/** Enough YAML for an OpenAPI document: block maps and lists, quoted where there is any doubt. */
export function toYaml(value: Json, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]\n`;
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object') {
          const body = toYaml(item, indent + 1);
          if (Array.isArray(item) ? item.length === 0 : Object.keys(item).length === 0) {
            return `${pad}- ${body.trim()}\n`;
          }
          return `${pad}- ${body.slice((indent + 1) * 2)}`;
        }
        return `${pad}- ${block(item, indent + 1)}`;
      })
      .join('');
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return `${pad}{}\n`;
    return entries
      .map(([key, item]) => {
        if (item !== null && typeof item === 'object') {
          const empty = Array.isArray(item) ? item.length === 0 : Object.keys(item).length === 0;
          return empty
            ? `${pad}${yamlKey(key)}: ${Array.isArray(item) ? '[]' : '{}'}\n`
            : `${pad}${yamlKey(key)}:\n${toYaml(item, indent + 1)}`;
        }
        return `${pad}${yamlKey(key)}: ${block(item, indent + 1)}`;
      })
      .join('');
  }
  return `${pad}${block(value, indent)}`;
}

/** A scalar on its line; a string with line breaks as a literal block. */
function block(value: string | number | boolean | null, indent: number): string {
  if (typeof value === 'string' && value.includes('\n')) {
    const pad = '  '.repeat(indent);
    return `|-\n${value
      .split('\n')
      .map((line) => (line ? `${pad}${line}` : ''))
      .join('\n')}\n`;
  }
  return `${scalar(value)}\n`;
}
