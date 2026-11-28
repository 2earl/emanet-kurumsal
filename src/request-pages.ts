import { REQUEST_KINDS, REQUEST_VOLUMES, type OwnInvitationRequest } from './core';
import { REQUEST_ACTION, TURNSTILE_ORIGIN } from './captcha';
import { card, facts, pageHead, split } from './dash';
import { icon } from './icons';
import { data, day, esc, layout } from './pages';

/**
 * Someone signed in without an organization on Emanet (docs/DESIGN.md §21 in emanet-core). Only
 * 2earl invites companies; here they can ask for an invitation and see where their request is.
 */

export const KIND_LABEL: Record<(typeof REQUEST_KINDS)[number], string> = {
  bank: 'Bank',
  vys: 'Asset management company (VYŞ)',
  law_firm: 'Law firm',
  leasing: 'Leasing company',
  other: 'Other',
};

export const VOLUME_LABEL: Record<(typeof REQUEST_VOLUMES)[number], string> = {
  small: 'Up to 100 vehicles a year',
  medium: '100 to 1,000 vehicles a year',
  large: 'More than 1,000 vehicles a year',
};

export const REQUEST_ERROR: Record<string, string> = {
  missing_company: 'Write your organization’s name.',
  invalid_kind: 'Choose what kind of organization it is.',
  missing_contact: 'Write your full name.',
  invalid_email: 'Write a valid email address.',
  not_your_address:
    'Use an email address on your 2earl account: the invitation will be sent to it. You can add one in your 2earl account settings.',
  invalid_phone: 'Write the phone number with digits only, for example +90 212 555 00 00.',
  invalid_volume: 'Choose how many vehicles, or leave it empty.',
  already_requested: 'You have already sent a request. 2earl’s team will answer it by email.',
  too_many_requests: 'You have sent three requests in the last 30 days. Try again later.',
  captcha_missing: 'Complete the check above the button, then send again.',
  captcha_failed: 'The check didn’t pass. Do it again, then send.',
  captcha_unavailable:
    'Requests can’t be checked right now, so they can’t be sent. Try again later, or write to iletisim@emanet.dev.',
};

const NEXT = `<ol>
  <li>2earl’s team reads your request and answers by email.</li>
  <li>If Emanet fits, you get an invitation to set up your organization: company details, documents and the agreement.</li>
  <li>Your organization can add vehicles once 2earl approves it.</li>
</ol>`;

const PRIVACY =
  '<p class="hint">2earl uses what you write here only to answer your request. It is deleted a year after the team answers, or when you delete your 2earl account. The check against automated requests is Cloudflare Turnstile.</p>';

function status(r: OwnInvitationRequest): string {
  if (r.status === 'new') {
    return card({
      title: 'We have your request',
      body: `${facts([
        ['Organization', data(r.company)],
        ['Kind', KIND_LABEL[r.kind]],
        ['Answer goes to', data(r.contact_email)],
        ['Sent', day(r.created_at)],
      ])}
      <p>2earl’s team will answer by email. You don’t need to do anything until then.</p>`,
    });
  }
  if (r.status === 'invited') {
    return card({
      title: 'Your invitation is on its way',
      body: `<p>2earl sent an invitation to ${data(r.contact_email)}. Open the link in that email while signed in to this account to set up your organization.</p>
        <p class="hint">No email? Look in the spam folder, or write to <a href="mailto:iletisim@emanet.dev">iletisim@emanet.dev</a>.</p>`,
    });
  }
  return card({
    title: 'Ask 2earl for an invitation',
    body: `<p>2earl couldn’t go ahead with your request for ${data(r.company)} for now. If something has changed, you can ask again.</p>
      <p><a class="button" href="/request">${icon('mail')}<span>Ask again</span></a></p>`,
  });
}

