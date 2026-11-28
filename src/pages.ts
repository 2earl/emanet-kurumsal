import type { CaseStatus, CaseView, FieldDefinition, OrgRole, Province } from './core';
import { PLACE_KINDS } from './core';
import { card, facts, pageHead, split, stat, stats, tabs, wrapTables } from './dash';
import { icon, scene, type IconName } from './icons';
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

/** Text written in both languages where it is used; whatever shows it marks it translate="no". */
export const L = (en: string, tr: string) => (currentLocale() === 'tr' ? tr : en);

export const data = (value: string) => `<span translate="no">${esc(value)}</span>`;

const MARK =
  '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
  '<path fill="#F15A24" d="M0 0 50 50V100L0 50Z"/>' +
  '<path fill="#F7931E" d="M100 0 50 50V100L100 50Z"/>' +
  '<path fill="#ED1C24" d="M0 50 50 100H15A15 15 0 0 1 0 85Z"/>' +
  '<path fill="#FBB03B" d="M100 50V85A15 15 0 0 1 85 100H50Z"/>' +
  // Emanet: the 2earl hands holding something entrusted to them.
  '<path fill="#ED1C24" d="M50 7 66 23 50 39 34 23Z"/>' +
  '</svg>';

export interface Nav {
  signedIn: boolean;
  org?: { id: string; name: string; role: OrgRole };
  /** Support messages 2earl answered; announced on every page except the support pages. */
  answers?: number;
  current?:
    'dashboard' | 'cases' | 'new' | 'upload' | 'invoices' | 'reports' | 'integrations' | 'support';
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

const STATUS_ICON: Record<CaseStatus, IconName> = {
  active: 'search',
  pending_identity: 'clock',
  delivered: 'check',
  withdrawn: 'undo',
  expired: 'alert',
};

export const status = (value: CaseStatus) =>
  `<span class="status ${value}">${STATUS_LABEL[value]}</span>`;

/** Turkish lira in the page's language: ₺10,000.00 in English, ₺10.000,00 in Turkish. */
export const lira = (kurus: number) =>
  `<span translate="no">₺${(kurus / 100).toLocaleString(currentLocale() === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;

/** Turkey's time (UTC+3 all year): what a date means to the people using Emanet. */
const turkey = (unix: number) => new Date((unix + 3 * 3600) * 1000).toISOString();

export const day = (unix: number | null) =>
  unix === null ? '—' : `<time translate="no">${turkey(unix).slice(0, 10)}</time>`;

/** A date and time in Turkey's time. */
export const moment = (unix: number) =>
  `<time translate="no">${turkey(unix).slice(0, 16).replace('T', ' ')}</time>`;

const ROLE_NAME: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  auditor: 'Auditor',
};

const SECTION_NAME: Record<NonNullable<Nav['current']>, string> = {
  dashboard: 'Overview',
  cases: 'Cases',
  new: 'Add a vehicle',
  upload: 'Upload CSV',
  invoices: 'Invoices',
  reports: 'Reports',
  integrations: 'Integrations',
  support: 'Support',
};

/**
 * Every page (2earl dashboard layout): the organization and its sections in a rail on the left (a
 * menu on a phone), a top bar with where you are, the case search and the one quick action.
 */
export function layout(title: string, nav: Nav, body: string): string {
  const org = nav.org;
  const writer = org ? org.role !== 'auditor' : false;
  const link = (key: NonNullable<Nav['current']>, href: string, glyph: IconName, extra = '') =>
    `<a href="${href}"${nav.current === key ? ' aria-current="page"' : ''}>${icon(glyph)}<span>${SECTION_NAME[key]}</span>${extra}</a>`;
  const group = (label: string) => `<span class="group">${label}</span>`;
  const orgNav = org
    ? `<a class="org" href="/" title="Switch organization"><span>Organization</span><strong translate="no">${esc(org.name)}</strong></a>
      <nav aria-label="Sections">
        ${group('Cases')}
        ${link('dashboard', `/o/${org.id}`, 'home')}
        ${link('cases', `/o/${org.id}/cases`, 'folder')}
        ${writer ? link('new', `/o/${org.id}/cases/new`, 'plus') : ''}
        ${writer ? link('upload', `/o/${org.id}/upload`, 'upload') : ''}
        ${group('Money')}
        ${link('invoices', `/o/${org.id}/invoices`, 'invoice')}
        ${link('reports', `/o/${org.id}/reports`, 'chart')}
        ${group('Help')}
        ${link('support', `/o/${org.id}/support`, 'mail', nav.answers ? ` <span class="count" translate="no">${String(nav.answers)}</span>` : '')}
        ${org.role === 'owner' || org.role === 'admin' ? link('integrations', `/o/${org.id}/keys`, 'plug') : ''}
        <a href="/docs/api">${icon('code')}<span>API documentation</span></a>
      </nav>`
    : '';
  const account = nav.signedIn
    ? `<div class="account">${org ? `<span><span class="who-name" translate="no">${esc(org.name)}</span><span class="who-role">${ROLE_NAME[org.role]}</span></span>` : ''}
        <form method="post" action="/signout"><button class="link" type="submit">Sign out</button></form></div>`
    : `<div class="account"><a class="button" href="/signin">Sign in</a></div>`;
  const topbar = org
    ? `<div class="topbar"><p class="where">${nav.current ? `<strong>${SECTION_NAME[nav.current]}</strong>` : ''}</p>
        <div class="tools">
          <form class="search" method="get" action="/o/${esc(org.id)}/cases" role="search"><label><span class="visually-hidden">Find a case</span>${icon('search')}<input name="q" type="search" maxlength="60" placeholder="Plate, chassis number or reference" autocomplete="off" spellcheck="false"></label></form>
          ${writer && nav.current !== 'new' ? `<a class="button" href="/o/${esc(org.id)}/cases/new">${icon('plus')}<span>Add a vehicle</span></a>` : ''}
        </div></div>`
    : '';
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
<body class="shell">
<a class="skip" href="#main">Skip to content</a>
<header class="rail">
  <a class="brand" href="/">${MARK}<span translate="no">Emanet Kurumsal</span></a>
  ${
    org
      ? `<details class="menu"><summary>${icon('menu')}<span>Menu</span></summary></details><div class="menu-body">${orgNav}${account}</div>`
      : account
  }
</header>
<div class="frame">
${topbar}
<main id="main">
${
  org && nav.answers && nav.current !== 'support'
    ? `<a class="ask-banner" href="/o/${esc(org.id)}/support">${icon('mail')}<span><strong>2earl answered your message</strong> Read the answer</span></a>`
    : ''
}
${wrapTables(body)}
</main>
<footer>
  <span>Emanet is a private service of 2earl, not a public authority.</span>
  <span><a href="https://emanet.dev/gizlilik">Privacy notice</a> · <a href="https://emanet.dev/kullanim-sartlari">Terms of use</a> · <a href="https://emanet.dev/cerezler">Cookies</a> · <a href="mailto:iletisim@emanet.dev">Contact</a> · <a href="/docs/api">API</a></span>
  ${languageSwitcher()}
</footer>
</div>
</body>
</html>`;
}

