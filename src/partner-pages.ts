import type {
  Ticket,
  TicketThread,
  CaseDocument,
  CaseDocumentKind,
  InvoiceLine,
  PartnerInvoice,
  Report,
  TimelineEvent,
} from './core';
import { fileSize } from './attachments';
import { card, pageHead, stat, stats } from './dash';
import { icon } from './icons';
import { crumbs, data, day, esc, layout, lira, moment, plate, type Nav } from './pages';

/**
 * A partner's view of what happened (docs/DESIGN.md §5): a case's timeline and custody
 * documents, invoices, and the monthly report. No agent is ever named.
 */

const EVENT_LABEL: Record<TimelineEvent, string> = {
  created: 'Added',
  updated: 'Changed',
  identity_accepted: 'Vehicle checked by 2earl',
  identity_rejected: 'Not accepted by 2earl',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  delivered: 'In custody',
};

export const DOCUMENT_LABEL: Record<CaseDocumentKind, string> = {
  yediemin_receipt: 'Custodian’s receipt',
  tow_report: 'Tow report',
  police_report: 'Police report',
  yediemin_vehicle: 'Vehicle at the custodian',
  scene: 'Where it was found',
};

/** The timeline and, once delivered, the documents: shown on a case's page. */
export function caseExtras(
  orgId: string,
  caseId: string,
  events: { event: TimelineEvent; at: number }[],
  documents: CaseDocument[],
  canAsk: boolean,
  /** The company's own reference: what a question about this case is titled with. */
  ref = caseId,
): { main: string; ask: string } {
  const timeline = events.length
    ? card({
        title: 'What happened',
        body: `<ol class="timeline">${events
          .map((e) => `<li>${moment(e.at)} <span>${EVENT_LABEL[e.event]}</span></li>`)
          .join('')}</ol>`,
      })
    : '';
  const docs = documents.length
    ? `<section class="card flush"><div class="card-head"><h2>Custody documents</h2></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Document</th><th>Taken</th><th>SHA-256</th></tr></thead><tbody>${documents
        .map(
          (d) =>
            `<tr><td><a href="/o/${esc(orgId)}/cases/${esc(caseId)}/documents/${esc(d.id)}">${DOCUMENT_LABEL[d.kind]}</a></td><td>${d.taken_at === null ? '—' : moment(d.taken_at)}</td><td><code translate="no">${esc(d.sha256.slice(0, 16))}…</code></td></tr>`,
        )
        .join('')}</tbody></table></div></div>
       <div class="card-foot"><span>Accepted by 2earl when it confirmed the delivery. Each file’s SHA-256 lets you check that it hasn’t changed since.</span></div></section>`
    : '';
  const ask = !canAsk
    ? ''
    : `<a class="button secondary noprint" href="/o/${esc(orgId)}/support/new?category=case&amp;about=${encodeURIComponent(ref)}">${icon('mail')}<span>Ask 2earl about this case</span></a>`;
  return { main: timeline + docs, ask };
}

