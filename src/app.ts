import { Hono } from 'hono';
import { createApi } from './api';
import {
  SESSION_ABSOLUTE_SECONDS,
  SIGNIN_TTL_SECONDS,
  SignInError,
  clientMetadata,
  createWebSession,
  currentSession,
  endWebSession,
  finishSignIn,
  hasFreshSecondFactor,
  startSignIn,
} from './auth';
import {
  CASE_STATUSES,
  can,
  core,
  orgs,
  type CaseInput,
  type CaseStatus,
  type FieldDefinition,
  type PlaceKind,
  PLACE_KINDS,
} from './core';
import { MAX_BYTES, parseCases, parseDate, templateCsv, typedValue } from './csv';
import {
  SECURITY_HEADERS,
  SESSION_COOKIE,
  SIGNIN_COOKIE,
  isSameOrigin,
  readCookie,
  safeReturnTo,
  setCookie,
  underRateLimit,
  type AppContext,
  type AppEnv,
} from './http';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  localizeHtml,
  pickLocale,
  withLocale,
} from './i18n';
import { KeyError, createKey, listKeys, revokeKey } from './keys';
import { registerOnboarding } from './onboarding';
import { caseExtras, invoiceDetail, invoiceList, reportCsv, reportPage } from './partner-pages';
import * as pages from './pages';
import {
  WebhookError,
  createWebhook,
  deleteWebhook,
  enableWebhook,
  listWebhooks,
  recentDeliveries,
} from './webhooks';

/** Emanet Kurumsal: the creditors' web app and API (docs/DESIGN.md §5). */

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : typeof value === 'string'
      ? [value]
      : [];

/** What a person reads for each core error code. */
const ERROR_TEXT: Record<string, string> = {
  invalid_plate: 'The plate isn’t a Turkish plate (e.g. 34 ABC 123).',
  invalid_vin: 'The chassis number must be 17 letters and digits, without I, O or Q.',
  invalid_vehicle: 'Enter the make and model.',
  invalid_year: 'The year isn’t valid.',
  invalid_icra_file: 'Enter the enforcement office and the file number.',
  invalid_serh_date: 'The seizure order date isn’t valid.',
  invalid_place: 'Each place needs an address, a district and a city.',
  invalid_external_ref: 'Enter your reference.',
  duplicate_case: 'You already have an open case for this vehicle under another reference.',
  case_closed: 'This case is closed.',
  vin_mismatch: 'This reference was created with another chassis number.',
  conflict_retry: 'Someone changed this vehicle at the same moment. Send it again.',
  no_price_list: 'Your organization has no price list yet. Ask 2earl to set it up.',
  partner_not_active: 'Your organization isn’t active in Emanet.',
  invalid_field: 'A field has a value that isn’t allowed.',
  unknown_field: 'A field isn’t known for your organization.',
};
const errorText = (error: string, detail?: string) =>
  `${ERROR_TEXT[error] ?? 'That didn’t work.'}${detail ? ` (${detail})` : ''}`;