/** API keys and webhooks: one section, two pages. */
function integrationTabs(orgId: string, current: 'keys' | 'webhooks'): string {
  return tabs('Integrations', [
    { href: `/o/${esc(orgId)}/keys`, label: 'API keys', current: current === 'keys' },
    { href: `/o/${esc(orgId)}/webhooks`, label: 'Webhooks', current: current === 'webhooks' },
  ]);
}

/**
 * The breadcrumb (2earl design system): parents as links, then this page. Each item is HTML
 * already made safe by the caller. On a phone only the direct parent shows, as one step back.
 */
export function crumbs(items: string[]): string {
  const last = items.length - 1;
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items
    .map((item, i) =>
      i === last
        ? `<li><span aria-current="page">${item}</span></li>`
        : `<li${i === last - 1 ? ' class="back-to"' : ''}>${item}</li>`,
    )
    .join('')}</ol></nav>`;
}

/** Where a case is on its way to custody: done, now, still to come. Closed cases show none. */
function caseStages(statusNow: CaseStatus): string {
  if (statusNow === 'withdrawn' || statusNow === 'expired') return '';
  const now = statusNow === 'pending_identity' ? 1 : statusNow === 'active' ? 2 : 4;
  const names = ['Added', '2earl checks the vehicle', 'Agents are looking', 'In custody'];
  return `<ol class="progress stages" aria-label="Where this case is">${names
    .map(
      (name, i) =>
        `<li class="${i < now ? 'done' : i === now ? 'now' : ''}"><span${i === now ? ' aria-current="step"' : ''}>${name}</span></li>`,
    )
    .join('')}</ol>`;
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
    `<section class="hero with-scene">
      <div>
      <h1>Find vehicles that carry your seizure orders.</h1>
      <p class="lede">Add the vehicles your enforcement files allow you to take. Verified field agents look for them, report them to the police, and follow them to a custodian car park. You see each step, and you pay only for vehicles that reach custody.</p>
      <p><a class="button" href="/signin">Sign in with 2earl</a></p>
      <ul class="plain">
        <li>Upload by form, CSV or API. Get notified by webhook.</li>
        <li>Agents never see a debtor’s name or debt.</li>
        <li>Access only for organizations set up by 2earl.</li>
      </ul>
      <p class="hint">New to Emanet? <a href="https://emanet.dev">See how it works</a>, or write to <a href="mailto:iletisim@emanet.dev">iletisim@emanet.dev</a>.</p>
      </div>
      ${scene('road')}
    </section>`,
  );
}

export function orgPicker(choices: { orgId: string; name: string; role: OrgRole }[]): string {
  const body =
    choices.length === 0
      ? `<h1>No organization yet</h1>
         <p class="lede">Your account isn’t part of an organization that uses Emanet. Ask your organization’s administrator for an invitation, or write to iletisim@emanet.dev.</p>`
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
  expiring: CaseView[],
  canWrite: boolean,
  notice: string | null,
): string {
  const org = nav.org;
  if (!org) throw new Error('dashboard needs an organization');
  const tone: Record<CaseStatus, 'good' | 'wait' | 'info' | 'alert' | 'quiet'> = {
    active: 'good',
    pending_identity: 'wait',
    delivered: 'info',
    expired: 'alert',
    withdrawn: 'quiet',
  };
  const tiles = stats(
    (['active', 'pending_identity', 'delivered', 'expired', 'withdrawn'] as const).map((s) =>
      stat({
        label: STATUS_LABEL[s],
        value: String(counts[s]),
        tone: counts[s] === 0 ? 'quiet' : tone[s],
        href: `/o/${org.id}/cases?status=${s}`,
        icon: icon(STATUS_ICON[s]),
      }),
    ),
  );
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const actions = canWrite
    ? `<a class="button secondary" href="/o/${org.id}/upload">${icon('upload')}<span>Upload CSV</span></a><a class="button secondary" href="/docs/api">${icon('code')}<span>API</span></a>`
    : '';
  const soon = card({
    title: 'Expiring within three days',
    ...(expiring.length ? { count: String(expiring.length) } : {}),
    flush: true,
    body: expiring.length
      ? canWrite
        ? `<form method="post" action="/o/${org.id}/cases/confirm">
             <ul class="rows">${expiring
               .map(
                 (c) =>
                   `<li><label class="row-check"><input type="checkbox" name="case_ids" value="${esc(c.id)}" checked aria-label="${esc(c.vehicle.plate)}"></label><span class="row-text"><a href="/o/${org.id}/cases/${c.id}">${plate(c.vehicle.plate)}</a><span translate="no">${esc(c.external_ref)}</span></span><span class="row-end">${day(c.expires_at)}</span></li>`,
               )
               .join('')}</ul>
             <div class="card-foot"><span>Agents stop looking when a case expires.</span><button type="submit">Confirm the chosen cases</button></div>
           </form>`
        : `<ul class="rows">${expiring
            .map(
              (c) =>
                `<li><span class="row-text"><a href="/o/${org.id}/cases/${c.id}">${plate(c.vehicle.plate)}</a><span translate="no">${esc(c.external_ref)}</span></span><span class="row-end">${day(c.expires_at)}</span></li>`,
            )
            .join('')}</ul>`
      : '<p>Nothing expires in the next three days.</p>',
  });
  const start = canWrite
    ? card({
        title: 'Send vehicles',
        flush: true,
        body: `<ul class="rows">
          <li><a class="row-link" href="/o/${org.id}/cases/new"><span class="row-icon">${icon('plus')}</span><span class="row-text"><strong>Add a vehicle</strong><span>One case, with the form</span></span></a></li>
          <li><a class="row-link" href="/o/${org.id}/upload"><span class="row-icon">${icon('upload')}</span><span class="row-text"><strong>Upload CSV</strong><span>Many cases at once</span></span></a></li>
          <li><a class="row-link" href="/docs/api"><span class="row-icon">${icon('code')}</span><span class="row-text"><strong>API</strong><span>Straight from your systems</span></span></a></li>
        </ul>`,
      })
    : '';
  return layout(
    'Overview',
    { ...nav, current: 'dashboard' },
    `${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
     ${pageHead({
       title: 'Overview',
       lede: 'Cases stay searchable for as long as you confirm them. Confirm them again, or send them again, before they expire.',
       ...(actions ? { actions } : {}),
     })}
     ${tiles}
     ${
       total === 0
         ? `<div class="panel empty">${scene('plate')}<h2>No vehicles yet</h2><p>Add your first vehicle with the form, upload a CSV file, or connect your systems with the <a href="/docs/api">API</a>.</p></div>`
         : `${start ? `<div class="cols-2">${soon}${start}</div>` : soon}
           ${card({
             title: 'Recently changed',
             tools: `<a class="button secondary" href="/o/${org.id}/cases">See all cases</a>`,
             flush: true,
             body: `<div class="table-wrap">${caseTable(org.id, recent)}</div>`,
           })}`
     }`,
  );
}

/** Days until a case stops being searched; a warning from three days on. */
function expiry(c: CaseView, now: number | null): string {
  if (c.status !== 'active' && c.status !== 'pending_identity') return '—';
  if (now === null) return day(c.expires_at);
  const days = Math.ceil((c.expires_at - now) / 86_400);
  if (days > 3) return day(c.expires_at);
  const text = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${String(days)} days`;
  return `${day(c.expires_at)} <span class="status expired">${text}</span>`;
}

