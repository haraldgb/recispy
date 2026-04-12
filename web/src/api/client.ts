import type {
  ApiErrorBody,
  CurrentUser,
  Recipe,
  RecipeDraft,
  UserNote,
} from './types.js';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(path, {
    ...init,
    headers,
    body,
    credentials: 'same-origin',
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = data as ApiErrorBody;
    throw new ApiError(
      res.status,
      err.error?.code ?? 'unknown',
      err.error?.message ?? 'Request failed',
    );
  }
  return data as T;
}

export const api = {
  loginGoogle(idToken: string) {
    return request<{ user: CurrentUser }>('/api/auth/google', {
      method: 'POST',
      json: { id_token: idToken },
    });
  },
  logout() {
    return request<Record<string, never>>('/api/auth/logout', { method: 'POST' });
  },
  me() {
    return request<{ user: CurrentUser }>('/api/me');
  },
  listRecipes() {
    return request<{ recipes: Recipe[] }>('/api/recipes');
  },
  getRecipe(id: number) {
    return request<{ recipe: Recipe }>(`/api/recipes/${id}`);
  },
  extractRecipe(input: { url?: string; text?: string }) {
    return request<{ recipe: RecipeDraft }>('/api/recipes/extract', {
      method: 'POST',
      json: input,
    });
  },
  saveRecipe(payload: RecipeDraft) {
    return request<{ recipe: Recipe }>('/api/recipes', {
      method: 'POST',
      json: payload,
    });
  },
  deleteRecipe(id: number) {
    return request<Record<string, never>>(`/api/recipes/${id}`, { method: 'DELETE' });
  },
  toggleFavorite(id: number, favorite: boolean) {
    return request<{ recipe: Recipe }>(`/api/recipes/${id}/favorite`, {
      method: 'PATCH',
      json: { favorite },
    });
  },
  addNote(id: number, text: string) {
    return request<{ note: UserNote }>(`/api/recipes/${id}/notes`, {
      method: 'POST',
      json: { text },
    });
  },
};
