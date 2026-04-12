import { z } from 'zod';

export const ingredientSchema = z.object({
  position: z.number().int().nonnegative(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  name: z.string().min(1),
  note: z.string().nullable(),
});

export const methodStepSchema = z.object({
  position: z.number().int().nonnegative(),
  text: z.string().min(1),
});

export const utensilSchema = z.object({
  name: z.string().min(1),
});

export const recipePayloadSchema = z.object({
  title: z.string().min(1),
  time_minutes: z.number().int().nonnegative(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().int().positive(),
  calories_total: z.number().int().nullable(),
  protein_grams_total: z.number().int().nullable(),
  image_url: z.string().url().nullable(),
  source_url: z.string().url().nullable(),
  recipe_notes: z.string().nullable(),
  price_tier: z.number().int().min(1).max(5),
  ingredients: z.array(ingredientSchema),
  method_steps: z.array(methodStepSchema),
  utensils: z.array(utensilSchema),
});

export type RecipePayload = z.infer<typeof recipePayloadSchema>;
export type IngredientPayload = z.infer<typeof ingredientSchema>;
export type MethodStepPayload = z.infer<typeof methodStepSchema>;
export type UtensilPayload = z.infer<typeof utensilSchema>;

export const userNoteSchema = z.object({ text: z.string().min(1) });
export type UserNotePayload = z.infer<typeof userNoteSchema>;
