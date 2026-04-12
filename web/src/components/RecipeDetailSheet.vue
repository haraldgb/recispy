<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BottomSheet from './BottomSheet.vue';
import ConfirmModal from './ConfirmModal.vue';
import AddNoteModal from './AddNoteModal.vue';
import { useRecipesStore } from '@/stores/recipes.js';
import { loadChecks, saveChecks } from '@/lib/checks.js';
import { scaleQuantity, formatTime, priceTierLabel } from '@/lib/format.js';
import type { Recipe } from '@/api/types.js';

const props = defineProps<{ recipeId: number | null }>();
const emit = defineEmits<{ close: [] }>();

const recipes = useRecipesStore();

const recipe = computed<Recipe | null>(() => {
  if (props.recipeId == null) return null;
  return recipes.getById(props.recipeId) ?? null;
});

const open = computed(() => props.recipeId != null);
const multiplier = ref(1);
const utensilsExpanded = ref(false);
const ingredientChecks = ref<boolean[]>([]);
const methodChecks = ref<boolean[]>([]);
const noteOpen = ref(false);
const confirmDelete = ref(false);

watch(
  () => props.recipeId,
  (id) => {
    multiplier.value = 1;
    utensilsExpanded.value = false;
    if (id != null && recipe.value) {
      const stored = loadChecks(id);
      ingredientChecks.value = padArray(stored.ingredients, recipe.value.ingredients.length);
      methodChecks.value = padArray(stored.method, recipe.value.method_steps.length);
    } else {
      ingredientChecks.value = [];
      methodChecks.value = [];
    }
  },
  { immediate: true },
);

function padArray(src: boolean[], length: number): boolean[] {
  const out = new Array<boolean>(length).fill(false);
  for (let i = 0; i < Math.min(src.length, length); i++) out[i] = src[i]!;
  return out;
}

function persistChecks(): void {
  if (props.recipeId != null) {
    saveChecks(props.recipeId, {
      ingredients: ingredientChecks.value,
      method: methodChecks.value,
    });
  }
}

function toggleIngredient(i: number): void {
  ingredientChecks.value[i] = !ingredientChecks.value[i];
  persistChecks();
}
function toggleStep(i: number): void {
  methodChecks.value[i] = !methodChecks.value[i];
  persistChecks();
}

async function toggleFavorite(): Promise<void> {
  if (props.recipeId != null) await recipes.toggleFavorite(props.recipeId);
}

async function submitNote(text: string): Promise<void> {
  if (props.recipeId != null) {
    await recipes.addNote(props.recipeId, text);
    noteOpen.value = false;
  }
}

async function performDelete(): Promise<void> {
  if (props.recipeId != null) {
    await recipes.remove(props.recipeId);
    confirmDelete.value = false;
    emit('close');
  }
}
</script>

<template>
  <BottomSheet :open="open" :title="recipe?.title ?? 'Recipe'" @close="emit('close')">
    <div v-if="recipe" class="detail">
      <div class="stats">
        <div class="stat">⏱ {{ formatTime(recipe.time_minutes) }}</div>
        <div class="stat">★ {{ recipe.difficulty }}</div>
        <div class="stat">{{ priceTierLabel(recipe.price_tier) }}</div>
        <div v-if="recipe.calories_total != null" class="stat">{{ recipe.calories_total }} kcal</div>
        <div v-if="recipe.protein_grams_total != null" class="stat">{{ recipe.protein_grams_total }} g protein</div>
        <button class="fav" :class="{ active: recipe.favorite }" :aria-label="recipe.favorite ? 'unfavorite' : 'favorite'" @click="toggleFavorite">
          {{ recipe.favorite ? '♥' : '♡' }}
        </button>
        <label class="multi">
          ×<input v-model.number="multiplier" type="number" min="0.25" step="0.25" />
        </label>
      </div>

      <section class="utensils">
        <button class="collapse" @click="utensilsExpanded = !utensilsExpanded">
          Utensils ({{ recipe.utensils.length }}) {{ utensilsExpanded ? '▴' : '▾' }}
        </button>
        <ul v-if="utensilsExpanded">
          <li v-for="u in recipe.utensils" :key="u.id ?? u.name">{{ u.name }}</li>
        </ul>
      </section>

      <section>
        <h3>Ingredients</h3>
        <ul class="checklist">
          <li v-for="(ing, i) in recipe.ingredients" :key="ing.id ?? i">
            <label>
              <input type="checkbox" :checked="ingredientChecks[i]" @change="toggleIngredient(i)" />
              <span :class="{ done: ingredientChecks[i] }">
                <span v-if="ing.quantity">{{ scaleQuantity(ing.quantity, multiplier) }}</span>
                <span v-if="ing.unit"> {{ ing.unit }}</span>
                {{ ing.name }}<span v-if="ing.note"> ({{ ing.note }})</span>
              </span>
            </label>
          </li>
        </ul>
      </section>

      <section>
        <h3>Method</h3>
        <ol class="checklist">
          <li v-for="(step, i) in recipe.method_steps" :key="step.id ?? i">
            <label>
              <input type="checkbox" :checked="methodChecks[i]" @change="toggleStep(i)" />
              <span :class="{ done: methodChecks[i] }">{{ step.text }}</span>
            </label>
          </li>
        </ol>
      </section>

      <section v-if="recipe.recipe_notes">
        <h3>Recipe notes</h3>
        <p class="notes">{{ recipe.recipe_notes }}</p>
      </section>

      <section>
        <h3>Your notes</h3>
        <ul v-if="recipe.user_notes.length" class="user-notes">
          <li v-for="n in recipe.user_notes" :key="n.id">{{ n.text }}</li>
        </ul>
        <p v-else class="muted">No notes yet.</p>
        <button class="secondary" @click="noteOpen = true">+ Add note</button>
      </section>

      <button class="delete" @click="confirmDelete = true">🗑 Delete recipe</button>
    </div>

    <AddNoteModal :open="noteOpen" @submit="submitNote" @close="noteOpen = false" />
    <ConfirmModal
      :open="confirmDelete"
      title="Delete recipe?"
      message="This cannot be undone."
      confirm-label="Delete"
      destructive
      @confirm="performDelete"
      @cancel="confirmDelete = false"
    />
  </BottomSheet>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 18px; }
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  background: var(--color-bg);
  border-radius: 8px;
  padding: 10px;
}
.stat { font-size: 14px; color: var(--color-text); }
.fav {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 22px;
  color: var(--color-muted);
}
.fav.active { color: var(--color-danger); }
.multi {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.multi input {
  width: 64px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px;
}
.collapse {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 14px;
  width: 100%;
  text-align: left;
  font-weight: 600;
}
.utensils ul {
  margin: 8px 0 0;
  padding: 0 0 0 20px;
}
section h3 { margin: 0 0 8px; font-size: 16px; }
.checklist { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.checklist label { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; }
.checklist input { margin-top: 4px; transform: scale(1.2); }
.done { text-decoration: line-through; color: var(--color-muted); }
.notes { background: var(--color-bg); padding: 12px; border-radius: 8px; white-space: pre-wrap; }
.user-notes { list-style: none; padding: 0; margin: 0 0 10px; display: flex; flex-direction: column; gap: 6px; }
.user-notes li { background: var(--color-bg); padding: 10px; border-radius: 8px; }
.muted { color: var(--color-muted); }
.secondary { background: var(--color-bg); border: 1px dashed var(--color-border); padding: 10px 14px; border-radius: 8px; }
.delete {
  margin-top: 12px;
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
}
</style>
