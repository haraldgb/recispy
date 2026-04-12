import type { Recipe } from '@/api/types.js';

export type SortField =
  | 'date_added'
  | 'alphabetical'
  | 'duration'
  | 'difficulty'
  | 'price_tier'
  | 'protein_to_calories'
  | 'favorite';

export type SortDir = 'asc' | 'desc';

const DIFFICULTY_RANK: Record<Recipe['difficulty'], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

function ratio(r: Recipe): number | null {
  if (r.calories_total == null || r.protein_grams_total == null || r.calories_total === 0) {
    return null;
  }
  return r.protein_grams_total / r.calories_total;
}

function nullsLast<T>(a: T | null, b: T | null, cmp: (a: T, b: T) => number): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return cmp(a, b);
}

export function compareRecipes(field: SortField, dir: SortDir) {
  const sign = dir === 'asc' ? 1 : -1;
  return (a: Recipe, b: Recipe): number => {
    let result = 0;
    switch (field) {
      case 'date_added':
        result = a.created_at.localeCompare(b.created_at);
        break;
      case 'alphabetical':
        result = a.title.localeCompare(b.title);
        break;
      case 'duration':
        result = a.time_minutes - b.time_minutes;
        break;
      case 'difficulty':
        result = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
        break;
      case 'price_tier':
        result = a.price_tier - b.price_tier;
        break;
      case 'protein_to_calories':
        return nullsLast(ratio(a), ratio(b), (x, y) => sign * (x - y));
      case 'favorite':
        result = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        return dir === 'asc' ? result : -result;
    }
    return sign * result;
  };
}
