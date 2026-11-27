import type { CaseStatus, CaseView, FieldDefinition, OrgRole } from './core';
import { PLACE_KINDS } from './core';
import { currentLocale, languageSwitcher } from './i18n';
import { KEY_SCOPES, type ApiKey } from './keys';
import { EVENT_TYPES, type Delivery, type Webhook } from './webhooks';

/**
 * Server-rendered pages. Every dynamic value goes through `esc`, and data (plates, addresses,
 * names) is marked translate="no" so the language engine leaves it alone. No scripts (CSP).
 */

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const data = (value: string) => `<span translate="no">${esc(value)}</span>`;

const MARK =
  '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
  '<path fill="#F15A24" d="M0 0 50 50V100L0 50Z"/>' +
  '<path fill="#F7931E" d="M100 0 50 50V100L100 50Z"/>' +
  '<path fill="#ED1C24" d="M0 50 50 100H15A15 15 0 0 1 0 85Z"/>' +
  '<path fill="#FBB03B" d="M100 50V85A15 15 0 0 1 85 100H50Z"/>' +
  '</svg>';

export interface Nav {
  signedIn: boolean;
  org?: { id: string; name: string; role: OrgRole };
  current?: 'dashboard' | 'cases' | 'new' | 'upload' | 'keys' | 'webhooks';
}

export function plate(value: string, size: '' | 'large' = ''): string {
  const m = /^(\d{2})([A-Z]{1,3})(\d{2,4})$/.exec(value);
  const text = m ? `${m[1] ?? ''} ${m[2] ?? ''} ${m[3] ?? ''}` : value;
  return `<span class="plate${size ? ` ${size}` : ''}" translate="no"><span>${esc(text)}</span></span>`;
}

const STATUS_LABEL: Record<CaseStatus, string> = {
  active: 'Searching',
  pending_identity: 'Waiting for review',
  delivered: 'In custody',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
};

export const status = (value: CaseStatus) =>
  `<span class="status ${value}">${STATUS_LABEL[value]}</span>`;

/** Turkish lira in the page's language: ₺10,000.00 in English, ₺10.000,00 in Turkish. */
export const lira = (kurus: number) =>
  `<span translate="no">₺${(kurus / 100).toLocaleString(currentLocale() === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;

export const day = (unix: number | null) =>
  unix === null
    ? '—'
    : `<time translate="no">${new Date(unix * 1000).toISOString().slice(0, 10)}</time>`;

export function layout(title: string, nav: Nav, body: string): string {
  const org = nav.org;
  const link = (key: NonNullable<Nav['current']>, href: string, label: string) =>
    `<a href="${href}"${nav.current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  const orgNav = org
    ? `<nav aria-label="Sections">
        ${link('dashboard', `/o/${org.id}`, 'Overview')}
        ${link('cases', `/o/${org.id}/cases`, 'Cases')}
        ${org.role === 'auditor' ? '' : link('new', `/o/${org.id}/cases/new`, 'Add a vehicle')}
        ${org.role === 'auditor' ? '' : link('upload', `/o/${org.id}/upload`, 'Upload CSV')}
        ${org.role === 'owner' || org.role === 'admin' ? link('keys', `/o/${org.id}/keys`, 'API keys') : ''}
        ${org.role === 'owner' || org.role === 'admin' ? link('webhooks', `/o/${org.id}/webhooks`, 'Webhooks') : ''}
      </nav>`
    : '';
  const who = nav.signedIn
    ? `<div class="who">${org ? `<a href="/" title="Switch organization">${data(org.name)}</a>` : ''}
        <form method="post" action="/signout"><button class="link" type="submit">Sign out</button></form></div>`
    : `<div class="who"><a class="button" href="/signin">Sign in</a></div>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · Emanet Kurumsal</title>
<link rel="stylesheet" href="/app.css">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
</head>
<body>
<header class="bar">
  <a class="brand" href="/">${MARK}<span translate="no">Emanet Kurumsal</span></a>
  ${orgNav}
  ${who}
</header>
<main>
${body}
</main>
<footer>
  <span>Emanet is a private service of 2earl, not a public authority.</span>
  <span><a href="https://2earl.com/privacy">Privacy</a> · <a href="https://2earl.com/terms">Terms</a> · <a href="/docs/api">API</a></span>
  ${languageSwitcher()}
</footer>
</body>
</html>`;
}

