<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { RecipeDraft, Difficulty } from '@/api/types.js';

const props = defineProps<{ draft: RecipeDraft }>();
const emit = defineEmits<{ save: [draft: RecipeDraft]; discard: [] }>();

const local = reactive<RecipeDraft>(JSON.parse(JSON.stringify(props.draft)));

watch(
  () => props.draft,
  (next) => {
    Object.assign(local, JSON.parse(JSON.stringify(next)));
  },
);

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

function addIngredient(): void {
  local.ingredients.push({
    position: local.ingredients.length,
    quantity: null,
    unit: null,
    name: '',
    note: null,
  });
}
function removeIngredient(idx: number): void {
  local.ingredients.splice(idx, 1);
  local.ingredients.forEach((ing, i) => (ing.position = i));
}
function addStep(): void {
  local.method_steps.push({ position: local.method_steps.length, text: '' });
}
function removeStep(idx: number): void {
  local.method_steps.splice(idx, 1);
  local.method_steps.forEach((s, i) => (s.position = i));
}
function addUtensil(): void {
  local.utensils.push({ name: '' });
}
function removeUtensil(idx: number): void {
  local.utensils.splice(idx, 1);
}
</script>

<template>
  <div class="preview">
    <label class="field">
      <span>Title</span>
      <input v-model="local.title" type="text" />
    </label>

    <div class="row">
      <label class="field">
        <span>Time (min)</span>
        <input v-model.number="local.time_minutes" type="number" min="0" />
      </label>
      <label class="field">
        <span>Servings</span>
        <input v-model.number="local.servings" type="number" min="1" />
      </label>
    </div>

    <div class="row">
      <label class="field">
        <span>Difficulty</span>
        <select v-model="local.difficulty">
          <option v-for="d in difficulties" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>
      <label class="field">
        <span>Price tier (1–5)</span>
        <input v-model.number="local.price_tier" type="number" min="1" max="5" />
      </label>
    </div>

    <div class="row">
      <label class="field">
        <span>Calories total</span>
        <input v-model.number="local.calories_total" type="number" min="0" />
      </label>
      <label class="field">
        <span>Protein (g) total</span>
        <input v-model.number="local.protein_grams_total" type="number" min="0" />
      </label>
    </div>

    <fieldset class="group">
      <legend>Utensils</legend>
      <div v-for="(u, i) in local.utensils" :key="i" class="line">
        <input v-model="u.name" type="text" placeholder="Utensil" />
        <button type="button" @click="removeUtensil(i)">×</button>
      </div>
      <button type="button" class="add" @click="addUtensil">+ utensil</button>
    </fieldset>

    <fieldset class="group">
      <legend>Ingredients</legend>
      <div v-for="(ing, i) in local.ingredients" :key="i" class="ing-line">
        <input v-model="ing.quantity" type="text" placeholder="qty" class="qty" />
        <input v-model="ing.unit" type="text" placeholder="unit" class="unit" />
        <input v-model="ing.name" type="text" placeholder="name" class="name" />
        <button type="button" @click="removeIngredient(i)">×</button>
      </div>
      <button type="button" class="add" @click="addIngredient">+ ingredient</button>
    </fieldset>

    <fieldset class="group">
      <legend>Method</legend>
      <div v-for="(s, i) in local.method_steps" :key="i" class="line">
        <textarea v-model="s.text" rows="2" />
        <button type="button" @click="removeStep(i)">×</button>
      </div>
      <button type="button" class="add" @click="addStep">+ step</button>
    </fieldset>

    <label class="field">
      <span>Recipe notes</span>
      <textarea v-model="local.recipe_notes" rows="3" />
    </label>

    <div class="actions">
      <button class="secondary" type="button" @click="emit('discard')">Discard</button>
      <button class="primary" type="button" @click="emit('save', local)">Save</button>
    </div>
  </div>
</template>

<style scoped>
.preview { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field > span { font-size: 13px; color: var(--color-muted); }
.field input, .field select, .field textarea {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px;
  background: var(--color-surface);
}
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.group {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 12px;
}
.group legend { padding: 0 6px; font-weight: 600; color: var(--color-muted); }
.line, .ing-line {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.line input, .line textarea { flex: 1; border: 1px solid var(--color-border); border-radius: 8px; padding: 8px; }
.ing-line input { border: 1px solid var(--color-border); border-radius: 8px; padding: 8px; min-width: 0; }
.ing-line .qty { width: 60px; flex: 0 0 60px; }
.ing-line .unit { width: 70px; flex: 0 0 70px; }
.ing-line .name { flex: 1; }
.add {
  margin-top: 4px;
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
  padding: 8px 12px;
  border-radius: 8px;
}
.actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 12px; }
.actions button { padding: 12px 18px; border: none; border-radius: 8px; font-weight: 600; }
.secondary { background: var(--color-bg); color: var(--color-text); }
.primary { background: var(--color-primary); color: white; }
button { border: none; background: transparent; }
</style>
