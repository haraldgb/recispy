<script setup lang="ts">
import { useRecipesStore } from '@/stores/recipes.js';
import RecipeListItem from './RecipeListItem.vue';

const recipes = useRecipesStore();

defineEmits<{ open: [id: number] }>();
</script>

<template>
  <div class="list">
    <p v-if="recipes.loading" class="empty">Loading…</p>
    <p v-else-if="recipes.error" class="empty error">{{ recipes.error }}</p>
    <p v-else-if="recipes.sorted.length === 0" class="empty">
      No recipes yet — tap + to add your first one.
    </p>
    <RecipeListItem
      v-for="r in recipes.sorted"
      :key="r.id"
      :recipe="r"
      @open="(id) => $emit('open', id)"
    />
  </div>
</template>

<style scoped>
.list { padding: 12px 12px calc(96px + var(--safe-bottom)); }
.empty {
  text-align: center;
  color: var(--color-muted);
  margin: 48px 16px;
}
.empty.error { color: var(--color-danger); }
</style>