export function problem(nav: Nav, title: string, text: string): string {
  return layout(
    title,
    nav,
    `<h1>${esc(title)}</h1><p class="lede">${esc(text)}</p><p><a href="/">Back to the start</a></p>`,
  );
}

export function home(): string {
  return layout(
    'Vehicle recovery for creditors',
    { signedIn: false },
    `<section class="hero">
      <h1>Find vehicles that carry your seizure orders.</h1>
      <p class="lede">Add the vehicles your enforcement files allow you to take. Verified field agents look for them, report them to the police, and follow them to a custodian car park. You see each step, and you pay only for vehicles that reach custody.</p>
      <p><a class="button" href="/signin">Sign in with 2earl</a></p>
      <ul class="plain">
        <li>Upload by form, CSV or API. Get notified by webhook.</li>
        <li>Agents never see a debtor’s name or debt.</li>
        <li>Access only for organizations set up by 2earl.</li>
      </ul>
    </section>`,
  );
}

export function orgPicker(choices: { orgId: string; name: string; role: OrgRole }[]): string {
  const body =
    choices.length === 0
      ? `<h1>No organization yet</h1>
         <p class="lede">Your account isn’t part of an organization that uses Emanet. Ask your organization’s administrator for an invitation, or write to legal@2earl.com.</p>`
      : `<h1>Choose an organization</h1>
         <ul class="plain">${choices
           .map((o) => `<li><a href="/o/${esc(o.orgId)}">${data(o.name)}</a></li>`)
           .join('')}</ul>`;
  return layout('Organizations', { signedIn: true }, body);
}

export function dashboard(
  nav: Nav,
  counts: Record<CaseStatus, number>,
  recent: CaseView[],
): string {
  const org = nav.org;
  if (!org) throw new Error('dashboard needs an organization');
  const tiles = (['active', 'pending_identity', 'delivered', 'expired', 'withdrawn'] as const)
    .map(
      (s) =>
        `<a href="/o/${org.id}/cases?status=${s}"><strong translate="no">${String(counts[s])}</strong><span>${STATUS_LABEL[s]}</span></a>`,
    )
    .join('');
  return layout(
    'Overview',
    { ...nav, current: 'dashboard' },
    `<h1>Overview</h1>
     <p class="lede">Cases stay searchable for as long as you confirm them. Confirm them again, or send them again, before they expire.</p>
     <div class="counts">${tiles}</div>
     <h2>Recently changed</h2>
     ${caseTable(org.id, recent)}`,
  );
}

function caseTable(orgId: string, cases: CaseView[]): string {
  if (cases.length === 0) return '<p class="panel">No cases here yet.</p>';
  return `<table class="cases">
    <thead><tr><th>Plate</th><th>Vehicle</th><th>Your reference</th><th>Status</th><th class="num">Fee</th><th>Expires</th></tr></thead>
    <tbody>${cases
      .map(
        (c) => `<tr>
          <td><a href="/o/${orgId}/cases/${c.id}">${plate(c.vehicle.plate)}</a></td>
          <td>${data(`${c.vehicle.make} ${c.vehicle.model}${c.vehicle.year ? ` ${String(c.vehicle.year)}` : ''}`)}</td>
          <td>${data(c.external_ref)}</td>
          <td>${status(c.status)}</td>
          <td class="num">${lira(c.fee_kurus)}</td>
          <td>${c.status === 'active' || c.status === 'pending_identity' ? day(c.expires_at) : '—'}</td>
        </tr>`,
      )
      .join('')}</tbody>
  </table>`;
}

