import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './logger.js';

const app = createApp();
const port = env().PORT;
serve({ fetch: app.fetch, port }, (info) => {
  logger.info({ port: info.port }, 'recispy server listening');
});