function caseTable(
  orgId: string,
  cases: CaseView[],
  now: number | null = null,
  empty = 'No cases here yet.',
  /** A box on each open case, to confirm several at once. */
  selectable = false,
): string {
  if (cases.length === 0) {
    return `<div class="panel empty">${scene('inbox')}<p>${empty}</p></div>`;
  }
  const open = (c: CaseView) => c.status === 'active' || c.status === 'pending_identity';
  return `<table class="cases${selectable ? ' selectable' : ''}">
    <thead><tr>${selectable ? '<th class="pick"><span class="visually-hidden">Choose</span></th>' : ''}<th>Plate</th><th>Vehicle</th><th>Your reference</th><th>Status</th><th class="num">Fee</th><th>Expires</th></tr></thead>
    <tbody>${cases
      .map(
        (c) => `<tr>
          ${selectable ? `<td class="pick">${open(c) ? `<input type="checkbox" name="case_ids" value="${esc(c.id)}" aria-label="${esc(c.vehicle.plate)}" translate="no">` : ''}</td>` : ''}
          <td class="c-plate"><a href="/o/${orgId}/cases/${c.id}">${plate(c.vehicle.plate)}</a></td>
          <td class="c-vehicle">${data(`${c.vehicle.make} ${c.vehicle.model}${c.vehicle.year ? ` ${String(c.vehicle.year)}` : ''}`)}</td>
          <td class="c-ref">${data(c.external_ref)}</td>
          <td class="c-status">${status(c.status)}</td>
          <td class="num c-fee">${lira(c.fee_kurus)}</td>
          <td class="c-expires">${expiry(c, now)}</td>
        </tr>`,
      )
      .join('')}</tbody>
  </table>`;
}

