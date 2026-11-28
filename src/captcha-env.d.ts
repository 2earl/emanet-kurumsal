// Cloudflare Turnstile's keys for the invitation request form. Both are made by
// .github/workflows/deploy.yml (a widget for kurumsal.emanet.dev) and kept as Worker secrets. Until
// they exist the form is closed: src/captcha.ts fails closed.
interface Env {
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
}
declare namespace Cloudflare {
  interface Env {
    TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET?: string;
  }
}
