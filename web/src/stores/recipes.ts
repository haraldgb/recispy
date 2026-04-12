import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '@/api/client.js';
import type { Recipe, RecipeDraft } from '@/api/types.js';
import { compareRecipes } from '@/lib/sort.js';
import { useSortStore } from './sort.js';

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const sort = useSortStore();

  const sorted = computed(() => {
    return [...recipes.value].sort(compareRecipes(sort.field, sort.dir));
  });

  async function fetchAll(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const { recipes: r } = await api.listRecipes();
      recipes.value = r;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function extract(input: { url?: string; text?: string }): Promise<RecipeDraft> {
    const { recipe } = await api.extractRecipe(input);
    return recipe;
  }

  async function save(payload: RecipeDraft): Promise<Recipe> {
    const { recipe } = await api.saveRecipe(payload);
    recipes.value = [recipe, ...recipes.value];
    return recipe;
  }

  async function remove(id: number): Promise<void> {
    await api.deleteRecipe(id);
    recipes.value = recipes.value.filter((r) => r.id !== id);
  }

  async function toggleFavorite(id: number): Promise<void> {
    const current = recipes.value.find((r) => r.id === id);
    if (!current) return;
    const { recipe } = await api.toggleFavorite(id, !current.favorite);
    recipes.value = recipes.value.map((r) => (r.id === id ? recipe : r));
  }

  async function addNote(id: number, text: string): Promise<void> {
    const { note } = await api.addNote(id, text);
    recipes.value = recipes.value.map((r) =>
      r.id === id ? { ...r, user_notes: [note, ...r.user_notes] } : r,
    );
  }

  function getById(id: number): Recipe | undefined {
    return recipes.value.find((r) => r.id === id);
  }

  return { recipes, sorted, loading, error, fetchAll, extract, save, remove, toggleFavorite, addNote, getById };
});
