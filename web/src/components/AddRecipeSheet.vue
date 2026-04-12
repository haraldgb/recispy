<script setup lang="ts">
import { ref } from 'vue';
import BottomSheet from './BottomSheet.vue';
import RecipePreview from './RecipePreview.vue';
import { useRecipesStore } from '@/stores/recipes.js';
import { ApiError } from '@/api/client.js';
import type { RecipeDraft } from '@/api/types.js';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const recipes = useRecipesStore();
const tab = ref<'url' | 'text'>('url');
const url = ref('');
const text = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const draft = ref<RecipeDraft | null>(null);

function reset(): void {
  tab.value = 'url';
  url.value = '';
  text.value = '';
  loading.value = false;
  error.value = null;
  draft.value = null;
}

function close(): void {
  reset();
  emit('close');
}

async function submit(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    if (tab.value === 'url') {
      draft.value = await recipes.extract({ url: url.value });
    } else {
      draft.value = await recipes.extract({ text: text.value });
    }
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = e.message;
      if (e.code === 'fetch_failed') tab.value = 'text';
    } else {
      error.value = (e as Error).message;
    }
  } finally {
    loading.value = false;
  }
}

async function save(payload: RecipeDraft): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    await recipes.save(payload);
    close();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function discard(): void {
  draft.value = null;
}
</script>

<template>
  <BottomSheet :open="props.open" title="Add recipe" @close="close">
    <div v-if="!draft">
      <div class="tabs">
        <button :class="{ active: tab === 'url' }" @click="tab = 'url'">URL</button>
        <button :class="{ active: tab === 'text' }" @click="tab = 'text'">Paste text</button>
      </div>
      <div v-if="tab === 'url'" class="pane">
        <input v-model="url" type="url" placeholder="https://..." :disabled="loading" />
        <button class="primary" :disabled="loading || !url" @click="submit">
          {{ loading ? 'Extracting…' : 'Extract' }}
        </button>
      </div>
      <div v-else class="pane">
        <textarea v-model="text" rows="12" placeholder="Paste the recipe text here…" :disabled="loading" />
        <button class="primary" :disabled="loading || !text" @click="submit">
          {{ loading ? 'Extracting…' : 'Extract' }}
        </button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
    <RecipePreview v-else :draft="draft" @save="save" @discard="discard" />
  </BottomSheet>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tabs button {
  flex: 1;
  padding: 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-weight: 600;
  color: var(--color-muted);
}
.tabs button.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.pane { display: flex; flex-direction: column; gap: 12px; }
.pane input, .pane textarea {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
}
.primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
}
.primary:disabled { opacity: 0.5; }
.error { color: var(--color-danger); margin-top: 12px; }
</style>
