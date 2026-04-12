import { describe, it, expect } from 'vitest';
import { compareRecipes, type SortField } from '@/lib/sort.js';
import type { Recipe } from '@/api/types.js';

const make = (over: Partial<Recipe>): Recipe => ({
  id: 1,
  user_id: 1,
  title: 't',
  time_minutes: 10,
  difficulty: 'easy',
  servings: 1,
  calories_total: 100,
  protein_grams_total: 10,
  image_url: null,
  source_url: null,
  recipe_notes: null,
  favorite: false,
  price_tier: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ingredients: [],
  method_steps: [],
  utensils: [],
  user_notes: [],
  ...over,
});

function sortBy(field: SortField, dir: 'asc' | 'desc', list: Recipe[]) {
  return [...list].sort(compareRecipes(field, dir));
}

describe('compareRecipes', () => {
  it('sorts by title alphabetical asc', () => {
    const sorted = sortBy('alphabetical', 'asc', [
      make({ id: 1, title: 'banana' }),
      make({ id: 2, title: 'apple' }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual([2, 1]);
  });

  it('sorts by duration asc', () => {
    const sorted = sortBy('duration', 'asc', [
      make({ id: 1, time_minutes: 30 }),
      make({ id: 2, time_minutes: 10 }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual([2, 1]);
  });

  it('sorts by difficulty (easy < medium < hard) asc', () => {
    const sorted = sortBy('difficulty', 'asc', [
      make({ id: 1, difficulty: 'hard' }),
      make({ id: 2, difficulty: 'easy' }),
      make({ id: 3, difficulty: 'medium' }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('sorts by protein_to_calories ratio desc', () => {
    const sorted = sortBy('protein_to_calories', 'desc', [
      make({ id: 1, calories_total: 100, protein_grams_total: 10 }),
      make({ id: 2, calories_total: 100, protein_grams_total: 25 }),
      make({ id: 3, calories_total: null, protein_grams_total: null }),
    ]);
    expect(sorted.map((r) => r.id).slice(0, 2)).toEqual([2, 1]);
    expect(sorted[2]!.id).toBe(3);
  });

  it('sorts favorites first asc puts favorites at top', () => {
    const sorted = sortBy('favorite', 'asc', [
      make({ id: 1, favorite: false }),
      make({ id: 2, favorite: true }),
    ]);
    expect(sorted[0]!.id).toBe(2);
  });
});
