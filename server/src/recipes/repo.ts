import { and, desc, eq } from 'drizzle-orm';
import { getDb, schema } from '../db/client.js';
import type { RecipePayload } from './types.js';

export type StoredRecipe = {
  id: number;
  user_id: number;
  title: string;
  time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  calories_total: number | null;
  protein_grams_total: number | null;
  image_url: string | null;
  source_url: string | null;
  recipe_notes: string | null;
  favorite: boolean;
  price_tier: number;
  created_at: string;
  updated_at: string;
  ingredients: Array<{
    id: number;
    position: number;
    quantity: string | null;
    unit: string | null;
    name: string;
    note: string | null;
  }>;
  method_steps: Array<{ id: number; position: number; text: string }>;
  utensils: Array<{ id: number; name: string }>;
  user_notes: Array<{ id: number; text: string; created_at: string }>;
};

export async function createRecipe(
  userId: number,
  payload: RecipePayload,
): Promise<{ id: number }> {
  const db = getDb();
  return await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.recipes)
      .values({
        userId,
        title: payload.title,
        timeMinutes: payload.time_minutes,
        difficulty: payload.difficulty,
        servings: payload.servings,
        caloriesTotal: payload.calories_total,
        proteinGramsTotal: payload.protein_grams_total,
        imageUrl: payload.image_url,
        sourceUrl: payload.source_url,
        recipeNotes: payload.recipe_notes,
        priceTier: payload.price_tier,
      })
      .returning({ id: schema.recipes.id });
    const recipeId = Number(inserted[0]!.id);

    if (payload.ingredients.length > 0) {
      await tx.insert(schema.ingredients).values(
        payload.ingredients.map((i) => ({
          recipeId,
          position: i.position,
          quantity: i.quantity,
          unit: i.unit,
          name: i.name,
          note: i.note,
        })),
      );
    }
    if (payload.method_steps.length > 0) {
      await tx.insert(schema.methodSteps).values(
        payload.method_steps.map((m) => ({
          recipeId,
          position: m.position,
          text: m.text,
        })),
      );
    }
    if (payload.utensils.length > 0) {
      await tx
        .insert(schema.utensils)
        .values(payload.utensils.map((u) => ({ recipeId, name: u.name })));
    }

    return { id: recipeId };
  });
}

async function loadChildren(recipeId: number): Promise<{
  ingredients: StoredRecipe['ingredients'];
  method_steps: StoredRecipe['method_steps'];
  utensils: StoredRecipe['utensils'];
  user_notes: StoredRecipe['user_notes'];
}> {
  const db = getDb();
  const [ing, met, ut, notes] = await Promise.all([
    db
      .select()
      .from(schema.ingredients)
      .where(eq(schema.ingredients.recipeId, recipeId))
      .orderBy(schema.ingredients.position),
    db
      .select()
      .from(schema.methodSteps)
      .where(eq(schema.methodSteps.recipeId, recipeId))
      .orderBy(schema.methodSteps.position),
    db.select().from(schema.utensils).where(eq(schema.utensils.recipeId, recipeId)),
    db
      .select()
      .from(schema.userNotes)
      .where(eq(schema.userNotes.recipeId, recipeId))
      .orderBy(desc(schema.userNotes.createdAt)),
  ]);
  return {
    ingredients: ing.map((r) => ({
      id: Number(r.id),
      position: r.position,
      quantity: r.quantity,
      unit: r.unit,
      name: r.name,
      note: r.note,
    })),
    method_steps: met.map((r) => ({
      id: Number(r.id),
      position: r.position,
      text: r.text,
    })),
    utensils: ut.map((r) => ({ id: Number(r.id), name: r.name })),
    user_notes: notes.map((r) => ({
      id: Number(r.id),
      text: r.text,
      created_at: r.createdAt.toISOString(),
    })),
  };
}

function rowToRecipe(row: typeof schema.recipes.$inferSelect): Omit<
  StoredRecipe,
  'ingredients' | 'method_steps' | 'utensils' | 'user_notes'
> {
  return {
    id: Number(row.id),
    user_id: Number(row.userId),
    title: row.title,
    time_minutes: row.timeMinutes,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    servings: row.servings,
    calories_total: row.caloriesTotal,
    protein_grams_total: row.proteinGramsTotal,
    image_url: row.imageUrl,
    source_url: row.sourceUrl,
    recipe_notes: row.recipeNotes,
    favorite: row.favorite,
    price_tier: row.priceTier,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function getRecipe(
  userId: number,
  recipeId: number,
): Promise<StoredRecipe | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.recipes)
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.userId, userId)))
    .limit(1);
  if (rows.length === 0) return null;
  const base = rowToRecipe(rows[0]!);
  const children = await loadChildren(recipeId);
  return { ...base, ...children };
}

export async function listRecipes(userId: number): Promise<StoredRecipe[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.recipes)
    .where(eq(schema.recipes.userId, userId))
    .orderBy(desc(schema.recipes.createdAt));
  const out: StoredRecipe[] = [];
  for (const row of rows) {
    const base = rowToRecipe(row);
    const children = await loadChildren(Number(row.id));
    out.push({ ...base, ...children });
  }
  return out;
}

export async function deleteRecipe(userId: number, recipeId: number): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(schema.recipes)
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.userId, userId)))
    .returning({ id: schema.recipes.id });
  return result.length > 0;
}

export async function setFavorite(
  userId: number,
  recipeId: number,
  favorite: boolean,
): Promise<boolean> {
  const db = getDb();
  const result = await db
    .update(schema.recipes)
    .set({ favorite, updatedAt: new Date() })
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.userId, userId)))
    .returning({ id: schema.recipes.id });
  return result.length > 0;
}

export async function addUserNote(
  userId: number,
  recipeId: number,
  text: string,
): Promise<{ id: number; text: string; created_at: string } | null> {
  const db = getDb();
  const owner = await db
    .select({ id: schema.recipes.id })
    .from(schema.recipes)
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.userId, userId)))
    .limit(1);
  if (owner.length === 0) return null;
  const inserted = await db
    .insert(schema.userNotes)
    .values({ recipeId, text })
    .returning();
  const r = inserted[0]!;
  return { id: Number(r.id), text: r.text, created_at: r.createdAt.toISOString() };
}
