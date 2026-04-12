import {
  bigserial,
  bigint,
  boolean,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    googleSub: text('google_sub').notNull(),
    email: text('email').notNull(),
    name: text('name'),
    pictureUrl: text('picture_url'),
    isAllowed: boolean('is_allowed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    googleSubIdx: uniqueIndex('users_google_sub_idx').on(t.googleSub),
  }),
);

export const recipes = pgTable(
  'recipes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    timeMinutes: integer('time_minutes').notNull(),
    difficulty: text('difficulty').notNull(),
    servings: integer('servings').notNull(),
    caloriesTotal: integer('calories_total'),
    proteinGramsTotal: integer('protein_grams_total'),
    imageUrl: text('image_url'),
    sourceUrl: text('source_url'),
    recipeNotes: text('recipe_notes'),
    favorite: boolean('favorite').notNull().default(false),
    priceTier: smallint('price_tier').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('recipes_user_created_idx').on(t.userId, t.createdAt),
    userFavoriteIdx: index('recipes_user_favorite_idx').on(t.userId, t.favorite),
    difficultyCheck: check(
      'recipes_difficulty_check',
      sql`${t.difficulty} IN ('easy','medium','hard')`,
    ),
    priceTierCheck: check(
      'recipes_price_tier_check',
      sql`${t.priceTier} BETWEEN 1 AND 5`,
    ),
  }),
);

export const ingredients = pgTable(
  'ingredients',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    recipeId: bigint('recipe_id', { mode: 'number' })
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    quantity: numeric('quantity'),
    unit: text('unit'),
    name: text('name').notNull(),
    note: text('note'),
  },
  (t) => ({ recipeIdx: index('ingredients_recipe_idx').on(t.recipeId) }),
);

export const methodSteps = pgTable(
  'method_steps',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    recipeId: bigint('recipe_id', { mode: 'number' })
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    text: text('text').notNull(),
  },
  (t) => ({ recipeIdx: index('method_steps_recipe_idx').on(t.recipeId) }),
);

export const utensils = pgTable(
  'utensils',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    recipeId: bigint('recipe_id', { mode: 'number' })
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => ({ recipeIdx: index('utensils_recipe_idx').on(t.recipeId) }),
);

export const userNotes = pgTable(
  'user_notes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    recipeId: bigint('recipe_id', { mode: 'number' })
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ recipeIdx: index('user_notes_recipe_idx').on(t.recipeId) }),
);