export function caseList(
  nav: Nav,
  cases: CaseView[],
  filter: CaseStatus | null,
  next: string | null,
): string {
  const org = nav.org;
  if (!org) throw new Error('caseList needs an organization');
  const filters = [
    `<a href="/o/${org.id}/cases"${filter === null ? ' aria-current="page"' : ''}>All</a>`,
    ...(['active', 'pending_identity', 'delivered', 'expired', 'withdrawn'] as const).map(
      (s) =>
        `<a href="/o/${org.id}/cases?status=${s}"${filter === s ? ' aria-current="page"' : ''}>${STATUS_LABEL[s]}</a>`,
    ),
  ].join(' · ');
  const more = next
    ? `<p><a class="button secondary" href="/o/${org.id}/cases?${filter ? `status=${filter}&amp;` : ''}cursor=${encodeURIComponent(next)}">Next page</a></p>`
    : '';
  return layout(
    'Cases',
    { ...nav, current: 'cases' },
    `<h1>Cases</h1><p>${filters}</p>${caseTable(org.id, cases)}${more}`,
  );
}

export function caseDetail(
  nav: Nav,
  c: CaseView,
  canWrite: boolean,
  notice: string | null,
  labels: Record<string, string>,
): string {
  const org = nav.org;
  if (!org) throw new Error('caseDetail needs an organization');
  const open = c.status === 'active' || c.status === 'pending_identity';
  const places = c.places.length
    ? `<table><thead><tr><th>Kind</th><th>Address</th><th>District</th><th>City</th></tr></thead><tbody>${c.places
        .map(
          (p) =>
            `<tr><td>${PLACE_LABEL[p.kind]}</td><td>${data(p.address)}</td><td>${data(p.district)}</td><td>${data(p.city)}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="panel">No places. Agents can only look for this vehicle in traffic.</p>';
  const attrs = Object.entries({ ...c.attributes, ...c.vehicle.attributes });
  const actions =
    canWrite && open
      ? `<h2>Withdraw</h2>
         <p class="hint">When the debt is paid, restructured or the order is lifted, withdraw the case at once: agents stop looking.</p>
         <form method="post" action="/o/${org.id}/cases/${c.id}/withdraw" class="stack">
           <label>Reason <input name="reason" required maxlength="200"></label>
           <div><button type="submit">Withdraw case</button></div>
         </form>
         <form method="post" action="/o/${org.id}/cases/${c.id}/confirm" class="actions">
           <button class="secondary" type="submit">Confirm it is still enforceable</button>
         </form>`
      : '';
  return layout(
    'Case',
    { ...nav, current: 'cases' },
    `${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
     <p>${plate(c.vehicle.plate, 'large')}</p>
     <h1>${data(`${c.vehicle.make} ${c.vehicle.model}`)} ${status(c.status)}</h1>
     ${c.status === 'pending_identity' ? '<p class="lede">2earl staff are checking this vehicle’s identity (chassis number or plate). Agents don’t see it until then.</p>' : ''}
     <div class="panel"><dl class="facts">
       <dt>Your reference</dt><dd>${data(c.external_ref)}</dd>
       <dt>Chassis number (VIN)</dt><dd>${c.vehicle.vin ? data(c.vehicle.vin) : '—'}</dd>
       <dt>Year and colour</dt><dd>${data([c.vehicle.year ? String(c.vehicle.year) : '', c.vehicle.colour ?? ''].filter(Boolean).join(', ') || '—')}</dd>
       <dt>Enforcement office</dt><dd>${data(c.icra_office)}</dd>
       <dt>File number</dt><dd>${data(c.icra_file_no)}</dd>
       <dt>Seizure order date</dt><dd>${data(c.serh_date)}</dd>
       <dt>Legal basis</dt><dd>${c.legal_basis === 'rehin' ? 'Pledge (rehin)' : 'Attachment (haciz)'}</dd>
       <dt>Fee</dt><dd>${lira(c.fee_kurus)}</dd>
       <dt>Last confirmed</dt><dd>${day(c.last_confirmed_at)}</dd>
       <dt>${open ? 'Expires' : 'Closed'}</dt><dd>${open ? day(c.expires_at) : day(c.delivered_at ?? c.updated_at)}</dd>
       ${attrs.map(([k, v]) => `<dt>${data(labels[k] ?? k)}</dt><dd>${data(typeof v === 'boolean' ? (v ? '✓' : '✗') : String(v))}</dd>`).join('')}
     </dl></div>
     <h2>Where to look</h2>
     ${places}
     ${actions}`,
  );
}

