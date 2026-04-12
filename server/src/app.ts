import { Hono } from 'hono';
import { ApiError, errorResponse } from './errors.js';
import { logger } from './logger.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';

export type AppEnv = { Variables: { userId?: number; isAllowed?: boolean | null } };

export function createApp() {
  const app = new Hono<AppEnv>();

  app.get('/api/health', (c) => c.json({ ok: true }));
  app.route('/api/auth', authRoutes);
  app.route('/api/me', meRoutes);

  app.notFound((c) => c.json(errorResponse('not_found', 'Route not found'), 404));

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json(errorResponse(err.code, err.message), err.status as 400 | 401 | 403 | 404 | 422 | 500);
    }
    logger.error({ err }, 'unhandled error');
    return c.json(errorResponse('internal', 'Internal server error'), 500);
  });

  return app;
}