const INVOICE_STATUS: Record<PartnerInvoice['status'], string> = {
  issued: 'To pay',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export function invoiceList(nav: Nav, invoices: PartnerInvoice[]): string {
  const org = nav.org;
  if (!org) throw new Error('invoiceList needs an organization');
  const open = invoices.filter((i) => i.status === 'issued');
  const due = open.reduce((sum, i) => sum + i.total_kurus - i.paid_kurus, 0);
  return layout(
    'Invoices',
    { ...nav, current: 'invoices' },
    `${pageHead({
      title: 'Invoices',
      lede: 'One invoice per period for the vehicles that reached custody, due within 15 days. The e-invoice itself comes through the e-Fatura system.',
      ...(invoices.length
        ? {
            actions: `<a class="button secondary" href="/o/${esc(org.id)}/invoices.csv">${icon('download')}<span>Download all invoices (CSV)</span></a>`,
          }
        : {}),
    })}
     ${
       invoices.length
         ? `${stats([
             stat({
               label: 'To pay',
               value: lira(due),
               tone: open.length ? 'wait' : 'quiet',
               note: `${String(open.length)} open`,
             }),
             stat({
               label: 'Paid',
               value: lira(
                 invoices
                   .filter((i) => i.status === 'paid')
                   .reduce((sum, i) => sum + i.total_kurus, 0),
               ),
               tone: 'quiet',
             }),
             stat({
               label: 'Vehicles invoiced',
               value: String(invoices.reduce((sum, i) => sum + i.cases, 0)),
               tone: 'quiet',
             }),
           ])}
           ${card({
             title: 'All invoices',
             flush: true,
             body: `<div class="table-wrap"><table><thead><tr><th>Issued</th><th>Number</th><th class="num">Vehicles</th><th class="num">Net</th><th class="num">VAT</th><th class="num">Total</th><th>Status</th></tr></thead><tbody>${invoices
               .map(
                 (i) =>
                   `<tr><td><a href="/o/${esc(org.id)}/invoices/${esc(i.id)}">${day(i.issued_at)}</a></td><td>${i.number ? data(i.number) : '—'}</td><td class="num" translate="no">${String(i.cases)}</td><td class="num">${lira(i.net_kurus)}</td><td class="num">${lira(i.kdv_kurus)}</td><td class="num">${lira(i.total_kurus)}</td><td>${INVOICE_STATUS[i.status]}</td></tr>`,
               )
               .join('')}</tbody></table></div>`,
           })}`
         : '<p class="panel">No invoices yet. You pay only for vehicles that reach custody.</p>'
     }`,
  );
}

export function invoiceDetail(
  nav: Nav,
  invoice: PartnerInvoice & { lines: InvoiceLine[] },
): string {
  const org = nav.org;
  if (!org) throw new Error('invoiceDetail needs an organization');
  return layout(
    'Invoice',
    { ...nav, current: 'invoices' },
    `${crumbs([`<a href="/o/${esc(org.id)}/invoices">Invoices</a>`, invoice.number ? data(invoice.number) : day(invoice.issued_at)])}
     <h1>Invoice of ${day(invoice.issued_at)}</h1>
     <div class="panel"><dl class="facts">
       <dt>Number</dt><dd>${invoice.number ? data(invoice.number) : 'Not issued by e-Fatura yet'}</dd>
       <dt>Net</dt><dd>${lira(invoice.net_kurus)}</dd>
       <dt>VAT</dt><dd>${lira(invoice.kdv_kurus)}</dd>
       <dt>Total</dt><dd>${lira(invoice.total_kurus)}</dd>
       <dt>Paid</dt><dd>${lira(invoice.paid_kurus)}</dd>
       <dt>Status</dt><dd>${INVOICE_STATUS[invoice.status]}</dd>
     </dl></div>
     <p class="hint">This page lists what is invoiced. The official invoice is the e-invoice (e-Fatura) sent to your accounting. If it has not reached you, ask us.</p>
     <p class="noprint"><a class="button secondary" href="/o/${esc(org.id)}/invoices/${esc(invoice.id)}/lines.csv">${icon('download')} Download the vehicles (CSV)</a>
       ${org.role === 'auditor' ? '' : `<a href="/o/${esc(org.id)}/support/new?category=invoice&amp;about=${encodeURIComponent(invoice.number ?? invoice.id)}">Ask about this invoice</a>`}</p>
     <p class="hint noprint">To keep a copy, use your browser’s Print and choose Save as PDF.</p>
     <h2>Vehicles</h2>
     <table><thead><tr><th>Plate</th><th>Your reference</th><th>In custody</th><th class="num">Net</th><th class="num">VAT</th></tr></thead><tbody>${invoice.lines
       .map(
         (l) =>
           `<tr><td><a href="/o/${esc(org.id)}/cases/${esc(l.case_id)}">${l.plate ? plate(l.plate) : '—'}</a></td><td>${data(l.external_ref)}</td><td>${day(l.delivered_at)}</td><td class="num">${lira(l.net_kurus)}</td><td class="num">${lira(l.kdv_kurus)}</td></tr>`,
       )
       .join('')}</tbody></table>`,
  );
}

export function reportPage(nav: Nav, r: Report): string {
  const org = nav.org;
  if (!org) throw new Error('reportPage needs an organization');
  const rate =
    r.recovery_rate === null
      ? '—'
      : `<span translate="no">${(r.recovery_rate * 100).toFixed(1).replace(/\.0$/, '')} %</span>`;
  return layout(
    'Reports',
    { ...nav, current: 'reports' },
    `<h1>Reports</h1>
     <div class="counts">
       <div><strong translate="no">${String(r.open)}</strong><span>Open cases</span></div>
       <div><strong translate="no">${String(r.delivered_total)}</strong><span>In custody, last 12 months</span></div>
       <div><strong>${rate}</strong><span>Recovery rate</span></div>
     </div>
     <p class="hint">Recovery rate: vehicles in custody out of all cases closed in the last 12 months (in custody, withdrawn or expired).</p>
     <h2>By month</h2>
     ${
       r.months.length
         ? `<table><thead><tr><th>Month</th><th class="num">Added</th><th class="num">In custody</th><th class="num">Withdrawn</th><th class="num">Expired</th><th class="num">Fees</th><th class="num">Days to custody</th></tr></thead><tbody>${r.months
             .map(
               (m) =>
                 `<tr><td translate="no">${esc(m.month)}</td><td class="num" translate="no">${String(m.added)}</td><td class="num" translate="no">${String(m.delivered)}</td><td class="num" translate="no">${String(m.withdrawn)}</td><td class="num" translate="no">${String(m.expired)}</td><td class="num">${lira(m.fees_kurus)}</td><td class="num" translate="no">${m.days_to_custody === null ? '—' : String(m.days_to_custody)}</td></tr>`,
             )
             .join('')}</tbody></table>
           <p><a class="button secondary" href="/o/${esc(org.id)}/reports.csv">Download CSV</a></p>`
         : '<p class="panel">Nothing in the last 12 months yet.</p>'
     }
     <h2>By city</h2>
     ${
       r.by_city.length
         ? `<table><thead><tr><th>City</th><th class="num">Open</th><th class="num">In custody</th></tr></thead><tbody>${r.by_city
             .map(
               (c) =>
                 `<tr><td>${data(c.city)}</td><td class="num" translate="no">${String(c.open)}</td><td class="num" translate="no">${String(c.delivered)}</td></tr>`,
             )
             .join('')}</tbody></table>`
         : '<p class="panel">No places given yet.</p>'
     }`,
  );
}

/** The monthly report as CSV, with cells that can't be read as spreadsheet formulas. */
export function reportCsv(r: Report): string {
  const cell = (v: string | number | null) => {
    const s = v === null ? '' : String(v);
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const rows = [
    ['month', 'added', 'delivered', 'withdrawn', 'expired', 'fees_try', 'days_to_custody'],
    ...r.months.map((m) => [
      m.month,
      m.added,
      m.delivered,
      m.withdrawn,
      m.expired,
      (m.fees_kurus / 100).toFixed(2),
      m.days_to_custody,
    ]),
  ];
  return `${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;
}

/** Quoted for a spreadsheet: a cell that starts like a formula is made harmless. */
const csvCell = (v: string | number | null) => {
  const text = v === null ? '' : String(v);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const csvDay = (unix: number | null) =>
  unix === null ? '' : new Date((unix + 3 * 3600) * 1000).toISOString().slice(0, 10);
const csvLira = (kurus: number) => (kurus / 100).toFixed(2);
const csvRows = (rows: (string | number | null)[][]) =>
  `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;

export function invoicesCsv(invoices: PartnerInvoice[]): string {
  return csvRows([
    ['number', 'issued', 'vehicles', 'net_try', 'vat_try', 'total_try', 'paid_try', 'status'],
    ...invoices.map((i) => [
      i.number,
      csvDay(i.issued_at),
      i.cases,
      csvLira(i.net_kurus),
      csvLira(i.kdv_kurus),
      csvLira(i.total_kurus),
      csvLira(i.paid_kurus),
      i.status,
    ]),
  ]);
}

export function invoiceLinesCsv(invoice: PartnerInvoice & { lines: InvoiceLine[] }): string {
  return csvRows([
    ['invoice', 'plate', 'your_reference', 'in_custody', 'net_try', 'vat_try'],
    ...invoice.lines.map((l) => [
      invoice.number ?? invoice.id,
      l.plate,
      l.external_ref,
      csvDay(l.delivered_at),
      csvLira(l.net_kurus),
      csvLira(l.kdv_kurus),
    ]),
  ]);
}

// ---- Support ---------------------------------------------------------------------------------

const CATEGORY_LABEL: Record<string, string> = {
  case: 'A case or a vehicle',
  invoice: 'An invoice',
  integration: 'The API or webhooks',
  account: 'Our account or team',
  other: 'Something else',
};
const TICKET_LABEL: Record<Ticket['status'], string> = {
  open: 'Waiting for 2earl',
  answered: '2earl answered',
  closed: 'Solved',
};

/** The file picker of a support form: what may be attached, said before choosing. */
const filesField = () =>
  `<label>Photos or PDF files (optional) <input type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf">
     <span class="hint">Up to three files, 10 MB each: a screenshot, a document, an export. Never a password or an API key.</span></label>`;

/** The files of one message: pictures as thumbnails, PDFs as links with their size. */
function messageFiles(
  orgId: string,
  ticketId: string,
  files: TicketThread['messages'][number]['attachments'],
): string {
  if (!files?.length) return '';
  return `<ul class="files">${files
    .map((f) => {
      const href = `/o/${esc(orgId)}/support/${esc(ticketId)}/files/${esc(f.id)}`;
      return f.content_type.startsWith('image/')
        ? `<li><a href="${href}" target="_blank" rel="noopener"><img src="${href}" alt="${esc(f.name)}" loading="lazy"></a></li>`
        : `<li><a class="file" href="${href}">${icon('file')}<span translate="no">${esc(f.name)}</span> <span class="hint" translate="no">${esc(fileSize(f.size))}</span></a></li>`;
    })
    .join('')}</ul>`;
}

export function supportList(
  nav: Nav,
  list: Ticket[],
  canWrite: boolean,
  saved: string | null,
): string {
  const org = nav.org;
  if (!org) throw new Error('supportList needs an organization');
  return layout(
    'Support',
    { ...nav, current: 'support' },
    `${saved ? `<p class="notice">${esc(saved)}</p>` : ''}${pageHead({
      title: 'Support',
      lede: 'Ask 2earl about a case, an invoice or the integration. We answer here and email whoever asked.',
      ...(canWrite
        ? {
            actions: `<a class="button" href="/o/${esc(org.id)}/support/new">${icon('plus')}<span>New message</span></a>`,
          }
        : {}),
    })}
     ${
       list.length
         ? `<table><thead><tr><th>Subject</th><th>About</th><th>Status</th><th>Updated</th></tr></thead><tbody>${list
             .map(
               (t) =>
                 `<tr><td><a href="/o/${esc(org.id)}/support/${esc(t.id)}">${data(t.subject)}</a></td><td>${CATEGORY_LABEL[t.category] ?? data(t.category)}</td><td>${TICKET_LABEL[t.status]}</td><td>${moment(t.updated_at)}</td></tr>`,
             )
             .join('')}</tbody></table>`
         : '<p class="panel">No messages yet.</p>'
     }
     <p class="hint">Never write a password or an API key in a message.</p>`,
  );
}

/**
 * How soon companies' questions were answered lately (core's three-in-four time, last 30 days),
 * rounded up. Nothing when core has too few answers to say.
 */
export function answerTimeLine(p75: number | null, days: number): string {
  if (p75 === null) return '';
  const hours = Math.max(1, Math.ceil(p75 / 3600));
  const text =
    hours === 1
      ? `In the last ${String(days)} days, 3 in 4 questions got a first answer within an hour.`
      : hours < 48
        ? `In the last ${String(days)} days, 3 in 4 questions got a first answer within ${String(hours)} hours.`
        : `In the last ${String(days)} days, 3 in 4 questions got a first answer within ${String(Math.ceil(hours / 24))} days.`;
  return `<p class="hint">${esc(text)}</p>`;
}

export function supportNew(
  nav: Nav,
  values: Record<string, string>,
  errorText: string | null,
  answerTime = '',
): string {
  const org = nav.org;
  if (!org) throw new Error('supportNew needs an organization');
  const options = Object.entries(CATEGORY_LABEL)
    .map(
      ([k, label]) =>
        `<option value="${esc(k)}"${values.category === k ? ' selected' : ''}>${label}</option>`,
    )
    .join('');
  return layout(
    'New message',
    { ...nav, current: 'support' },
    `${crumbs([`<a href="/o/${esc(org.id)}/support">Support</a>`, 'New message'])}
     <h1>New message</h1>
     ${answerTime}
     ${errorText ? `<p class="error">${esc(errorText)}</p>` : ''}
     <form method="post" action="/o/${esc(org.id)}/support/new" class="stack" enctype="multipart/form-data">
       <label>What is it about? <select name="category">${options}</select></label>
       <label>Subject <input name="subject" required minlength="3" maxlength="120" value="${esc(values.subject ?? '')}"></label>
       <label>Message <textarea name="message" required minlength="3" maxlength="4000" rows="6">${esc(values.message ?? '')}</textarea></label>
       ${filesField()}
       <button type="submit">Send</button>
     </form>`,
  );
}

/** Once 2earl has answered: did it help? One click, and it can be changed. */
function rateForm(orgId: string, t: TicketThread): string {
  if (!t.messages.some((m) => m.author_kind === 'staff') || t.ticket.rating === undefined)
    return '';
  const rating = t.ticket.rating;
  const said =
    rating === 'helped'
      ? 'You said it helped.'
      : rating === 'not_helped'
        ? 'You said it didn’t help. Write below what is still missing.'
        : '';
  return `<form method="post" action="/o/${esc(orgId)}/support/${esc(t.ticket.id)}/rate" class="rate">
      <p><strong>Did our answer help?</strong>${said ? ` <span class="hint">${said}</span>` : ''}</p>
      <div class="actions">
        <button class="secondary" type="submit" name="helped" value="1"${rating === 'helped' ? ' aria-pressed="true"' : ''}>${icon('check')}<span>Yes, it helped</span></button>
        <button class="secondary" type="submit" name="helped" value="0"${rating === 'not_helped' ? ' aria-pressed="true"' : ''}><span>No</span></button>
      </div>
    </form>`;
}

export function supportThread(
  nav: Nav,
  t: TicketThread,
  canWrite: boolean,
  errorText: string | null,
  saved: string | null,
): string {
  const org = nav.org;
  if (!org) throw new Error('supportThread needs an organization');
  const closed = t.ticket.status === 'closed';
  return layout(
    t.ticket.subject,
    { ...nav, current: 'support' },
    `${crumbs([`<a href="/o/${esc(org.id)}/support">Support</a>`, data(t.ticket.subject)])}${saved ? `<p class="notice">${esc(saved)}</p>` : ''}
     <h1>${data(t.ticket.subject)}</h1>
     <p class="hint">${CATEGORY_LABEL[t.ticket.category] ?? data(t.ticket.category)} · ${TICKET_LABEL[t.ticket.status]}</p>
     <ul class="cards">${t.messages
       .map(
         (m) =>
           `<li class="card${m.author_kind === 'staff' ? ' staff' : ''}"><p class="hint">${m.author_kind === 'staff' ? '2earl' : 'Your team'} · ${moment(m.created_at)}</p><p style="white-space:pre-wrap">${data(m.body)}</p>${messageFiles(org.id, t.ticket.id, m.attachments)}</li>`,
       )
       .join('')}</ul>
     ${canWrite ? rateForm(org.id, t) : ''}
     ${errorText ? `<p class="error">${esc(errorText)}</p>` : ''}
     ${
       canWrite
         ? `<form method="post" action="/o/${esc(org.id)}/support/${esc(t.ticket.id)}/reply" class="stack" enctype="multipart/form-data">
       <label>${closed ? 'Write again to reopen this' : 'Your reply'} <textarea name="message" required minlength="2" maxlength="4000" rows="4"></textarea></label>
       ${filesField()}
       <button type="submit">Send</button>
     </form>
     ${closed ? '' : `<form method="post" action="/o/${esc(org.id)}/support/${esc(t.ticket.id)}/close"><button class="link" type="submit">Close this message, it is solved</button></form>`}`
         : ''
     }`,
  );
}