const PLACE_LABEL: Record<(typeof PLACE_KINDS)[number], string> = {
  owner_home: 'Home',
  work: 'Work',
  last_seen: 'Last seen',
  other: 'Other',
};

export interface CaseFormValues {
  [key: string]: string;
}

export function caseForm(
  nav: Nav,
  fields: { case: FieldDefinition[]; vehicle: FieldDefinition[]; place: FieldDefinition[] },
  values: CaseFormValues,
  error: string | null,
  locale: 'en' | 'tr',
): string {
  const org = nav.org;
  if (!org) throw new Error('caseForm needs an organization');
  const v = (key: string) => esc(values[key] ?? '');
  const input = (name: string, label: string, attrs = '', hint = '') =>
    `<label>${label}${hint ? ` <small>${hint}</small>` : ''}<input name="${name}" value="${v(name)}" ${attrs}></label>`;
  const custom = (prefix: string, list: FieldDefinition[]) =>
    list
      .filter((f) => !f.deprecated)
      .map((f) => {
        const label = `<span translate="no">${esc(locale === 'tr' ? f.labelTr : f.labelEn)}</span>`;
        const name = `${prefix}.${f.key}`;
        const required = f.required ? ' required' : '';
        if (f.type === 'enum') {
          return `<label>${label}<select name="${name}"${required}><option value=""></option>${(
            f.enumValues ?? []
          )
            .map(
              (o) =>
                `<option${values[name] === o ? ' selected' : ''} translate="no">${esc(o)}</option>`,
            )
            .join('')}</select></label>`;
        }
        if (f.type === 'bool') {
          return `<label>${label}<select name="${name}"${required}><option value=""></option><option value="true"${values[name] === 'true' ? ' selected' : ''}>Yes</option><option value="false"${values[name] === 'false' ? ' selected' : ''}>No</option></select></label>`;
        }
        const type = f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text';
        return `<label>${label}<input name="${name}" type="${type}" value="${v(name)}"${required}></label>`;
      })
      .join('');
  const customCase = custom('case', fields.case);
  const customVehicle = custom('vehicle', fields.vehicle);
  const customPlace = custom('place', fields.place);
  return layout(
    'Add a vehicle',
    { ...nav, current: 'new' },
    `<h1>Add a vehicle</h1>
     <p class="lede">Only vehicles with an active seizure order (yakalama şerhi) on your enforcement file. Sending the same reference again updates the case.</p>
     ${error ? `<p class="error">${esc(error)}</p>` : ''}
     <form method="post" class="stack">
       <fieldset><legend>Vehicle</legend><div class="grid2">
         ${input('plate', 'Plate', 'required maxlength="12" autocomplete="off"', 'e.g. 34 ABC 123')}
         ${input('vin', 'Chassis number (VIN)', 'maxlength="20" autocomplete="off"', '17 characters; without it, staff check the vehicle first')}
         ${input('make', 'Make', 'required maxlength="60"')}
         ${input('model', 'Model', 'required maxlength="60"')}
         ${input('year', 'Year', 'inputmode="numeric" maxlength="4"')}
         ${input('colour', 'Colour', 'maxlength="40"')}
         ${customVehicle}
       </div></fieldset>
       <fieldset><legend>Enforcement file</legend><div class="grid2">
         ${input('external_ref', 'Your reference', 'required maxlength="100"', 'unique in your organization')}
         ${input('icra_office', 'Enforcement office', 'required maxlength="120"', 'e.g. İstanbul 5. İcra Dairesi')}
         ${input('icra_file_no', 'File number', 'required maxlength="40"', 'e.g. 2026/12345')}
         ${input('serh_date', 'Seizure order date', 'type="date" required')}
         <label>Legal basis<select name="legal_basis" required>
           <option value="rehin"${values.legal_basis === 'haciz' ? '' : ' selected'}>Pledge (rehin)</option>
           <option value="haciz"${values.legal_basis === 'haciz' ? ' selected' : ''}>Attachment (haciz)</option>
         </select></label>
         ${customCase}
       </div></fieldset>
       <fieldset><legend>Where to look</legend>
         <p class="hint">Agents see the street address only while they hold the vehicle, and never your customer’s name.</p>
         <div class="grid2">
         <label>Kind<select name="place_kind">${PLACE_KINDS.map((k) => `<option value="${k}"${values.place_kind === k ? ' selected' : ''}>${PLACE_LABEL[k]}</option>`).join('')}</select></label>
         ${input('address', 'Address', 'maxlength="300"')}
         ${input('district', 'District', 'maxlength="60"')}
         ${input('city', 'City', 'maxlength="60"')}
         ${customPlace}
       </div></fieldset>
       <div><button type="submit">Add vehicle</button></div>
     </form>`,
  );
}

