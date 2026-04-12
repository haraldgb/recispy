<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRecipesStore } from '@/stores/recipes.js';
import TopBar from '@/components/TopBar.vue';
import RecipeList from '@/components/RecipeList.vue';
import Fab from '@/components/Fab.vue';
import AddRecipeSheet from '@/components/AddRecipeSheet.vue';

const recipes = useRecipesStore();
const router = useRouter();
const addOpen = ref(false);

onMounted(async () => {
  await recipes.fetchAll();
});

function openRecipe(id: number): void {
  router.push({ name: 'recipe', params: { id: String(id) } });
}
</script>

<template>
  <main class="app-shell">
    <TopBar />
    <RecipeList @open="openRecipe" />
    <Fab @click="addOpen = true" />
    <AddRecipeSheet :open="addOpen" @close="addOpen = false" />
  </main>
</template>
