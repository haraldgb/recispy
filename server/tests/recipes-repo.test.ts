import { describe, it, expect } from 'vitest';
import { createRecipe, getRecipe, listRecipes, deleteRecipe } from '../src/recipes/repo.js';
import { createTestUser, makeTestDb } from './helpers.js';
import type { RecipePayload } from '../src/recipes/types.js';

const samplePayload: RecipePayload = {
  title: 'Pasta',
  time_minutes: 15,
  difficulty: 'easy',
  servings: 2,
  calories_total: 500,
  protein_grams_total: 18,
  image_url: null,
  source_url: 'https://example.com/pasta',
  recipe_notes: 'Salt the water generously',
  price_tier: 2,
  ingredients: [
    { position: 0, quantity: '200', unit: 'g', name: 'spaghetti', note: null },
    { position: 1, quantity: null, unit: null, name: 'salt', note: 'to taste' },
  ],
  method_steps: [
    { position: 0, text: 'Boil water' },
    { position: 1, text: 'Add pasta and cook 9 minutes' },
  ],
  utensils: [{ name: 'pot' }, { name: 'colander' }],
};

describe('recipes repo', () => {
  it('creates and reads a recipe with children', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool);
    const created = await createRecipe(user.id, samplePayload);
    expect(created.id).toBeGreaterThan(0);
    const fetched = await getRecipe(user.id, created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.title).toBe('Pasta');
    expect(fetched!.ingredients).toHaveLength(2);
    expect(fetched!.method_steps).toHaveLength(2);
    expect(fetched!.utensils).toHaveLength(2);
    expect(fetched!.ingredients[0]!.name).toBe('spaghetti');
    expect(fetched!.method_steps[1]!.text).toContain('cook');
    await pool.end();
  });

  it("returns null when fetching another user's recipe", async () => {
    const { pool } = makeTestDb();
    const a = await createTestUser(pool);
    const b = await createTestUser(pool);
    const created = await createRecipe(a.id, samplePayload);
    const fetched = await getRecipe(b.id, created.id);
    expect(fetched).toBeNull();
    await pool.end();
  });

  it('lists user recipes ordered by created_at desc', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool);
    await createRecipe(user.id, { ...samplePayload, title: 'First' });
    await new Promise((r) => setTimeout(r, 5));
    await createRecipe(user.id, { ...samplePayload, title: 'Second' });
    const list = await listRecipes(user.id);
    expect(list.map((r) => r.title)).toEqual(['Second', 'First']);
    await pool.end();
  });

  it('deletes a recipe and cascades children', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool);
    const created = await createRecipe(user.id, samplePayload);
    const deleted = await deleteRecipe(user.id, created.id);
    expect(deleted).toBe(true);
    const fetched = await getRecipe(user.id, created.id);
    expect(fetched).toBeNull();
    const ing = await pool.query('SELECT count(*) FROM ingredients WHERE recipe_id = $1', [
      created.id,
    ]);
    expect(Number(ing.rows[0].count)).toBe(0);
    await pool.end();
  });

  it('delete returns false when not found', async () => {
    const { pool } = makeTestDb();
    const user = await createTestUser(pool);
    const ok = await deleteRecipe(user.id, 99999);
    expect(ok).toBe(false);
    await pool.end();
  });
});
