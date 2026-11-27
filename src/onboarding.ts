import type { Hono } from 'hono';
import { hasFreshSecondFactor } from './auth';
import {
  DOCUMENT_KINDS,
  core,
  orgs,
  provisioning,
  type CompanyDetails,
  type DocumentKind,
  type Onboarding,
} from './core';
import { underRateLimit, type AppContext, type AppEnv } from './http';
import * as pages from './onboarding-pages';
import { problem, type Nav } from './pages';

/**
 * A company joining Emanet (docs/DESIGN.md §5, Onboarding). 2earl staff invite it from Emanet
 * Merkez; the core emails the link. Everything here is done by the one account that took the
 * invitation, checked again by the core on every call.
 */

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** What the file is, from its first bytes, whatever its name or the browser says. */
export function sniff(bytes: Uint8Array): 'application/pdf' | 'image/jpeg' | 'image/png' | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return 'application/pdf';
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  return null;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function registerOnboarding(app: Hono<AppEnv>, nav: (c: AppContext) => Nav): void {
  const uid = (c: AppContext) => c.get('session')?.uid ?? '';
  const signIn = (c: AppContext) =>
    c.redirect(`/signin?return=${encodeURIComponent(c.req.path)}`, 302);
  const notFound = (c: AppContext, error = 'not_found') =>
    c.html(problem(nav(c), 'Invitation', pages.onboardingError(error)), 404);

  // ---- The link in the email ------------------------------------------------------------------

  app.get('/join/:token', async (c) => {
    if (!(await underRateLimit(c, 'join'))) {
      return c.html(problem(nav(c), 'Too many attempts', 'Wait a minute and try again.'), 429);
    }
    const token = c.req.param('token');
    const found = await core(c.env).onboardingInvitation(token);
    if (!found.ok) return notFound(c, found.error);
    const invitation = found.value;
    const session = c.get('session');
    if (!session) return c.html(pages.invitation(nav(c), invitation, 'signed_out', token));
    if (invitation.claimed_by === session.uid)
      return c.redirect(`/onboarding/${invitation.id}`, 302);
    if (invitation.claimed_by !== null) {
      return c.html(pages.invitation(nav(c), invitation, 'taken', token), 409);
    }
    const right = await provisioning(c.env).hasAddress(session.uid, invitation.contact_email);
    return c.html(
      pages.invitation(nav(c), invitation, right ? 'ready' : 'wrong_address', token),
      right ? 200 : 403,
    );
  });

  app.post('/join/:token', async (c) => {
    const session = c.get('session');
    if (!session) return signIn(c);
    const token = c.req.param('token');
    const found = await core(c.env).onboardingInvitation(token);
    if (!found.ok) return notFound(c, found.error);
    if (!(await provisioning(c.env).hasAddress(session.uid, found.value.contact_email))) {
      return c.html(pages.invitation(nav(c), found.value, 'wrong_address', token), 403);
    }
    const claimed = await core(c.env).claimOnboarding(token, session.uid);
    if (!claimed.ok) return notFound(c, claimed.error);
    return c.redirect(`/onboarding/${claimed.value.id}`, 303);
  });

  // ---- The steps ------------------------------------------------------------------------------

  app.get('/onboarding', async (c) => {
    if (!c.get('session')) return signIn(c);
    const list = await core(c.env).myOnboardings(uid(c));
    const items = list.ok ? list.value : [];
    const only = items[0];
    if (items.length === 1 && only) return c.redirect(`/onboarding/${only.id}`, 302);
    return c.html(pages.myOnboardings(nav(c), items));
  });

  /** The onboarding, if it's this account's; a 404 page otherwise. */
  async function load(c: AppContext): Promise<Onboarding | Response> {
    if (!c.get('session')) return signIn(c);
    const found = await core(c.env).onboarding(c.req.param('id') ?? '', uid(c));
    if (!found.ok) {
      return c.html(problem(nav(c), 'Not found', 'This application doesn’t exist.'), 404);
    }
    return found.value;
  }
  const after = (c: AppContext, o: Onboarding, step: string) =>
    c.redirect(`/onboarding/${o.id}/${step}`, 303);

  app.get('/onboarding/:id', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    const message = c.req.query('signed') ? 'Thank you. 2earl has been told.' : null;
    return c.html(pages.overview(nav(c), o, message));
  });

  // Organization: a new one from login, or one the person already manages.
  async function managed(c: AppContext) {
    const memberships = await orgs(c.env).membershipsOf(uid(c));
    return memberships.filter((m) => m.role === 'owner' || m.role === 'admin');
  }

  app.get('/onboarding/:id/org', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    return c.html(pages.orgStep(nav(c), o, await managed(c), null));
  });

  app.post('/onboarding/:id/org', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    const form = await c.req.parseBody();
    const fail = async (error: string) =>
      c.html(pages.orgStep(nav(c), o, await managed(c), pages.onboardingError(error)), 422);
    let orgId = text(form.org);
    if (text(form.mode) === 'new') {
      if (o.org_id !== null) return fail('not_editable');
      if (!(await underRateLimit(c, 'onboarding-org'))) return fail('full');
      const created = await provisioning(c.env).create({
        ownerId: uid(c),
        email: o.contact_email,
        name: text(form.name),
        invitedBy: o.invited_by,
        service: 'emanet',
      });
      if (!created.ok) return fail(created.reason);
      orgId = created.orgId;
    } else if (!(await managed(c)).some((m) => m.orgId === orgId)) {
      return fail('invalid_org');
    }
    const linked = await core(c.env).linkOnboardingOrganization(o.id, uid(c), orgId);
    if (!linked.ok) return fail(linked.error);
    return after(c, o, 'details');
  });

  // Company details.
  const prefill = (o: Onboarding): Partial<Record<keyof CompanyDetails, string | boolean | null>> =>
    o.details ?? {
      legalName: o.company,
      operationsName: o.contact_name,
      operationsEmail: o.contact_email,
      eInvoice: true,
    };

  app.get('/onboarding/:id/details', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    return c.html(pages.detailsStep(nav(c), o, prefill(o), null));
  });

  app.post('/onboarding/:id/details', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    const form = await c.req.parseBody();
    const values: Record<string, unknown> = {};
    for (const key of [
      'legalName',
      'address',
      'taxOffice',
      'vkn',
      'mersis',
      'kep',
      'signatoryName',
      'signatoryTitle',
      'billingEmail',
      'operationsName',
      'operationsEmail',
      'operationsPhone',
    ] as const) {
      values[key] = text(form[key]);
    }
    values.eInvoice = form.eInvoice === '1';
    const saved = await core(c.env).saveOnboardingDetails(o.id, uid(c), values);
    if (!saved.ok) {
      return c.html(
        pages.detailsStep(
          nav(c),
          o,
          values as Record<keyof CompanyDetails, string>,
          pages.onboardingError(saved.error, saved.detail),
        ),
        422,
      );
    }
    return after(c, o, 'documents');
  });

  // Documents: kept in R2 under the onboarding's own prefix; the core keeps their hash.
  app.get('/onboarding/:id/documents', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    return c.html(pages.documentsStep(nav(c), o, null));
  });

  app.post('/onboarding/:id/documents', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    const fail = (error: string, status: 413 | 415 | 422 = 422) =>
      c.html(pages.documentsStep(nav(c), o, pages.onboardingError(error)), status);
    if (!(await underRateLimit(c, 'onboarding-upload'))) return fail('too_many_documents');
    const length = Number(c.req.header('Content-Length') ?? '0');
    if (length > MAX_DOCUMENT_BYTES + 64 * 1024) return fail('file_size', 413);
    const form = await c.req.parseBody();
    const kind = text(form.kind) as DocumentKind;
    if (!DOCUMENT_KINDS.includes(kind)) return fail('invalid_details');
    const file = form.file;
    if (!(file instanceof File) || file.size === 0) return fail('file_missing');
    if (file.size > MAX_DOCUMENT_BYTES) return fail('file_size', 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniff(bytes);
    if (!type) return fail('file_type', 415);
    const key = `onboarding/${o.id}/${crypto.randomUUID()}`;
    const sha256 = await sha256Hex(bytes);
    await c.env.DOCUMENTS.put(key, bytes, {
      httpMetadata: { contentType: type },
      customMetadata: { onboarding: o.id, uploaded_by: uid(c), sha256 },
      sha256,
    });
    const added = await core(c.env).addOnboardingDocument(o.id, uid(c), {
      kind,
      file_ref: key,
      sha256,
      file_name: file.name.replace(/[\r\n"\\/]/g, '_').slice(0, 200) || 'document',
      content_type: type,
      size: bytes.byteLength,
    });
    if (!added.ok) {
      await c.env.DOCUMENTS.delete(key);
      return fail(added.error);
    }
    return after(c, o, 'documents');
  });

  // The agreement: shown as the core renders it now, accepted with a fresh second factor.
  const fresh = (c: AppContext) => {
    const session = c.get('session');
    return session !== null && hasFreshSecondFactor(session, c.get('now'));
  };

  app.get('/onboarding/:id/agreement', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    const contract =
      o.details && o.signed_at === null ? await core(c.env).onboardingContract(o.id, uid(c)) : null;
    return c.html(
      pages.agreementStep(nav(c), o, contract?.ok ? contract.value : null, fresh(c), null),
    );
  });

  app.post('/onboarding/:id/agreement', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    if (!fresh(c)) return after(c, o, 'agreement');
    const form = await c.req.parseBody();
    const signed = await core(c.env).signOnboarding(o.id, uid(c), {
      version: text(form.version),
      sha256: text(form.sha256),
      name: text(form.name),
      title: text(form.title),
      ip: c.req.header('CF-Connecting-IP') ?? null,
      authorised: form.authorised === '1' && form.accept === '1',
    });
    if (!signed.ok) {
      const contract = await core(c.env).onboardingContract(o.id, uid(c));
      return c.html(
        pages.agreementStep(
          nav(c),
          o,
          contract.ok ? contract.value : null,
          true,
          pages.onboardingError(signed.error),
        ),
        422,
      );
    }
    return c.redirect(`/onboarding/${o.id}?signed=1`, 303);
  });

  app.get('/onboarding/:id/agreement.txt', async (c) => {
    const o = await load(c);
    if (o instanceof Response) return o;
    let body = o.contract_text ?? null;
    let version = o.contract_version;
    if (body === null && o.details) {
      // Not accepted yet: the text as it would be accepted now, to read or sign on paper.
      const contract = await core(c.env).onboardingContract(o.id, uid(c));
      if (contract.ok) {
        body = contract.value.text;
        version = contract.value.version;
      }
    }
    if (body === null) return c.html(problem(nav(c), 'Not found', 'There is no text yet.'), 404);
    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="emanet-sozlesme-${(version ?? 'taslak').replace(/[^a-z0-9-]/gi, '')}.txt"`,
      },
    });
  });
}