export function upload(
  nav: Nav,
  result: { uploadId: string; count: number; errors: { row: number; message: string }[] } | null,
  imported: { ok: number; failed: { ref: string; error: string }[] } | null,
  error: string | null,
): string {
  const org = nav.org;
  if (!org) throw new Error('upload needs an organization');
  let body = `<h1>Upload CSV</h1>
    <p class="lede">One row per place; rows with the same reference are one case. Column names in English or Turkish, separated by semicolons or commas, saved as UTF-8. Dates as 2026-10-01 or 01.10.2026.</p>
    <p><a class="button secondary" href="/o/${org.id}/upload/template.csv">Download the template</a></p>`;
  if (error) body += `<p class="error">${esc(error)}</p>`;
  if (imported) {
    body += `<p class="notice">Imported <span translate="no">${String(imported.ok)}</span> cases.</p>`;
    if (imported.failed.length) {
      body += `<h2>Not imported</h2><table><thead><tr><th>Reference</th><th>Problem</th></tr></thead><tbody>${imported.failed
        .map((f) => `<tr><td>${data(f.ref)}</td><td translate="no">${esc(f.error)}</td></tr>`)
        .join('')}</tbody></table>`;
    }
  }
  if (result) {
    if (result.errors.length) {
      body += `<h2>Problems in the file</h2><p>Fix these and upload again. Nothing was imported.</p>
        <table><thead><tr><th>Row</th><th>Problem</th></tr></thead><tbody>${result.errors
          .map((e) => `<tr><td translate="no">${String(e.row)}</td><td>${esc(e.message)}</td></tr>`)
          .join('')}</tbody></table>`;
    } else {
      body += `<div class="panel"><p>The file is ready: <strong translate="no">${String(result.count)}</strong> cases.</p>
        <form method="post" action="/o/${org.id}/upload/${esc(result.uploadId)}"><button type="submit">Import</button></form></div>`;
    }
  }
  body += `<h2>Check a file</h2>
    <form method="post" enctype="multipart/form-data" class="stack">
      <label>CSV file <input type="file" name="file" accept=".csv,text/csv" required></label>
      <div><button type="submit">Check file</button></div>
    </form>`;
  return layout('Upload CSV', { ...nav, current: 'upload' }, body);
}

