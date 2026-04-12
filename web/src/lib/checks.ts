export type CheckState = { ingredients: boolean[]; method: boolean[] };

export const EXPIRY_MS = 24 * 60 * 60 * 1000;

const EMPTY: CheckState = { ingredients: [], method: [] };

function key(recipeId: number): string {
  return `recispy.checks.v1.${recipeId}`;
}

export function loadChecks(recipeId: number): CheckState {
  try {
    const raw = localStorage.getItem(key(recipeId));
    if (!raw) return { ingredients: [], method: [] };
    const parsed = JSON.parse(raw) as { state: CheckState; updated_at: number };
    if (Date.now() - parsed.updated_at > EXPIRY_MS) {
      localStorage.removeItem(key(recipeId));
      return { ingredients: [], method: [] };
    }
    return parsed.state ?? EMPTY;
  } catch {
    return { ingredients: [], method: [] };
  }
}

export function saveChecks(recipeId: number, state: CheckState): void {
  localStorage.setItem(
    key(recipeId),
    JSON.stringify({ state, updated_at: Date.now() }),
  );
}

export function clearChecks(recipeId: number): void {
  localStorage.removeItem(key(recipeId));
}
