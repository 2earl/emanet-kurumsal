import { createApp } from './app';
import { enqueueEvents, sendDue } from './webhooks';

/** Emanet Kurumsal at kurumsal.emanet.dev (docs/DESIGN.md §5). */

const now = () => Math.floor(Date.now() / 1000);
const app = createApp(now);

export default {
  fetch: app.fetch,

  // Every minute: read new events from emanet-core, then send what is due.
  scheduled(_controller, env, ctx): void {
    ctx.waitUntil(
      (async () => {
        await enqueueEvents(env, now());
        await sendDue(env, now());
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
