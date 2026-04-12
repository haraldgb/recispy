export type Difficulty = 'easy' | 'medium' | 'hard';

export type Ingredient = {
  id?: number;
  position: number;
  quantity: string | null;
  unit: string | null;
  name: string;
  note: string | null;
};

export type MethodStep = {
  id?: number;
  position: number;
  text: string;
};

export type Utensil = {
  id?: number;
  name: string;
};

export type UserNote = {
  id: number;
  text: string;
  created_at: string;
};

export type Recipe = {
  id: number;
  user_id: number;
  title: string;
  time_minutes: number;
  difficulty: Difficulty;
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
  ingredients: Ingredient[];
  method_steps: MethodStep[];
  utensils: Utensil[];
  user_notes: UserNote[];
};

export type RecipeDraft = {
  title: string;
  time_minutes: number;
  difficulty: Difficulty;
  servings: number;
  calories_total: number | null;
  protein_grams_total: number | null;
  image_url: string | null;
  source_url: string | null;
  recipe_notes: string | null;
  price_tier: number;
  ingredients: Ingredient[];
  method_steps: MethodStep[];
  utensils: Utensil[];
};

export type CurrentUser = {
  id: number;
  email: string;
  name: string | null;
  picture_url: string | null;
  is_allowed: boolean;
};

export type ApiErrorBody = { error: { code: string; message: string } };