export function keysPage(
  nav: Nav,
  keys: ApiKey[],
  created: { key: string } | null,
  error: string | null,
  fresh: boolean,
): string {
  const org = nav.org;
  if (!org) throw new Error('keysPage needs an organization');
  const rows = keys.length
    ? `<table><thead><tr><th>Name</th><th>Key</th><th>Permissions</th><th>Last used</th><th>Expires</th><th></th></tr></thead><tbody>${keys
        .map(
          (
            k,
          ) => `<tr><td>${data(k.name)}</td><td><code translate="no">${esc(k.prefix)}_…</code></td><td translate="no">${esc(k.scopes.join(', '))}</td>
            <td>${day(k.last_used_at)}</td><td>${k.revoked_at ? 'Revoked' : day(k.expires_at)}</td>
            <td>${k.revoked_at ? '' : `<form method="post" action="/o/${org.id}/keys/${k.id}/revoke"><button class="secondary" type="submit">Revoke</button></form>`}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="panel">No API keys yet.</p>';
  const form = fresh
    ? `<form method="post" class="stack">
        <label>Name <input name="name" required maxlength="60" placeholder="Core banking export"></label>
        <fieldset><legend>Permissions</legend><div class="checks">${KEY_SCOPES.map(
          (s) =>
            `<label><input type="checkbox" name="scopes" value="${s}" checked> <code translate="no">${s}</code></label>`,
        ).join('')}</div></fieldset>
        <label>Expires <select name="expires"><option value="90">After 90 days</option><option value="365">After a year</option><option value="never">Never</option></select></label>
        <div><button type="submit">Create key</button></div>
      </form>`
    : `<p class="panel">Creating a key needs a recent second factor. <a href="/signin?second_factor=1&amp;return=${encodeURIComponent(`/o/${org.id}/keys`)}">Verify it now</a>.</p>`;
  return layout(
    'API keys',
    { ...nav, current: 'keys' },
    `<h1>API keys</h1>
     <p class="lede">A key acts for the whole organization. Keep it in your systems’ secret store; it is shown only once.</p>
     ${error ? `<p class="error">${esc(error)}</p>` : ''}
     ${created ? `<div class="notice"><p>Copy the key now. It won’t be shown again.</p><code class="secret" translate="no">${esc(created.key)}</code></div>` : ''}
     ${rows}
     <h2>New key</h2>${form}
     <p class="hint">How to use it: <a href="/docs/api">API reference</a>.</p>`,
  );
}

export function webhooksPage(
  nav: Nav,
  hooks: Webhook[],
  deliveries: (Delivery & { url: string })[],
  created: { secret: string } | null,
  error: string | null,
  fresh: boolean,
): string {
  const org = nav.org;
  if (!org) throw new Error('webhooksPage needs an organization');
  const rows = hooks.length
    ? `<table><thead><tr><th>Address</th><th>Events</th><th>State</th><th></th></tr></thead><tbody>${hooks
        .map(
          (h) => `<tr><td>${data(h.url)}</td><td translate="no">${esc(h.events.join(', '))}</td>
            <td>${h.disabled_at ? 'Switched off after repeated failures' : 'On'}</td>
            <td class="actions">${h.disabled_at ? `<form method="post" action="/o/${org.id}/webhooks/${h.id}/enable"><button class="secondary" type="submit">Switch on</button></form>` : ''}
            <form method="post" action="/o/${org.id}/webhooks/${h.id}/delete"><button class="secondary" type="submit">Delete</button></form></td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="panel">No webhooks yet.</p>';
  const log = deliveries.length
    ? `<table><thead><tr><th>Time</th><th>Event</th><th>Address</th><th>Result</th></tr></thead><tbody>${deliveries
        .map(
          (
            d,
          ) => `<tr><td>${day(d.created_at)}</td><td translate="no">${esc(d.event_type)}</td><td>${data(d.url)}</td>
            <td>${d.status === 'delivered' ? 'Delivered' : d.status === 'failed' ? 'Gave up' : 'Retrying'}${d.last_status !== null ? ` <span translate="no">(HTTP ${String(d.last_status)}, ×${String(d.attempts)})</span>` : ''}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="panel">Nothing sent yet.</p>';
  const form = fresh
    ? `<form method="post" class="stack">
        <label>Address <input name="url" type="url" required placeholder="https://bank.example/emanet/events"></label>
        <fieldset><legend>Events</legend><div class="checks">${EVENT_TYPES.map(
          (e) =>
            `<label><input type="checkbox" name="events" value="${e}" checked> <code translate="no">${e}</code></label>`,
        ).join('')}</div></fieldset>
        <div><button type="submit">Add webhook</button></div>
      </form>`
    : `<p class="panel">Adding a webhook needs a recent second factor. <a href="/signin?second_factor=1&amp;return=${encodeURIComponent(`/o/${org.id}/webhooks`)}">Verify it now</a>.</p>`;
  return layout(
    'Webhooks',
    { ...nav, current: 'webhooks' },
    `<h1>Webhooks</h1>
     <p class="lede">We call your address when a vehicle reaches custody, a case expires, 2earl rejects a case it couldn’t identify, or an invoice is issued. Each call is signed: check the <code translate="no">Emanet-Signature</code> header with the secret.</p>
     ${error ? `<p class="error">${esc(error)}</p>` : ''}
     ${created ? `<div class="notice"><p>Copy the signing secret now. It won’t be shown again.</p><code class="secret" translate="no">${esc(created.secret)}</code></div>` : ''}
     ${rows}
     <h2>New webhook</h2>${form}
     <h2>Recent deliveries</h2>${log}`,
  );
}