/** The cases list for a spreadsheet: a cell that starts like a formula is made harmless. */
export function casesCsv(cases: CaseView[]): string {
  const cell = (v: string | number | null) => {
    const text = v === null ? '' : String(v);
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const date = (unix: number | null) =>
    unix === null ? '' : new Date((unix + 3 * 3600) * 1000).toISOString().slice(0, 10);
  const rows: (string | number | null)[][] = [
    [
      'your_reference',
      'plate',
      'chassis_number',
      'make',
      'model',
      'year',
      'status',
      'fee_try',
      'enforcement_office',
      'file_number',
      'last_confirmed',
      'expires',
      'in_custody',
    ],
    ...cases.map((c) => [
      c.external_ref,
      c.vehicle.plate,
      c.vehicle.vin,
      c.vehicle.make,
      c.vehicle.model,
      c.vehicle.year,
      c.status,
      (c.fee_kurus / 100).toFixed(2),
      c.icra_office,
      c.icra_file_no,
      date(c.last_confirmed_at),
      c.status === 'active' || c.status === 'pending_identity' ? date(c.expires_at) : '',
      date(c.delivered_at),
    ]),
  ];
  return `${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;
}

export function caseList(
  nav: Nav,
  cases: CaseView[],
  filter: CaseStatus | null,
  next: string | null,
  search = '',
  now: number | null = null,
  canWrite = false,
  noticeText: string | null = null,
): string {
  const org = nav.org;
  if (!org) throw new Error('caseList needs an organization');
  const keep = (extra: string) =>
    [filter ? `status=${filter}` : '', search ? `q=${encodeURIComponent(search)}` : '', extra]
      .filter(Boolean)
      .join('&amp;');
  const filters = tabs('Cases by status', [
    {
      href: `/o/${org.id}/cases${search ? `?q=${encodeURIComponent(search)}` : ''}`,
      label: 'All',
      current: filter === null,
    },
    ...(['active', 'pending_identity', 'delivered', 'expired', 'withdrawn'] as const).map((st) => ({
      href: `/o/${org.id}/cases?status=${st}${search ? `&amp;q=${encodeURIComponent(search)}` : ''}`,
      label: STATUS_LABEL[st],
      current: filter === st,
    })),
  ]);
  const more = next
    ? `<a class="button secondary" href="/o/${org.id}/cases?${keep(`cursor=${encodeURIComponent(next)}`)}">Next page</a>`
    : '';
  const searchForm = `<form method="get" action="/o/${org.id}/cases" role="search">
      ${filter ? `<input type="hidden" name="status" value="${esc(filter)}">` : ''}
      <label><span class="visually-hidden">Plate, chassis number or your reference</span><input name="q" type="search" maxlength="60" value="${esc(search)}" placeholder="Plate, chassis number or reference" autocomplete="off" spellcheck="false"></label>
      <button class="secondary" type="submit">Find</button>
      ${search ? `<a href="/o/${org.id}/cases${filter ? `?status=${filter}` : ''}">Clear</a>` : ''}
    </form>`;
  const empty = search
    ? 'No case matches. Check the plate or the reference; the search looks for an exact match.'
    : filter
      ? 'No cases with this status.'
      : 'No cases here yet.';
  const selectable =
    canWrite && cases.some((x) => x.status === 'active' || x.status === 'pending_identity');
  return layout(
    'Cases',
    { ...nav, current: 'cases' },
    `${noticeText ? `<p class="notice">${esc(noticeText)}</p>` : ''}${pageHead({
      title: 'Cases',
      lede: 'Most recently changed first.',
      ...(cases.length
        ? {
            actions: `<a class="button secondary" href="/o/${org.id}/cases.csv${keep('') ? `?${keep('')}` : ''}">${icon('download')}<span>Download this list (CSV)</span></a>`,
          }
        : {}),
    })}
     <section class="card flush">
       <div class="card-head"><div class="card-tools">${searchForm}</div></div>
       ${filters}
       ${
         selectable
           ? `<form method="post" action="/o/${org.id}/cases/confirm">
               <input type="hidden" name="back" value="/o/${org.id}/cases${keep('') ? `?${keep('')}` : ''}">
               <div class="card-body"><div class="table-wrap">${caseTable(org.id, cases, now, empty, true)}</div></div>
               <div class="card-foot"><span>Confirm the cases whose seizure order still stands: they stay searchable for another period.</span><span class="foot-actions"><button type="submit">Confirm the chosen cases</button>${more}</span></div>
             </form>`
           : `<div class="card-body"><div class="table-wrap">${caseTable(org.id, cases, now, empty)}</div></div>
              ${more ? `<div class="card-foot"><span></span>${more}</div>` : ''}`
       }
     </section>`,
  );
}

export function caseDetail(
  nav: Nav,
  c: CaseView,
  canWrite: boolean,
  notice: string | null,
  labels: Record<string, string>,
  more: { main: string; ask: string } = { main: '', ask: '' },
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
  const keep =
    canWrite && open
      ? `<p class="hint">Agents look for this vehicle until ${day(c.expires_at)}. Confirm that the seizure order still stands to keep it searchable.</p>
         <form method="post" action="/o/${org.id}/cases/${c.id}/confirm">
           <button type="submit">Confirm it is still enforceable</button>
         </form>`
      : '';
  const withdraw =
    canWrite && open
      ? `<details class="withdraw"><summary>Withdraw this case</summary>
           <p class="hint">When the debt is paid, restructured or the order is lifted, withdraw the case at once: agents stop looking. This can’t be undone; to search again, send the case again.</p>
           <form method="post" action="/o/${org.id}/cases/${c.id}/withdraw" class="stack">
             <label>Reason <input name="reason" required maxlength="200"></label>
             <div><button class="danger" type="submit">Withdraw case</button></div>
           </form>
         </details>`
      : '';
  const vehicle = card({
    title: 'Vehicle and enforcement file',
    body: `<dl class="facts">
       <dt>Your reference</dt><dd>${data(c.external_ref)}</dd>
       <dt>Chassis number (VIN)</dt><dd>${c.vehicle.vin ? data(c.vehicle.vin) : '—'}</dd>
       <dt>Year and colour</dt><dd>${data([c.vehicle.year ? String(c.vehicle.year) : '', c.vehicle.colour ?? ''].filter(Boolean).join(', ') || '—')}</dd>
       <dt>Enforcement office</dt><dd>${data(c.icra_office)}</dd>
       <dt>File number</dt><dd>${data(c.icra_file_no)}</dd>
       <dt>Seizure order date</dt><dd>${data(c.serh_date)}</dd>
       <dt>Legal basis</dt><dd>${c.legal_basis === 'rehin' ? 'Pledge (rehin)' : 'Attachment (haciz)'}</dd>
       ${attrs.map(([k, v]) => `<dt>${data(labels[k] ?? k)}</dt><dd>${data(typeof v === 'boolean' ? (v ? '✓' : '✗') : String(v))}</dd>`).join('')}
     </dl>`,
  });
  const where = card({
    title: 'Where to look',
    flush: true,
    body: c.places.length ? `<div class="table-wrap">${places}</div>` : places,
  });
  const state = card({
    title: 'Status',
    body: `<p class="case-plate">${plate(c.vehicle.plate, 'large')}</p>
       ${caseStages(c.status)}
       ${c.status === 'pending_identity' ? '<p class="hint">2earl staff are checking this vehicle’s identity (chassis number or plate). Agents don’t see it until then.</p>' : ''}
       ${facts([
         ['Fee', lira(c.fee_kurus)],
         ['Last confirmed', day(c.last_confirmed_at)],
         [
           open ? 'Expires' : 'Closed',
           open ? day(c.expires_at) : day(c.delivered_at ?? c.updated_at),
         ],
       ])}
       ${keep || more.ask ? `<div class="actions-stack">${keep}${more.ask}</div>` : ''}
       ${withdraw}`,
  });
  return layout(
    'Case',
    { ...nav, current: 'cases' },
    `${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
     ${pageHead({
       above: crumbs([`<a href="/o/${org.id}/cases">Cases</a>`, data(c.vehicle.plate)]),
       title: data(`${c.vehicle.make} ${c.vehicle.model}`),
       badge: status(c.status),
       meta: `${plate(c.vehicle.plate)} · <span translate="no">${esc(c.external_ref)}</span>`,
     })}
     ${split(`${vehicle}${more.main}${where}`, state, true)}`,
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

/**
 * City and district of a place. The city is one of the 81 provinces; the district is typed with
 * the province's districts offered (all districts until a city is chosen, since the page runs no
 * script). Core accepts any spelling and stores the official one.
 */
function placeInputs(provinces: Province[] | null, city: string, district: string): string {
  if (provinces === null) {
    return `<label>District<input name="district" value="${esc(district)}" maxlength="60"></label>
         <label>City<input name="city" value="${esc(city)}" maxlength="60"></label>`;
  }
  const chosen = provinces.find((p) => p.name === city);
  const offered = chosen
    ? chosen.districts
    : [...new Set(provinces.flatMap((p) => p.districts))].sort((a, b) => a.localeCompare(b, 'tr'));
  return `<label>City<select name="city" autocomplete="address-level1">
           <option value="">Choose a province</option>
           ${provinces.map((p) => `<option value="${esc(p.name)}"${p.name === city ? ' selected' : ''} translate="no">${esc(p.name)}</option>`).join('')}
         </select></label>
         <label>District<input name="district" value="${esc(district)}" maxlength="60" list="districts" autocomplete="address-level2"></label>
         <datalist id="districts">${offered.map((d) => `<option value="${esc(d)}">`).join('')}</datalist>`;
}

export function caseForm(
  nav: Nav,
  fields: { case: FieldDefinition[]; vehicle: FieldDefinition[]; place: FieldDefinition[] },
  values: CaseFormValues,
  error: string | null,
  locale: 'en' | 'tr',
  /** Core's provinces and districts; null before core offers them (then both are typed). */
  provinces: Province[] | null = null,
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
         ${input('year', 'Year', 'inputmode="numeric" maxlength="4"', 'optional')}
         ${input('colour', 'Colour', 'maxlength="40"', 'optional')}
         ${customVehicle}
       </div></fieldset>
       <fieldset><legend>Enforcement file</legend><div class="grid2">
         ${input('external_ref', 'Your reference', 'required maxlength="100"', 'unique in your organization')}
         ${input('icra_office', 'Enforcement office', 'required maxlength="120"', 'e.g. İstanbul 5. İcra Dairesi')}
         ${input('icra_file_no', 'File number', 'required maxlength="40"', 'format: 2026/12345')}
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
         ${placeInputs(provinces, values.city ?? '', values.district ?? '')}
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
    { ...nav, current: 'integrations' },
    `${integrationTabs(org.id, 'keys')}<h1>API keys</h1>
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
    { ...nav, current: 'integrations' },
    `${integrationTabs(org.id, 'webhooks')}<h1>Webhooks</h1>
     <p class="lede">We call your address when a vehicle reaches custody, a case expires, 2earl rejects a case it couldn’t identify, or an invoice is issued. Each call is signed: check the <code translate="no">Emanet-Signature</code> header with the secret.</p>
     ${error ? `<p class="error">${esc(error)}</p>` : ''}
     ${created ? `<div class="notice"><p>Copy the signing secret now. It won’t be shown again.</p><code class="secret" translate="no">${esc(created.secret)}</code></div>` : ''}
     ${rows}
     <h2>New webhook</h2>${form}
     <h2>Recent deliveries</h2>${log}`,
  );
}
