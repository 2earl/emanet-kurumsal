import {
  DOCUMENT_KINDS,
  REQUIRED_DOCUMENTS,
  type CompanyDetails,
  type DocumentKind,
  type InvitationView,
  type Onboarding,
  type OnboardingStatus,
  type OrgRole,
  type RenderedContract,
} from './core';
import { data, day, esc, layout, lira, type Nav } from './pages';

/**
 * The pages a company sees while it joins Emanet (docs/DESIGN.md §5, Onboarding): the invitation,
 * then four steps (organization, details, documents, agreement) and the wait for 2earl.
 */

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  signature_circular: 'Signature circular',
  tax_certificate: 'Tax certificate',
  trade_registry: 'Trade Registry Gazette',
  signed_contract: 'Wet-signed agreement',
  other: 'Other document',
};

const STATUS_TEXT: Record<OnboardingStatus, string> = {
  invited: 'Invited',
  in_progress: 'In progress',
  signed: 'Waiting for 2earl',
  approved: 'Active',
  rejected: 'Not approved',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/** a•••@bank.com.tr: enough to recognise the address, not to harvest it from a forwarded link. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '•••';
  return `${email.slice(0, 1)}•••${email.slice(at)}`;
}

const notice = (text: string | null) => (text ? `<p class="notice">${esc(text)}</p>` : '');
const error = (text: string | null) => (text ? `<p class="error">${esc(text)}</p>` : '');

export function invitation(
  nav: Nav,
  i: InvitationView,
  state: 'signed_out' | 'wrong_address' | 'ready' | 'taken',
  token: string,
): string {
  const who = data(maskEmail(i.contact_email));
  const action = {
    signed_out: `<p>Sign in, or create your 2earl account, with the address the invitation went to: ${who}.</p>
      <p><a class="button" href="/signin?return=${encodeURIComponent(`/join/${token}`)}">Sign in with 2earl</a></p>`,
    wrong_address: `<p class="error">You’re signed in with an account that doesn’t use ${who}. Sign out and sign in with that address, or add it to your account at login.2earl.com.</p>
      <form method="post" action="/signout"><button class="secondary" type="submit">Sign out</button></form>`,
    ready: `<form method="post" class="actions"><button type="submit">Start</button></form>`,
    taken: `<p class="error">Another account has already started this invitation. Ask the person who did to finish it, or write to legal@2earl.com.</p>`,
  }[state];
  return layout(
    'Invitation',
    nav,
    `<h1>${data(i.company)} is invited to Emanet</h1>
     <p class="lede">2earl invites you to set up ${data(i.company)} on Emanet. It takes four steps: your organization, the company’s details, a few documents, and the agreement. 2earl then checks everything and activates your account.</p>
     <div class="panel"><dl class="facts">
       <dt>Invited</dt><dd>${data(i.contact_name)}</dd>
       <dt>Link valid until</dt><dd>${day(i.expires_at)}</dd>
     </dl></div>
     ${action}`,
  );
}

export function myOnboardings(nav: Nav, list: Onboarding[]): string {
  return layout(
    'Joining Emanet',
    nav,
    `<h1>Joining Emanet</h1>
     <table><thead><tr><th>Company</th><th>Status</th><th>Link valid until</th></tr></thead><tbody>${list
       .map(
         (o) =>
           `<tr><td><a href="/onboarding/${esc(o.id)}">${data(o.details?.legalName ?? o.company)}</a></td><td>${STATUS_TEXT[o.status]}</td><td>${day(o.expires_at)}</td></tr>`,
       )
       .join('')}</tbody></table>`,
  );
}

type Step = 'org' | 'details' | 'documents' | 'agreement';

function stepsDone(o: Onboarding): Record<Step, boolean> {
  const kinds = new Set(o.documents.map((d) => d.kind));
  return {
    org: o.org_id !== null,
    details: o.details !== null,
    documents: REQUIRED_DOCUMENTS.every((k) => kinds.has(k)),
    agreement: o.signed_at !== null,
  };
}

function steps(o: Onboarding, current: Step | null): string {
  const done = stepsDone(o);
  const item = (step: Step, label: string) => {
    const mark = done[step] ? '<span class="done">Done</span>' : '<span class="todo">To do</span>';
    return `<li${current === step ? ' aria-current="step"' : ''}><a href="/onboarding/${esc(o.id)}/${step}">${label}</a> ${mark}</li>`;
  };
  return `<ol class="steps">
    ${item('org', 'Organization')}
    ${item('details', 'Company details')}
    ${item('documents', 'Documents')}
    ${item('agreement', 'Agreement')}
  </ol>`;
}

const open = (o: Onboarding) => o.status === 'in_progress';

export function overview(nav: Nav, o: Onboarding, message: string | null): string {
  const name = data(o.details?.legalName ?? o.company);
  const done = stepsDone(o);
  const next = (['org', 'details', 'documents', 'agreement'] as const).find((s) => !done[s]);
  const status = {
    invited: '',
    in_progress: o.decision_reason
      ? `<p class="error">2earl asked for a change: ${data(o.decision_reason)}</p>`
      : '',
    signed: `<p class="lede">You accepted the agreement on ${day(o.signed_at)}. 2earl is checking your details and documents and will email you when ${name} is active.</p>`,
    approved: `<p class="lede">${name} is active.</p><p><a class="button" href="/o/${esc(o.org_id ?? '')}">Go to ${name}</a></p>`,
    rejected: `<p class="error">2earl couldn’t approve this application: ${data(o.decision_reason ?? '')}</p>`,
    cancelled: '<p class="error">2earl cancelled this invitation.</p>',
    expired:
      '<p class="error">This invitation has expired. Ask 2earl for a new link at legal@2earl.com.</p>',
  }[o.status];
  return layout(
    'Joining Emanet',
    nav,
    `${notice(message)}
     <h1>${name}</h1>
     ${status}
     ${open(o) || o.status === 'signed' ? steps(o, null) : ''}
     ${open(o) && next ? `<p><a class="button" href="/onboarding/${esc(o.id)}/${next}">Continue</a></p>` : ''}
     ${o.signed_at !== null ? `<p><a href="/onboarding/${esc(o.id)}/agreement.txt">Download the accepted agreement</a></p>` : ''}
     ${open(o) ? `<p class="hint">Complete the steps by ${day(o.expires_at)}.</p>` : ''}`,
  );
}

export function orgStep(
  nav: Nav,
  o: Onboarding,
  owned: { orgId: string; name: string; role: OrgRole }[],
  message: string | null,
): string {
  const linked = owned.find((m) => m.orgId === o.org_id);
  const choose = owned.length
    ? `<h2>Use an organization you already manage</h2>
       <form method="post" class="stack">
         <input type="hidden" name="mode" value="existing">
         <fieldset class="checks"><legend>Organization</legend>${owned
           .map(
             (m) =>
               `<label><input type="radio" name="org" value="${esc(m.orgId)}"${m.orgId === o.org_id ? ' checked' : ''} required> ${data(m.name)}</label>`,
           )
           .join('')}</fieldset>
         <div><button class="secondary" type="submit">Use this organization</button></div>
       </form>`
    : '';
  return layout(
    'Organization',
    nav,
    `${steps(o, 'org')}
     <h1>Your organization</h1>
     <p class="lede">Your colleagues sign in to Emanet as members of the company’s 2earl organization. You’ll be its owner and can invite them, give roles and require two-step sign-in, at login.2earl.com.</p>
     ${error(message)}
     ${linked ? `<p class="notice">Linked: ${data(linked.name)}</p>` : o.org_id ? '<p class="notice">An organization is linked.</p>' : ''}
     ${
       open(o)
         ? `<h2>Create the company’s organization</h2>
     <form method="post" class="stack">
       <input type="hidden" name="mode" value="new">
       <label>Organization name <input name="name" required maxlength="100" value="${esc(o.details?.legalName ?? o.company)}"></label>
       <div><button type="submit">Create organization</button></div>
     </form>
     ${choose}`
         : ''
     }`,
  );
}

export function detailsStep(
  nav: Nav,
  o: Onboarding,
  values: Partial<Record<keyof CompanyDetails, string | boolean | null>>,
  message: string | null,
): string {
  const v = (key: keyof CompanyDetails) => {
    const value = values[key];
    return typeof value === 'string' ? esc(value) : '';
  };
  const input = (key: keyof CompanyDetails, label: string, attrs = '', hint = '') =>
    `<label>${label}${hint ? ` <small>${hint}</small>` : ''}<input name="${key}" value="${v(key)}" ${attrs}></label>`;
  const readonly = open(o) ? '' : ' disabled';
  return layout(
    'Company details',
    nav,
    `${steps(o, 'details')}
     <h1>Company details</h1>
     <p class="lede">As on your trade registry and tax records. They go into the agreement and onto 2earl’s invoices.</p>
     ${error(message)}
     <form method="post" class="stack">
       <fieldset${readonly}><legend>Company</legend><div class="grid2">
         ${input('legalName', 'Legal name', 'required maxlength="200" autocomplete="organization"', 'e.g. Örnek Bankası A.Ş.')}
         ${input('vkn', 'Tax number (VKN)', 'required inputmode="numeric" pattern="[0-9]{10,11}" maxlength="11"')}
         ${input('taxOffice', 'Tax office', 'required maxlength="100"')}
         ${input('mersis', 'MERSİS number', 'inputmode="numeric" pattern="[0-9]{16}" maxlength="16"', 'optional')}
         ${input('kep', 'KEP address', 'type="email" maxlength="254"', 'optional; for formal notices')}
       </div>
       <label>Registered address <textarea name="address" required maxlength="400" rows="2">${v('address')}</textarea></label>
       <label class="inline"><input type="checkbox" name="eInvoice" value="1"${values.eInvoice === true || values.eInvoice === '1' ? ' checked' : ''}> <span>The company is registered for e-invoice (e-Fatura)</span></label>
       </fieldset>
       <fieldset${readonly}><legend>Who signs</legend><div class="grid2">
         ${input('signatoryName', 'Full name', 'required maxlength="120" autocomplete="name"', 'as on the signature circular')}
         ${input('signatoryTitle', 'Title', 'required maxlength="120"')}
       </div></fieldset>
       <fieldset${readonly}><legend>Contacts</legend><div class="grid2">
         ${input('billingEmail', 'Invoices to', 'type="email" required maxlength="254"')}
         ${input('operationsName', 'Operations contact', 'required maxlength="120"')}
         ${input('operationsEmail', 'Operations email', 'type="email" required maxlength="254"')}
         ${input('operationsPhone', 'Operations phone', 'type="tel" required maxlength="20" autocomplete="tel"', '+90 212 555 00 00')}
       </div></fieldset>
       ${open(o) ? '<div><button type="submit">Save and continue</button></div>' : ''}
     </form>`,
  );
}

export function documentsStep(nav: Nav, o: Onboarding, message: string | null): string {
  const have = new Set(o.documents.map((d) => d.kind));
  const missing = REQUIRED_DOCUMENTS.filter((k) => !have.has(k));
  const canUpload = o.status === 'in_progress' || o.status === 'signed';
  return layout(
    'Documents',
    nav,
    `${steps(o, 'documents')}
     <h1>Documents</h1>
     <p class="lede">2earl needs the signature circular (imza sirküleri) of the person who signs and the company’s tax certificate (vergi levhası). Add the Trade Registry Gazette if the signatory’s authority is there. PDF, JPEG or PNG, up to 10 MB each.</p>
     ${error(message)}
     ${missing.length ? `<p class="hint">Still needed:</p><ul class="plain">${missing.map((k) => `<li>${DOCUMENT_LABEL[k]}</li>`).join('')}</ul>` : ''}
     ${
       o.documents.length
         ? `<table><thead><tr><th>Document</th><th>File</th><th>Added</th></tr></thead><tbody>${o.documents
             .map(
               (d) =>
                 `<tr><td>${DOCUMENT_LABEL[d.kind]}</td><td>${data(d.file_name)}</td><td>${day(d.uploaded_at)}</td></tr>`,
             )
             .join('')}</tbody></table>`
         : '<p class="panel">No documents yet.</p>'
     }
     ${
       canUpload
         ? `<form method="post" enctype="multipart/form-data" class="stack">
       <label>Kind <select name="kind" required>${DOCUMENT_KINDS.map(
         (k) => `<option value="${k}">${DOCUMENT_LABEL[k]}</option>`,
       ).join('')}</select></label>
       <label>File <input type="file" name="file" required accept="application/pdf,image/jpeg,image/png"></label>
       <div><button type="submit">Upload</button></div>
     </form>`
         : ''
     }
     ${open(o) && !missing.length ? `<p><a class="button" href="/onboarding/${esc(o.id)}/agreement">Continue to the agreement</a></p>` : ''}`,
  );
}

export function agreementStep(
  nav: Nav,
  o: Onboarding,
  contract: RenderedContract | null,
  fresh: boolean,
  message: string | null,
): string {
  const ready = o.org_id !== null && o.details !== null;
  const prices = o.price_list
    ? `<div class="panel"><h2>Your fees (Annex 2)</h2><dl class="facts"><dt>Any vehicle</dt><dd>${lira(o.price_list.default_kurus)}</dd>${o.price_list.rules
        .map(
          (r) =>
            `<dt>${data([r.make, r.model].filter(Boolean).join(' ') || '—')}${r.year_from !== undefined || r.year_to !== undefined ? ` ${data(`${r.year_from === undefined ? '' : String(r.year_from)}–${r.year_to === undefined ? '' : String(r.year_to)}`)}` : ''}</dt><dd>${lira(r.fee_kurus)}</dd>`,
        )
        .join(
          '',
        )}</dl><p class="hint">Charged only for vehicles delivered to a custodian car park, plus VAT.</p></div>`
    : '';
  const text = contract
    ? `<article class="contract" lang="tr" translate="no">${contract.sections
        .map(
          (s) =>
            `<section><h3>${esc(s.title)}</h3>${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}</section>`,
        )
        .join('')}</article>
       <p class="hint">Version ${data(contract.version)} · SHA-256 ${data(contract.sha256)}. The agreement is in Turkish, the language that governs it.</p>`
    : '';
  const signForm =
    o.status === 'in_progress' && contract && o.details && !contract.final
      ? '<p class="notice">2earl is completing its own details in the agreement. You can read it now and accept it once that’s done, usually within a working day.</p>'
      : o.status === 'in_progress' && contract && o.details
        ? fresh
          ? `<form method="post" class="stack">
         <input type="hidden" name="version" value="${esc(contract.version)}">
         <input type="hidden" name="sha256" value="${esc(contract.sha256)}">
         <div class="grid2">
           <label>Your full name <input name="name" required maxlength="120" value="${esc(o.details.signatoryName)}" autocomplete="name"></label>
           <label>Your title <input name="title" required maxlength="120" value="${esc(o.details.signatoryTitle)}"></label>
         </div>
         <label class="inline"><input type="checkbox" name="authorised" value="1" required> <span>I am authorised to bind ${data(o.details.legalName)}, as shown by the signature circular I uploaded.</span></label>
         <label class="inline"><input type="checkbox" name="accept" value="1" required> <span>I have read the agreement and its annexes and accept them for the company.</span></label>
         <div><button type="submit">Accept the agreement</button></div>
       </form>`
          : `<p>To accept, confirm it’s you with your second sign-in step.</p>
           <p><a class="button" href="/signin?second_factor=1&amp;return=${encodeURIComponent(`/onboarding/${o.id}/agreement`)}">Confirm and continue</a></p>`
        : '';
  return layout(
    'Agreement',
    nav,
    `${steps(o, 'agreement')}
     <h1>The Emanet service agreement</h1>
     ${error(message)}
     ${
       !ready
         ? '<p class="lede">Link your organization and give the company’s details first: the agreement is written with them.</p>'
         : o.signed_at !== null
           ? `<p class="notice">Accepted by ${data(o.signer_name ?? '')} (${data(o.signer_title ?? '')}) on ${day(o.signed_at)}.</p>
              <p><a href="/onboarding/${esc(o.id)}/agreement.txt">Download the accepted agreement</a></p>`
           : '<p class="lede">Read it through, with the fees in Annex 2. Accepting here is a binding electronic acceptance; 2earl keeps the exact text, your name, title, time and IP address. If the company also wants a wet-signed copy, download the text, sign it and upload it as a document.</p>'
     }
     ${o.signed_at === null ? prices : ''}
     ${o.signed_at === null ? text : ''}
     ${signForm}`,
  );
}

export const ERROR_TEXT: Record<string, string> = {
  not_found:
    'This invitation link doesn’t work. It may have been replaced by a newer one; use the link in the latest email from 2earl.',
  expired: 'This invitation has expired. Ask 2earl for a new link at legal@2earl.com.',
  claimed_by_another: 'Another account has already started this invitation.',
  not_editable: 'This step can’t be changed any more.',
  invalid_org: 'Choose an organization.',
  org_in_use: 'That organization is already used by another company’s application.',
  partner_exists: 'That organization already uses Emanet.',
  invalid_details: 'A field isn’t valid. Check it and try again.',
  invalid_name: 'Enter a name for the organization.',
  full: 'Your account is in as many organizations as it can be. Leave one at login.2earl.com.',
  wrong_address: 'Your account doesn’t use the address the invitation went to.',
  not_staff: 'This invitation can’t create an organization. Write to legal@2earl.com.',
  no_account: 'Your account isn’t active.',
  details_missing: 'Give the company’s details first.',
  org_missing: 'Link your organization first.',
  contract_changed:
    'The agreement changed since you opened it (for example, the details were edited). Read it again and accept.',
  not_authorised: 'Confirm that you may bind the company.',
  invalid_signer: 'Enter your full name and title.',
  provider_incomplete: '2earl is completing its own details in the agreement. Try again shortly.',
  too_many_documents: 'That’s as many documents as an application can have.',
  file_type: 'Upload a PDF, JPEG or PNG.',
  file_size: 'The file is larger than 10 MB.',
  file_missing: 'Choose a file.',
};

export const FIELD_TEXT: Record<string, string> = {
  legalName: 'Enter the company’s legal name.',
  address: 'Enter the registered address.',
  taxOffice: 'Enter the tax office.',
  vkn: 'The tax number has 10 digits (11 for a person).',
  mersis: 'The MERSİS number has 16 digits.',
  kep: 'The KEP address isn’t an email address.',
  signatoryName: 'Enter the signatory’s first and last name.',
  signatoryTitle: 'Enter the signatory’s title.',
  billingEmail: 'The invoice address isn’t an email address.',
  operationsName: 'Enter the operations contact’s name.',
  operationsEmail: 'The operations email isn’t an email address.',
  operationsPhone: 'Enter a phone number with its area code.',
};

export const onboardingError = (error: string, detail?: string) =>
  (error === 'invalid_details' && detail ? FIELD_TEXT[detail] : undefined) ??
  ERROR_TEXT[error] ??
  'That didn’t work. Try again.';
