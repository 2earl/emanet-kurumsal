import { createApp } from './app';
import { enqueueEvents, purgeDeliveries, sendDue } from './webhooks';

/** Emanet Kurumsal at kurumsal.emanet.dev (docs/DESIGN.md §5). */

const now = () => Math.floor(Date.now() / 1000);
const app = createApp(now);

export default {
  fetch: app.fetch,

  // Every minute: read new events from emanet-core, then send what is due.
  scheduled(_controller, env, ctx): void {
    // Each step on its own: a failure reading new events doesn't hold back what is already queued.
    // Only the step's name and the error's name are logged, never data.
    const steps: [string, () => Promise<unknown>][] = [
      ['enqueue', () => enqueueEvents(env, now())],
      ['send', () => sendDue(env, now())],
      ['purge', () => purgeDeliveries(env, now())],
    ];
    ctx.waitUntil(
      (async () => {
        for (const [name, step] of steps) {
          try {
            await step();
          } catch (error) {
            console.error(`cron ${name} failed`, error instanceof Error ? error.name : 'error');
          }
        }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
