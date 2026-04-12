<script setup lang="ts">
import type { Recipe } from '@/api/types.js';
import { formatTime, priceTierLabel } from '@/lib/format.js';

defineProps<{ recipe: Recipe }>();
defineEmits<{ open: [id: number] }>();
</script>

<template>
  <button class="item" @click="$emit('open', recipe.id)">
    <div class="title-row">
      <span class="title">{{ recipe.title }}</span>
      <span v-if="recipe.favorite" class="favorite" aria-label="favorite">♥</span>
    </div>
    <div class="meta">
      <span>{{ formatTime(recipe.time_minutes) }}</span>
      <span class="dot">·</span>
      <span>{{ recipe.difficulty }}</span>
      <span class="dot">·</span>
      <span>{{ priceTierLabel(recipe.price_tier) }}</span>
      <span v-if="recipe.calories_total != null" class="dot">·</span>
      <span v-if="recipe.calories_total != null">{{ recipe.calories_total }} kcal</span>
    </div>
  </button>
</template>

<style scoped>
.item {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: var(--shadow);
}
.item:active { background: #f0f0f0; }
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-weight: 600;
  font-size: 16px;
}
.favorite { color: var(--color-danger); font-size: 18px; }
.meta {
  margin-top: 6px;
  color: var(--color-muted);
  font-size: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.dot { opacity: 0.6; }
</style>