export function createApp(now: () => number) {
  const app = new Hono<AppEnv>();

  // The API has its own authentication, headers and errors; none of the page middleware.
  app.route('/api/v1', createApi(now) as unknown as Hono<AppEnv>);

  // Language: ?lang= (remembered), the cookie, then the browser's. Pages are written in English
  // and translated after the route rendered them.
  app.use('*', async (c: AppContext, next) => {
    const chosen = c.req.query('lang');
    const locale = pickLocale({
      query: chosen,
      cookie: readCookie(c.req.header('Cookie'), LOCALE_COOKIE),
      acceptLanguage: c.req.header('Accept-Language'),
    });
    c.set('locale', locale);
    await withLocale({ locale, url: new URL(c.req.url) }, () => next());
    if (isLocale(chosen) && c.req.method === 'GET') {
      setCookie(c, LOCALE_COOKIE, chosen, LOCALE_COOKIE_MAX_AGE);
    }
    c.header('Content-Language', locale);
    c.header('Vary', 'Accept-Language, Cookie', { append: true });
    if (locale === DEFAULT_LOCALE) return;
    if (!(c.res.headers.get('Content-Type') ?? '').startsWith('text/html')) return;
    const page = await c.res.text();
    const headers = new Headers(c.res.headers);
    headers.delete('Content-Length');
    c.res = new Response(
      localizeHtml(page, locale).replace('<html lang="en">', `<html lang="${locale}">`),
      {
        status: c.res.status,
        headers,
      },
    );
  });

  app.use('*', async (c: AppContext, next) => {
    c.set('now', now());
    c.set(
      'session',
      await currentSession(c.env, c.get('now'), readCookie(c.req.header('Cookie'), SESSION_COOKIE)),
    );
    if (c.req.method === 'POST' && !isSameOrigin(c)) {
      return c.html(
        pages.problem(
          { signedIn: false },
          'Not allowed',
          'This form must be sent from Emanet Kurumsal.',
        ),
        403,
      );
    }
    await next();
    c.res = new Response(c.res.body, c.res);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) c.res.headers.set(name, value);
    if (!c.res.headers.has('Cache-Control')) c.res.headers.set('Cache-Control', 'no-store');
  });

  const nav = (c: AppContext): pages.Nav => {
    const org = c.get('org') as AppEnv['Variables']['org'] | undefined;
    return org
      ? { signedIn: true, org: { id: org.orgId, name: org.name, role: org.role } }
      : { signedIn: c.get('session') !== null };
  };

  // ---- Public ---------------------------------------------------------------------------------

  app.get('/', async (c) => {
    const session = c.get('session');
    if (!session) return c.html(pages.home());
    const memberships = await orgs(c.env).membershipsOf(session.uid);
    // Only organizations 2earl has set up as partners.
    const partners = [];
    for (const m of memberships) {
      const partner = await core(c.env).partner(m.orgId);
      if (partner.ok && partner.value.status !== 'suspended') partners.push(m);
    }
    const only = partners[0];
    if (partners.length === 1 && only) return c.redirect(`/o/${only.orgId}`, 302);
    // Someone still joining Emanet continues where they left off.
    if (partners.length === 0) {
      const joining = await core(c.env).myOnboardings(session.uid);
      if (joining.ok && joining.value.some((o) => o.status !== 'approved')) {
        return c.redirect('/onboarding', 302);
      }
    }
    return c.html(pages.orgPicker(partners));
  });

  app.get('/docs/api', (c) => c.html(pages.apiDocs(c.env.SITE_ORIGIN)));

  app.get('/oauth/client.json', (c) => {
    const response = c.json(clientMetadata(c.env));
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
  });

  app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /\n'));

  // ---- Sign-in --------------------------------------------------------------------------------

  app.get('/signin', async (c) => {
    if (!(await underRateLimit(c, 'signin'))) {
      return c.html(
        pages.problem(nav(c), 'Too many attempts', 'Wait a minute and try again.'),
        429,
      );
    }
    const returnTo = safeReturnTo(c.req.query('return'));
    const secondFactor = c.req.query('second_factor') === '1';
    if (c.get('session') && !secondFactor) return c.redirect(returnTo ?? '/', 302);
    const { cookieValue, location } = await startSignIn(c.env, c.get('now'), returnTo, {
      secondFactor,
    });
    setCookie(c, SIGNIN_COOKIE, cookieValue, SIGNIN_TTL_SECONDS);
    return c.redirect(location, 302);
  });

  app.get('/callback', async (c) => {
    setCookie(c, SIGNIN_COOKIE, '', 0);
    if (c.req.query('error')) {
      return c.html(
        pages.problem(nav(c), 'Not signed in', 'Sign-in was cancelled or not allowed.'),
        400,
      );
    }
    try {
      const { uid, aal2At, returnTo } = await finishSignIn(c.env, c.get('now'), {
        cookieValue: readCookie(c.req.header('Cookie'), SIGNIN_COOKIE),
        state: c.req.query('state') ?? null,
        code: c.req.query('code') ?? null,
        iss: c.req.query('iss') ?? null,
      });
      const previous = c.get('session');
      if (previous) await endWebSession(c.env, previous);
      setCookie(
        c,
        SESSION_COOKIE,
        await createWebSession(c.env, c.get('now'), uid, aal2At),
        SESSION_ABSOLUTE_SECONDS,
      );
      return c.redirect(safeReturnTo(returnTo) ?? '/', 302);
    } catch (error) {
      if (!(error instanceof SignInError)) throw error;
      console.error('sign-in failed', error.message);
      return c.html(
        pages.problem(nav(c), 'Not signed in', 'Sign-in didn’t complete. Start again.'),
        400,
      );
    }
  });

  app.post('/signout', async (c) => {
    const session = c.get('session');
    if (session) await endWebSession(c.env, session);
    setCookie(c, SESSION_COOKIE, '', 0);
    return c.redirect('/', 303);
  });

  // ---- An organization's pages ----------------------------------------------------------------

  /**
   * Every /o/:org page: a signed-in member of the login organization, which 2earl has set up as
   * an active partner. Read live on every request, so a removed member loses access at once.
   */
  const orgGate = async (c: AppContext, next: () => Promise<void>) => {
    const session = c.get('session');
    if (!session) return c.redirect(`/signin?return=${encodeURIComponent(c.req.path)}`, 302);
    const orgId = c.req.param('org') ?? '';
    const [role, partner, memberships] = await Promise.all([
      orgs(c.env).roleOf(orgId, session.uid),
      core(c.env).partner(orgId),
      orgs(c.env).membershipsOf(session.uid),
    ]);
    if (!role || !partner.ok) {
      return c.html(
        pages.problem(
          { signedIn: true },
          'Not found',
          'This organization doesn’t exist or you aren’t a member.',
        ),
        404,
      );
    }
    if (partner.value.status !== 'active') {
      return c.html(
        pages.problem(
          { signedIn: true },
          'Not active yet',
          '2earl hasn’t activated this organization in Emanet yet.',
        ),
        403,
      );
    }
    const name = memberships.find((m) => m.orgId === orgId)?.name ?? partner.value.legalName;
    c.set('org', { orgId, name, role, partner: partner.value });
    await next();
    return undefined;
  };
  app.use('/o/:org', orgGate);
  app.use('/o/:org/*', orgGate);

  const org = (c: AppContext) => c.get('org');
  const uid = (c: AppContext) => c.get('session')?.uid ?? '';
  const forbidden = (c: AppContext) =>
    c.html(
      pages.problem(nav(c), 'Not allowed', 'Your role in this organization doesn’t allow this.'),
      403,
    );

  app.get('/o/:org', async (c) => {
    const [counts, recent, active] = await Promise.all([
      core(c.env).counts(org(c).orgId),
      core(c.env).listCases(org(c).orgId, { limit: 10 }),
      core(c.env).listCases(org(c).orgId, { status: 'active', limit: 200 }),
    ]);
    if (!counts.ok || !recent.ok || !active.ok) throw new Error('core unavailable');
    const soon = c.get('now') + 3 * 86_400;
    const expiring = active.value.cases
      .filter((x) => x.expires_at <= soon)
      .sort((a, b) => a.expires_at - b.expires_at)
      .slice(0, 50);
    const confirmed = Number(c.req.query('confirmed'));
    // Most recent first on the overview.
    return c.html(
      pages.dashboard(
        nav(c),
        counts.value,
        [...recent.value.cases].reverse(),
        expiring,
        can.writeCases(org(c).role),
        Number.isInteger(confirmed) && confirmed > 0
          ? confirmed === 1
            ? 'Confirmed one case.'
            : `Confirmed ${String(confirmed)} cases.`
          : null,
      ),
    );
  });

  // Several cases confirmed at once, from the overview.
  app.post('/o/:org/cases/confirm', async (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    const form = await c.req.parseBody({ all: true });
    const ids = list(form.case_ids).slice(0, 200);
    if (ids.length === 0) return c.redirect(`/o/${org(c).orgId}`, 303);
    const result = await core(c.env).confirmCases(org(c).orgId, uid(c), ids);
    if (!result.ok)
      return c.html(pages.problem(nav(c), 'Not confirmed', errorText(result.error)), 422);
    return c.redirect(`/o/${org(c).orgId}?confirmed=${String(result.value.confirmed)}`, 303);
  });

  app.get('/o/:org/cases', async (c) => {
    const status = c.req.query('status');
    const filter = CASE_STATUSES.includes(status as CaseStatus) ? (status as CaseStatus) : null;
    const cursor = c.req.query('cursor');
    const result = await core(c.env).listCases(org(c).orgId, {
      ...(filter ? { status: filter } : {}),
      ...(cursor ? { cursor } : {}),
      limit: 50,
    });
    if (!result.ok)
      return c.html(pages.problem(nav(c), 'Not found', 'That page doesn’t exist.'), 404);
    return c.html(pages.caseList(nav(c), result.value.cases, filter, result.value.next_cursor));
  });

  async function schemaOf(c: AppContext) {
    const [caseFields, vehicleFields, placeFields] = await Promise.all([
      core(c.env).schema(org(c).orgId, 'case'),
      core(c.env).schema(org(c).orgId, 'vehicle'),
      core(c.env).schema(org(c).orgId, 'place'),
    ]);
    return {
      case: caseFields.ok ? caseFields.value : [],
      vehicle: vehicleFields.ok ? vehicleFields.value : [],
      place: placeFields.ok ? placeFields.value : [],
    };
  }

  app.get('/o/:org/cases/new', async (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    return c.html(pages.caseForm(nav(c), await schemaOf(c), {}, null, c.get('locale')));
  });

  app.post('/o/:org/cases/new', async (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    const form = await c.req.parseBody();
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(form)) values[key] = text(value);
    const fields = await schemaOf(c);
    const attrs = (prefix: 'case' | 'vehicle' | 'place', defs: FieldDefinition[]) => {
      const out: Record<string, unknown> = {};
      for (const field of defs) {
        const raw = values[`${prefix}.${field.key}`] ?? '';
        if (raw.trim() === '') continue;
        const value = typedValue(field, raw);
        if (!value.ok) return { error: field.key };
        out[field.key] = value.value;
      }
      return { value: out };
    };
    const caseAttrs = attrs('case', fields.case);
    const vehicleAttrs = attrs('vehicle', fields.vehicle);
    const placeAttrs = attrs('place', fields.place);
    const bad = [caseAttrs, vehicleAttrs, placeAttrs].find((a) => 'error' in a);
    const render = (error: string, status: 422 | 409 = 422) =>
      c.html(pages.caseForm(nav(c), fields, values, error, c.get('locale')), status);
    if (bad && 'error' in bad) return render(errorText('invalid_field', bad.error));
    const year = values.year?.trim() ? Number(values.year) : undefined;
    const input: CaseInput = {
      external_ref: values.external_ref ?? '',
      plate: values.plate ?? '',
      make: values.make ?? '',
      model: values.model ?? '',
      icra_office: values.icra_office ?? '',
      icra_file_no: values.icra_file_no ?? '',
      serh_date: parseDate(values.serh_date ?? '') ?? values.serh_date ?? '',
      legal_basis: values.legal_basis === 'haciz' ? 'haciz' : 'rehin',
      ...(values.vin?.trim() ? { vin: values.vin } : {}),
      ...(year !== undefined ? { year } : {}),
      ...(values.colour?.trim() ? { colour: values.colour } : {}),
      ...('value' in caseAttrs && Object.keys(caseAttrs.value).length
        ? { attributes: caseAttrs.value }
        : {}),
      ...('value' in vehicleAttrs && Object.keys(vehicleAttrs.value).length
        ? { vehicle_attributes: vehicleAttrs.value }
        : {}),
    };
    if (values.address?.trim() || values.district?.trim() || values.city?.trim()) {
      const kind = PLACE_KINDS.includes(values.place_kind as PlaceKind)
        ? (values.place_kind as PlaceKind)
        : 'owner_home';
      input.places = [
        {
          kind,
          address: values.address ?? '',
          district: values.district ?? '',
          city: values.city ?? '',
          ...('value' in placeAttrs && Object.keys(placeAttrs.value).length
            ? { attributes: placeAttrs.value }
            : {}),
        },
      ];
    }
    const result = await core(c.env).upsertCase(org(c).orgId, uid(c), input);
    if (!result.ok)
      return render(
        errorText(result.error, result.detail),
        result.error === 'duplicate_case' ? 409 : 422,
      );
    return c.redirect(`/o/${org(c).orgId}/cases/${result.value.id}?saved=1`, 303);
  });

  app.get('/o/:org/cases/:id', async (c) => {
    const result = await core(c.env).getCase(org(c).orgId, c.req.param('id'));
    if (!result.ok)
      return c.html(pages.problem(nav(c), 'Not found', 'This case doesn’t exist.'), 404);
    const notice =
      c.req.query('saved') === '1'
        ? 'Saved.'
        : c.req.query('withdrawn') === '1'
          ? 'Withdrawn. Agents no longer look for this vehicle.'
          : c.req.query('confirmed') === '1'
            ? 'Confirmed. The case stays searchable for another period.'
            : null;
    const fields = await schemaOf(c);
    const labels = Object.fromEntries(
      [...fields.case, ...fields.vehicle].map((f) => [
        f.key,
        c.get('locale') === 'tr' ? f.labelTr : f.labelEn,
      ]),
    );
    const [events, documents] = await Promise.all([
      core(c.env).caseTimeline(org(c).orgId, result.value.id),
      result.value.status === 'delivered'
        ? core(c.env).caseDocuments(org(c).orgId, result.value.id)
        : Promise.resolve({ ok: true as const, value: [] }),
    ]);
    return c.html(
      pages.caseDetail(
        nav(c),
        result.value,
        can.writeCases(org(c).role),
        notice,
        labels,
        caseExtras(
          org(c).orgId,
          result.value.id,
          events.ok ? events.value : [],
          documents.ok ? documents.value : [],
        ),
      ),
    );
  });

  // A custody document of a delivered case, streamed from R2; the core records the look.
  app.get('/o/:org/cases/:id/documents/:document', async (c) => {
    const found = await core(c.env).caseDocument(
      org(c).orgId,
      uid(c),
      c.req.param('id'),
      c.req.param('document'),
    );
    if (!found.ok)
      return c.html(pages.problem(nav(c), 'Not found', 'This document doesn’t exist.'), 404);
    const object = await c.env.EVIDENCE.get(found.value.file_ref);
    if (!object)
      return c.html(pages.problem(nav(c), 'Not found', 'This document doesn’t exist.'), 404);
    const type = object.httpMetadata?.contentType ?? '';
    const image = /^image\/(jpeg|png|webp|heic|heif)$/.test(type);
    return new Response(object.body, {
      headers: {
        'Content-Type': image ? type : 'application/octet-stream',
        'Content-Disposition': image
          ? 'inline'
          : `attachment; filename="${c.req.param('document').replace(/[^A-Za-z0-9-]/g, '')}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  });

  app.get('/o/:org/invoices', async (c) => {
    const result = await core(c.env).invoices(org(c).orgId);
    if (!result.ok) throw new Error(`core: ${result.error}`);
    return c.html(invoiceList(nav(c), result.value));
  });

  app.get('/o/:org/invoices/:id', async (c) => {
    const result = await core(c.env).invoice(org(c).orgId, c.req.param('id'));
    if (!result.ok)
      return c.html(pages.problem(nav(c), 'Not found', 'This invoice doesn’t exist.'), 404);
    return c.html(invoiceDetail(nav(c), result.value));
  });

  app.get('/o/:org/reports', async (c) => {
    const result = await core(c.env).report(org(c).orgId);
    if (!result.ok) throw new Error(`core: ${result.error}`);
    return c.html(reportPage(nav(c), result.value));
  });

  app.get('/o/:org/reports.csv', async (c) => {
    const result = await core(c.env).report(org(c).orgId);
    if (!result.ok) throw new Error(`core: ${result.error}`);
    return new Response(reportCsv(result.value), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="emanet-report.csv"',
      },
    });
  });

  app.post('/o/:org/cases/:id/withdraw', async (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    const form = await c.req.parseBody();
    const result = await core(c.env).withdrawCase(
      org(c).orgId,
      uid(c),
      c.req.param('id'),
      text(form.reason),
    );
    if (!result.ok)
      return c.html(pages.problem(nav(c), 'Not withdrawn', errorText(result.error)), 422);
    return c.redirect(`/o/${org(c).orgId}/cases/${c.req.param('id')}?withdrawn=1`, 303);
  });

  app.post('/o/:org/cases/:id/confirm', async (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    await core(c.env).confirmCases(org(c).orgId, uid(c), [c.req.param('id')]);
    return c.redirect(`/o/${org(c).orgId}/cases/${c.req.param('id')}?confirmed=1`, 303);
  });

  // ---- CSV upload -----------------------------------------------------------------------------

  app.get('/o/:org/upload', (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    return c.html(pages.upload(nav(c), null, null, null));
  });

  app.get('/o/:org/upload/template.csv', async (c) => {
    const body = templateCsv(await schemaOf(c));
    return c.body(body, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="emanet-template.csv"',
    });
  });

  app.post('/o/:org/upload', async (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    const form = await c.req.parseBody();
    const file = form.file;
    if (!(file instanceof File) || file.size === 0) {
      return c.html(pages.upload(nav(c), null, null, 'Choose a CSV file.'), 422);
    }
    if (file.size > MAX_BYTES) {
      return c.html(
        pages.upload(nav(c), null, null, 'The file is larger than 2 MB. Split it.'),
        422,
      );
    }
    const parsed = parseCases(await file.text(), await schemaOf(c));
    if (parsed.errors.length > 0) {
      return c.html(
        pages.upload(nav(c), { uploadId: '', count: 0, errors: parsed.errors }, null, null),
        422,
      );
    }
    const uploadId = crypto.randomUUID();
    const at = c.get('now');
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM uploads WHERE expires_at < ?').bind(at),
      c.env.DB.prepare(
        'INSERT INTO uploads (id, org_id, uid, cases, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(uploadId, org(c).orgId, uid(c), JSON.stringify(parsed.cases), at, at + 3600),
    ]);
    return c.html(
      pages.upload(nav(c), { uploadId, count: parsed.cases.length, errors: [] }, null, null),
    );
  });

  app.post('/o/:org/upload/:id', async (c) => {
    if (!can.writeCases(org(c).role)) return forbidden(c);
    // Used once: a second click can't import twice.
    const row = await c.env.DB.prepare(
      'DELETE FROM uploads WHERE id = ? AND org_id = ? AND uid = ? AND expires_at > ? RETURNING cases',
    )
      .bind(c.req.param('id'), org(c).orgId, uid(c), c.get('now'))
      .first<{ cases: string }>();
    if (!row)
      return c.html(
        pages.upload(nav(c), null, null, 'This upload expired. Check the file again.'),
        410,
      );
    const cases = JSON.parse(row.cases) as CaseInput[];
    let okCount = 0;
    const failed: { ref: string; error: string }[] = [];
    for (const input of cases) {
      const result = await core(c.env).upsertCase(org(c).orgId, uid(c), input);
      if (result.ok) okCount++;
      else
        failed.push({
          ref: input.external_ref,
          error: result.detail ? `${result.error}: ${result.detail}` : result.error,
        });
    }
    return c.html(pages.upload(nav(c), null, { ok: okCount, failed }, null));
  });

  // ---- API keys and webhooks (owners and admins, with a fresh second factor) --------------------

  const integrations = (c: AppContext) => can.manageIntegrations(org(c).role);
  const fresh = (c: AppContext) => {
    const session = c.get('session');
    return session !== null && hasFreshSecondFactor(session, c.get('now'));
  };

  app.get('/o/:org/keys', async (c) => {
    if (!integrations(c)) return forbidden(c);
    return c.html(
      pages.keysPage(nav(c), await listKeys(c.env, org(c).orgId), null, null, fresh(c)),
    );
  });

  app.post('/o/:org/keys', async (c) => {
    if (!integrations(c)) return forbidden(c);
    if (!fresh(c)) return c.redirect(`/o/${org(c).orgId}/keys`, 303);
    const form = await c.req.parseBody({ all: true });
    const expires = text(form.expires);
    try {
      const created = await createKey(
        c.env,
        {
          orgId: org(c).orgId,
          name: text(form.name),
          scopes: list(form.scopes),
          uid: uid(c),
          expiresInDays: expires === 'never' ? null : Number(expires) || 90,
        },
        c.get('now'),
      );
      return c.html(
        pages.keysPage(nav(c), await listKeys(c.env, org(c).orgId), created, null, true),
      );
    } catch (error) {
      if (!(error instanceof KeyError)) throw error;
      return c.html(
        pages.keysPage(nav(c), await listKeys(c.env, org(c).orgId), null, error.message, true),
        422,
      );
    }
  });

  app.post('/o/:org/keys/:id/revoke', async (c) => {
    if (!integrations(c)) return forbidden(c);
    await revokeKey(c.env, org(c).orgId, c.req.param('id'), c.get('now'));
    return c.redirect(`/o/${org(c).orgId}/keys`, 303);
  });

  app.get('/o/:org/webhooks', async (c) => {
    if (!integrations(c)) return forbidden(c);
    const [hooks, deliveries] = await Promise.all([
      listWebhooks(c.env, org(c).orgId),
      recentDeliveries(c.env, org(c).orgId),
    ]);
    return c.html(pages.webhooksPage(nav(c), hooks, deliveries, null, null, fresh(c)));
  });

  app.post('/o/:org/webhooks', async (c) => {
    if (!integrations(c)) return forbidden(c);
    if (!fresh(c)) return c.redirect(`/o/${org(c).orgId}/webhooks`, 303);
    const form = await c.req.parseBody({ all: true });
    let created: { secret: string } | null = null;
    let error: string | null = null;
    try {
      created = await createWebhook(
        c.env,
        { orgId: org(c).orgId, url: text(form.url), events: list(form.events), uid: uid(c) },
        c.get('now'),
      );
    } catch (e) {
      if (!(e instanceof WebhookError)) throw e;
      error = e.message;
    }
    const [hooks, deliveries] = await Promise.all([
      listWebhooks(c.env, org(c).orgId),
      recentDeliveries(c.env, org(c).orgId),
    ]);
    return c.html(
      pages.webhooksPage(nav(c), hooks, deliveries, created, error, true),
      error ? 422 : 200,
    );
  });

  app.post('/o/:org/webhooks/:id/delete', async (c) => {
    if (!integrations(c)) return forbidden(c);
    await deleteWebhook(c.env, org(c).orgId, c.req.param('id'));
    return c.redirect(`/o/${org(c).orgId}/webhooks`, 303);
  });

  app.post('/o/:org/webhooks/:id/enable', async (c) => {
    if (!integrations(c)) return forbidden(c);
    await enableWebhook(c.env, org(c).orgId, c.req.param('id'));
    return c.redirect(`/o/${org(c).orgId}/webhooks`, 303);
  });

  registerOnboarding(app, nav);

  // Static files (styles, icon); anything else is not found.
  app.get('*', async (c) => {
    const asset = await c.env.ASSETS.fetch(c.req.raw);
    if (asset.status !== 404) return asset;
    return c.html(pages.problem(nav(c), 'Not found', 'This page doesn’t exist.'), 404);
  });

  return app;
}