export function apiDocs(origin: string): string {
  const e = esc(origin);
  return layout(
    'API',
    { signedIn: false },
    `<h1>API</h1>
     <p class="lede">JSON over HTTPS, one organization per key. Create keys under API keys (owners and admins).</p>
     <h2>Authentication</h2>
     <p>Send the key as a Bearer token: <code translate="no">Authorization: Bearer emk_…</code>. Limit: 300 requests a minute per key.</p>
     <h2>Endpoints</h2>
     <table><thead><tr><th>Request</th><th>Permission</th><th>What it does</th></tr></thead><tbody>
       <tr><td><code translate="no">GET ${e}/api/v1/schema</code></td><td translate="no">cases:read</td><td>Your custom fields</td></tr>
       <tr><td><code translate="no">POST ${e}/api/v1/cases</code></td><td translate="no">cases:write</td><td>Add a case, or update the one with the same external_ref</td></tr>
       <tr><td><code translate="no">GET ${e}/api/v1/cases?status=&amp;updated_since=&amp;cursor=&amp;limit=</code></td><td translate="no">cases:read</td><td>List your cases</td></tr>
       <tr><td><code translate="no">GET ${e}/api/v1/cases/{id}</code></td><td translate="no">cases:read</td><td>One case</td></tr>
       <tr><td><code translate="no">POST ${e}/api/v1/cases/confirm</code></td><td translate="no">cases:write</td><td>Confirm cases are still enforceable</td></tr>
       <tr><td><code translate="no">POST ${e}/api/v1/cases/{id}/withdraw</code></td><td translate="no">cases:write</td><td>Withdraw a case</td></tr>
       <tr><td><code translate="no">GET ${e}/api/v1/events?cursor=</code></td><td translate="no">events:read</td><td>Events, oldest first, if you poll instead of using webhooks</td></tr>
     </tbody></table>
     <h2>A case</h2>
     <pre class="secret" translate="no">{
  "external_ref": "K-2026-0001",
  "vin": "VF1RJA00061234567",
  "plate": "34 ABC 123",
  "make": "Renault", "model": "Clio", "year": 2021, "colour": "Beyaz",
  "icra_office": "İstanbul 5. İcra Dairesi", "icra_file_no": "2026/12345",
  "serh_date": "2026-10-01", "legal_basis": "rehin",
  "places": [{ "kind": "owner_home", "address": "…", "district": "Kadıköy", "city": "İstanbul" }],
  "attributes": {}, "vehicle_attributes": {}
}</pre>
     <h2>Errors</h2>
     <p>Errors are <code translate="no">{ "error": "code", "detail": "…" }</code> with status 400, 401, 403, 404, 409 (duplicate_case, case_closed, vin_mismatch, conflict_retry), 422 (invalid input) or 429.</p>
     <h2>Webhook signatures</h2>
     <p>Each call carries <code translate="no">Emanet-Signature: t=&lt;unix time&gt;,v1=&lt;hex&gt;</code>, where the hex is HMAC-SHA256 of <code translate="no">&lt;t&gt;.&lt;body&gt;</code> with the webhook’s secret. Refuse calls more than five minutes old, and use <code translate="no">Emanet-Event-Id</code> to ignore repeats.</p>`,
  );
}
