import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { createTestUser, makeTestDb } from './helpers.js';
import { signSession } from '../src/auth/jwt.js';
import { SESSION_COOKIE } from '../src/auth/cookie.js';

const validToolInput = {
  title: 'Test Pasta',
  time_minutes: 15,
  difficulty: 'easy',
  servings: 2,
  calories_total: 500,
  protein_grams_total: 18,
  image_url: null,
  recipe_notes: null,
  price_tier: 2,
  ingredients: [
    { position: 0, quantity: '200', unit: 'g', name: 'spaghetti', note: null },
  ],
  method_steps: [{ position: 0, text: 'Boil water' }],
  utensils: [{ name: 'pot' }],
};

vi.mock('../src/extraction/anthropic.js', () => ({
  createAnthropicClient: () => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'save_recipe',
            input: {
              title: 'Test Pasta',
              time_minutes: 15,
              difficulty: 'easy',
              servings: 2,
              calories_total: 500,
              protein_grams_total: 18,
              image_url: null,
              recipe_notes: null,
              price_tier: 2,
              ingredients: [{ position: 0, quantity: '200', unit: 'g', name: 'spaghetti', note: null }],
              method_steps: [{ position: 0, text: 'Boil water' }],
              utensils: [{ name: 'pot' }],
            },
          },
        ],
      }),
    },
  }),
  callExtractionModel: vi.fn().mockResolvedValue({
    title: 'Test Pasta',
    time_minutes: 15,
    difficulty: 'easy',
    servings: 2,
    calories_total: 500,
    protein_grams_total: 18,
    image_url: null,
    recipe_notes: null,
    price_tier: 2,
    ingredients: [{ position: 0, quantity: '200', unit: 'g', name: 'spaghetti', note: null }],
    method_steps: [{ position: 0, text: 'Boil water' }],
    utensils: [{ name: 'pot' }],
  }),
}));

describe('POST /api/recipes/extract', () => {
  it('extracts from raw text', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool);
    const token = await signSession({ userId: user.id });
    const app = createApp();
    const res = await app.request('/api/recipes/extract', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE}=${token}` },
      body: JSON.stringify({ text: 'Boil water, add pasta.' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.recipe.title).toBe('Test Pasta');
    expect(body.recipe.source_url).toBeNull();
    await pool.end();
  });

  it('400 when neither url nor text given', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool);
    const token = await signSession({ userId: user.id });
    const app = createApp();
    const res = await app.request('/api/recipes/extract', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE}=${token}` },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    await pool.end();
  });
});