/** Signed in, no organization on Emanet, nothing being set up. */
export function noOrganization(
  request: OwnInvitationRequest | null,
  notice: string | null,
): string {
  const main = request
    ? status(request)
    : card({
        title: 'Ask 2earl for an invitation',
        body: `<p>Emanet is for organizations that hold seizure orders on vehicles: banks, wealth management companies, law firms and leasing companies. Tell 2earl about yours and the team will answer by email.</p>
              <p><a class="button" href="/request">${icon('mail')}<span>Ask for an invitation</span></a></p>`,
      });
  const aside = card({
    title: 'Already on Emanet?',
    body: `<p>If your organization already uses Emanet, ask its administrator to add you to it in your 2earl organization. Then sign in again.</p>`,
  });
  return layout(
    'No organization yet',
    { signedIn: true },
    `${pageHead({
      title: 'No organization yet',
      lede: 'Your account isn’t part of an organization that uses Emanet.',
    })}
    ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
    ${split(main, aside)}`,
  );
}

/** The request form. `values` are what was sent, kept when the core said no. */
export function requestForm(
  values: Record<string, string>,
  errorText: string | null,
  captcha: { siteKey: string; locale: string } | null,
): string {
  const option = (name: string, key: string, label: string) =>
    `<option value="${esc(key)}"${values[name] === key ? ' selected' : ''}>${label}</option>`;
  const kinds = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[])
    .map((k) => option('kind', k, KIND_LABEL[k]))
    .join('');
  const volumes = (Object.keys(VOLUME_LABEL) as (keyof typeof VOLUME_LABEL)[])
    .map((k) => option('volume', k, VOLUME_LABEL[k]))
    .join('');
  const v = (k: string) => esc(values[k] ?? '');
  const form = card({
    body: `${errorText ? `<p class="error" role="alert">${esc(errorText)}</p>` : ''}
    <form method="post" action="/request" class="stack">
      <label>Organization name <input name="company" required minlength="2" maxlength="200" autocomplete="organization" value="${v('company')}"></label>
      <label>What kind of organization? <select name="kind" required><option value="">Choose…</option>${kinds}</select></label>
      <label>Your full name <input name="contactName" required minlength="3" maxlength="120" autocomplete="name" value="${v('contactName')}"></label>
      <label>Your work email <input type="email" name="contactEmail" required maxlength="254" autocomplete="email" value="${v('contactEmail')}">
        <span class="hint">An address on your 2earl account: the invitation will be sent to it.</span></label>
      <label>Phone (optional) <input type="tel" name="phone" maxlength="30" autocomplete="tel" value="${v('phone')}"></label>
      <label>Job title (optional) <input name="jobTitle" maxlength="120" autocomplete="organization-title" value="${v('jobTitle')}"></label>
      <label>How many vehicles a year, roughly? (optional) <select name="volume"><option value="">Not sure</option>${volumes}</select></label>
      <label>Anything 2earl should know (optional) <textarea name="message" maxlength="2000" rows="4">${v('message')}</textarea></label>
      <div class="cf-turnstile" data-sitekey="${esc(captcha?.siteKey ?? '')}" data-action="${REQUEST_ACTION}" data-language="${esc(captcha?.locale ?? 'tr')}" data-theme="light" data-size="flexible"></div>
      <noscript><p class="hint">This form needs JavaScript for a short check against automated requests. Turn it on, or write to iletisim@emanet.dev.</p></noscript>
      <button type="submit">${icon('mail')}<span>Send request</span></button>
    </form>
    <script src="${TURNSTILE_ORIGIN}/turnstile/v0/api.js" async defer></script>`,
  });
  const closed = card({
    title: 'Requests are closed for a moment',
    body: '<p>The form can’t check requests right now, so it is closed. Try again later, or write to <a href="mailto:iletisim@emanet.dev">iletisim@emanet.dev</a>.</p>',
  });
  const aside = card({ title: 'What happens next', body: `${NEXT}${PRIVACY}` });
  return layout(
    'Ask for an invitation',
    { signedIn: true },
    `${pageHead({
      title: 'Ask for an invitation',
      above: '<a href="/">Back</a>',
      lede: 'Only organizations 2earl has set up can use Emanet. Tell us about yours.',
    })}
    ${split(captcha ? form : closed, aside)}`,
  );
}
