<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRecipesStore } from '@/stores/recipes.js';
import TopBar from '@/components/TopBar.vue';
import RecipeList from '@/components/RecipeList.vue';
import Fab from '@/components/Fab.vue';

const recipes = useRecipesStore();
const router = useRouter();
const route = useRoute();
const addOpen = ref(false);

onMounted(async () => {
  await recipes.fetchAll();
});

function openRecipe(id: number): void {
  router.push({ name: 'recipe', params: { id: String(id) } });
}

function openAdd(): void {
  addOpen.value = true;
}
</script>

<template>
  <main class="app-shell">
    <TopBar />
    <RecipeList @open="openRecipe" />
    <Fab @click="openAdd" />
    <!-- AddRecipeSheet and RecipeDetailSheet wired in later tasks -->
  </main>
</template>
