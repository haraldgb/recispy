import { describe, it, expect } from 'vitest';
import { recipePayloadSchema } from '../src/recipes/types.js';

const valid = {
  title: 'Pasta',
  time_minutes: 20,
  difficulty: 'easy',
  servings: 2,
  calories_total: 600,
  protein_grams_total: 25,
  image_url: null,
  source_url: 'https://x',
  recipe_notes: null,
  price_tier: 2,
  ingredients: [
    { position: 0, quantity: '200', unit: 'g', name: 'spaghetti', note: null },
    { position: 1, quantity: null, unit: null, name: 'salt', note: 'to taste' },
  ],
  method_steps: [{ position: 0, text: 'Boil water' }],
  utensils: [{ name: 'pot' }],
};

describe('recipePayloadSchema', () => {
  it('parses a valid payload', () => {
    expect(() => recipePayloadSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid difficulty', () => {
    expect(() => recipePayloadSchema.parse({ ...valid, difficulty: 'extreme' })).toThrow();
  });

  it('rejects price_tier outside 1-5', () => {
    expect(() => recipePayloadSchema.parse({ ...valid, price_tier: 9 })).toThrow();
  });

  it('allows null nutrition fields', () => {
    expect(() =>
      recipePayloadSchema.parse({ ...valid, calories_total: null, protein_grams_total: null }),
    ).not.toThrow();
  });
});
