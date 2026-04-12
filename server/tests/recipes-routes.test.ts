import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import { createTestUser, makeTestDb } from './helpers.js';
import { signSession } from '../src/auth/jwt.js';
import { SESSION_COOKIE } from '../src/auth/cookie.js';

const recipeBody = {
  title: 'Pasta',
  time_minutes: 15,
  difficulty: 'easy',
  servings: 2,
  calories_total: 500,
  protein_grams_total: 18,
  image_url: null,
  source_url: null,
  recipe_notes: null,
  price_tier: 2,
  ingredients: [{ position: 0, quantity: '200', unit: 'g', name: 'spaghetti', note: null }],
  method_steps: [{ position: 0, text: 'Boil' }],
  utensils: [{ name: 'pot' }],
};

async function authedCookie(
  allowed = true,
): Promise<{ cookie: string; userId: number; pool: any }> {
  const { pool } = makeTestDb();
  const user = await createTestUser(pool, { isAllowed: allowed });
  const token = await signSession({ userId: user.id });
  return { cookie: `${SESSION_COOKIE}=${token}`, userId: user.id, pool };
}

describe('recipes routes', () => {
  it('POST /api/recipes saves and returns the recipe', async () => {
    const { cookie, pool } = await authedCookie();
    const app = createApp();
    const res = await app.request('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(recipeBody),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.recipe.title).toBe('Pasta');
    expect(body.recipe.ingredients).toHaveLength(1);
    await pool.end();
  });

  it('GET /api/recipes lists user recipes', async () => {
    const { cookie, pool } = await authedCookie();
    const app = createApp();
    await app.request('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(recipeBody),
    });
    const res = await app.request('/api/recipes', { headers: { cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.recipes).toHaveLength(1);
    await pool.end();
  });

  it('GET /api/recipes/:id returns 404 for other user', async () => {
    const { cookie: cookieA, pool } = await authedCookie();
    const { cookie: cookieB } = await authedCookie();
    const app = createApp();
    const created = await app.request('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: cookieA },
      body: JSON.stringify(recipeBody),
    });
    const { recipe } = (await created.json()) as any;
    const res = await app.request(`/api/recipes/${recipe.id}`, { headers: { cookie: cookieB } });
    expect(res.status).toBe(404);
    await pool.end();
  });

  it('PATCH /api/recipes/:id/favorite toggles favorite', async () => {
    const { cookie, pool } = await authedCookie();
    const app = createApp();
    const created = await app.request('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(recipeBody),
    });
    const { recipe } = (await created.json()) as any;
    const res = await app.request(`/api/recipes/${recipe.id}/favorite`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ favorite: true }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.recipe.favorite).toBe(true);
    await pool.end();
  });

  it('POST /api/recipes/:id/notes adds a note', async () => {
    const { cookie, pool } = await authedCookie();
    const app = createApp();
    const created = await app.request('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(recipeBody),
    });
    const { recipe } = (await created.json()) as any;
    const res = await app.request(`/api/recipes/${recipe.id}/notes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ text: 'Reduce salt' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.note.text).toBe('Reduce salt');
    await pool.end();
  });

  it('DELETE /api/recipes/:id removes the recipe', async () => {
    const { cookie, pool } = await authedCookie();
    const app = createApp();
    const created = await app.request('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(recipeBody),
    });
    const { recipe } = (await created.json()) as any;
    const del = await app.request(`/api/recipes/${recipe.id}`, {
      method: 'DELETE',
      headers: { cookie },
    });
    expect(del.status).toBe(200);
    const get = await app.request(`/api/recipes/${recipe.id}`, { headers: { cookie } });
    expect(get.status).toBe(404);
    await pool.end();
  });

  it('returns 403 when not allowlisted', async () => {
    const { cookie, pool } = await authedCookie(false);
    const app = createApp();
    const res = await app.request('/api/recipes', { headers: { cookie } });
    expect(res.status).toBe(403);
    await pool.end();
  });
});
