<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRecipesStore } from '@/stores/recipes.js';
import TopBar from '@/components/TopBar.vue';
import RecipeList from '@/components/RecipeList.vue';
import Fab from '@/components/Fab.vue';
import AddRecipeSheet from '@/components/AddRecipeSheet.vue';
import RecipeDetailSheet from '@/components/RecipeDetailSheet.vue';

const recipes = useRecipesStore();
const router = useRouter();
const route = useRoute();
const addOpen = ref(false);

const detailId = computed<number | null>(() => {
  const param = route.params.id;
  if (typeof param === 'string') {
    const n = Number.parseInt(param, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
});

onMounted(async () => {
  await recipes.fetchAll();
});

watch(
  () => detailId.value,
  (id) => {
    if (id != null && !recipes.getById(id)) {
      void recipes.fetchAll();
    }
  },
);

function openRecipe(id: number): void {
  router.push({ name: 'recipe', params: { id: String(id) } });
}

function closeDetail(): void {
  router.push({ name: 'home' });
}
</script>

<template>
  <main class="app-shell">
    <TopBar />
    <RecipeList @open="openRecipe" />
    <Fab @click="addOpen = true" />
    <AddRecipeSheet :open="addOpen" @close="addOpen = false" />
    <RecipeDetailSheet :recipe-id="detailId" @close="closeDetail" />
  </main>
</template>
