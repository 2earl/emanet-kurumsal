/**
 * The 2earl dashboard layout (claude/2EARL_THEME.md, "Dashboard layout"): a page head with the
 * page's actions on the right, a row of stats, cards with a head and a toolbar, tabs with counts,
 * and a split of the work and what sits beside it. Every argument is HTML the caller has already
 * made safe; these only place it.
 */

/** A page's head: where it is, what it is, and what to do from here (primary action last). */
export function pageHead(o: {
  title: string;
  lede?: string;
  /** Shown above the title: the breadcrumb, or a short section name. */
  above?: string;
  /** Next to the title: a status pill. */
  badge?: string;
  /** A line of facts under the title. */
  meta?: string;
  actions?: string;
}): string {
  return `<header class="page-head">
    <div class="page-head-text">
      ${o.above ?? ''}
      <div class="page-title"><h1>${o.title}</h1>${o.badge ?? ''}</div>
      ${o.meta ? `<p class="page-meta">${o.meta}</p>` : ''}
      ${o.lede ? `<p class="lede">${o.lede}</p>` : ''}
    </div>
    ${o.actions ? `<div class="page-actions">${o.actions}</div>` : ''}
  </header>`;
}

export type Tone = 'good' | 'wait' | 'alert' | 'info' | 'quiet';

/** One number that matters, with what it is and, if useful, where to act on it. */
export function stat(o: {
  label: string;
  value: string;
  note?: string;
  tone?: Tone;
  href?: string;
  icon?: string;
}): string {
  const inner = `<span class="stat-label">${o.icon ?? ''}${o.label}</span>
    <strong class="stat-value" translate="no">${o.value}</strong>
    ${o.note ? `<span class="stat-note">${o.note}</span>` : ''}`;
  const cls = `stat${o.tone ? ` tone-${o.tone}` : ''}`;
  return o.href
    ? `<a class="${cls}" href="${o.href}">${inner}</a>`
    : `<div class="${cls}">${inner}</div>`;
}

export const stats = (items: string[]): string =>
  `<div class="stats" style="--stats:${String(Math.min(items.length, 5))}">${items.join('')}</div>`;

/** Views of one list, as tabs; the current one is marked, each may carry a count. */
export function tabs(
  label: string,
  items: { href: string; label: string; count?: number; current: boolean }[],
): string {
  return `<nav class="tabs" aria-label="${label}"><ul>${items
    .map(
      (t) =>
        `<li><a href="${t.href}"${t.current ? ' aria-current="page"' : ''}>${t.label}${
          t.count === undefined
            ? ''
            : ` <span class="count" translate="no">${String(t.count)}</span>`
        }</a></li>`,
    )
    .join('')}</ul></nav>`;
}

/** A card: a head with a title and its tools, the body, and a foot. `flush` lets a table reach the edges. */
export function card(o: {
  title?: string;
  /** Next to the title, e.g. how many rows. */
  count?: string;
  tools?: string;
  body: string;
  foot?: string;
  flush?: boolean;
  id?: string;
}): string {
  const head =
    o.title || o.tools
      ? `<div class="card-head">${o.title ? `<h2>${o.title}${o.count ? ` <span class="count" translate="no">${o.count}</span>` : ''}</h2>` : ''}${o.tools ? `<div class="card-tools">${o.tools}</div>` : ''}</div>`
      : '';
  return `<section class="card${o.flush ? ' flush' : ''}"${o.id ? ` id="${o.id}"` : ''}>${head}<div class="card-body">${o.body}</div>${o.foot ? `<div class="card-foot">${o.foot}</div>` : ''}</section>`;
}

/**
 * The work on the left, what sits beside it on the right; one column on a phone, where
 * `asideFirst` puts the aside on top (a record's status and its actions before its details).
 */
export const split = (main: string, aside: string, asideFirst = false): string =>
  `<div class="split${asideFirst ? ' aside-first' : ''}"><div class="split-main">${main}</div><aside class="split-aside">${aside}</aside></div>`;

/** Facts as label and value, for an aside. */
export const facts = (rows: [string, string][]): string =>
  `<dl class="facts-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

/**
 * Every table in its own scrolling wrapper, so a wide one scrolls sideways on a phone instead of
 * pushing the page wider. Tables already wrapped are left as they are.
 */
export const wrapTables = (html: string): string =>
  html.replace(
    /(<div class="table-wrap">\s*)?<table\b[^]*?<\/table>/g,
    (match: string, wrapped?: string) =>
      wrapped ? match : `<div class="table-wrap">${match}</div>`,
  );
