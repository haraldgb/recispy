import { Hono } from 'hono';
import { z } from 'zod';
import { sessionMiddleware, allowlistMiddleware } from '../auth/middleware.js';
import { ApiError } from '../errors.js';
import {
  createRecipe,
  getRecipe,
  listRecipes,
  deleteRecipe,
  setFavorite,
  addUserNote,
} from '../recipes/repo.js';
import { recipePayloadSchema, userNoteSchema } from '../recipes/types.js';
import { extractRecipe } from '../extraction/extract.js';

type Env = { Variables: { userId?: number; isAllowed?: boolean | null } };

export const recipesRoutes = new Hono<Env>();

recipesRoutes.use('*', sessionMiddleware, allowlistMiddleware);

recipesRoutes.post('/extract', async (c) => {
  let body: { url?: string; text?: string };
  try {
    body = await c.req.json();
  } catch {
    throw new ApiError(400, 'invalid_input', 'JSON body required');
  }
  if (!body || (!body.url && !body.text)) {
    throw new ApiError(400, 'invalid_input', 'url or text required');
  }
  const recipe = await extractRecipe({ url: body.url, text: body.text });
  return c.json({ recipe });
});

recipesRoutes.get('/', async (c) => {
  const userId = c.get('userId') as number;
  const recipes = await listRecipes(userId);
  return c.json({ recipes });
});

recipesRoutes.get('/:id', async (c) => {
  const userId = c.get('userId') as number;
  const id = Number.parseInt(c.req.param('id'), 10);
  if (!Number.isFinite(id)) throw new ApiError(400, 'invalid_input', 'Invalid id');
  const recipe = await getRecipe(userId, id);
  if (!recipe) throw new ApiError(404, 'not_found', 'Recipe not found');
  return c.json({ recipe });
});

recipesRoutes.post('/', async (c) => {
  const userId = c.get('userId') as number;
  let payload;
  try {
    payload = recipePayloadSchema.parse(await c.req.json());
  } catch (e) {
    throw new ApiError(400, 'invalid_input', (e as Error).message);
  }
  const created = await createRecipe(userId, payload);
  const recipe = await getRecipe(userId, created.id);
  return c.json({ recipe });
});

recipesRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId') as number;
  const id = Number.parseInt(c.req.param('id'), 10);
  if (!Number.isFinite(id)) throw new ApiError(400, 'invalid_input', 'Invalid id');
  const ok = await deleteRecipe(userId, id);
  if (!ok) throw new ApiError(404, 'not_found', 'Recipe not found');
  return c.json({});
});

const favoriteSchema = z.object({ favorite: z.boolean() });

recipesRoutes.patch('/:id/favorite', async (c) => {
  const userId = c.get('userId') as number;
  const id = Number.parseInt(c.req.param('id'), 10);
  if (!Number.isFinite(id)) throw new ApiError(400, 'invalid_input', 'Invalid id');
  let body;
  try {
    body = favoriteSchema.parse(await c.req.json());
  } catch {
    throw new ApiError(400, 'invalid_input', 'favorite (boolean) required');
  }
  const ok = await setFavorite(userId, id, body.favorite);
  if (!ok) throw new ApiError(404, 'not_found', 'Recipe not found');
  const recipe = await getRecipe(userId, id);
  return c.json({ recipe });
});

recipesRoutes.post('/:id/notes', async (c) => {
  const userId = c.get('userId') as number;
  const id = Number.parseInt(c.req.param('id'), 10);
  if (!Number.isFinite(id)) throw new ApiError(400, 'invalid_input', 'Invalid id');
  let body;
  try {
    body = userNoteSchema.parse(await c.req.json());
  } catch {
    throw new ApiError(400, 'invalid_input', 'text required');
  }
  const note = await addUserNote(userId, id, body.text);
  if (!note) throw new ApiError(404, 'not_found', 'Recipe not found');
  return c.json({ note });
});
