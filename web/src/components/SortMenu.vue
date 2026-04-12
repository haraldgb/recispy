<script setup lang="ts">
import { ref } from 'vue';
import { useSortStore } from '@/stores/sort.js';
import type { SortField } from '@/lib/sort.js';

const sort = useSortStore();
const open = ref(false);

const options: { value: SortField; label: string }[] = [
  { value: 'date_added', label: 'Date added' },
  { value: 'alphabetical', label: 'A → Z' },
  { value: 'duration', label: 'Duration' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'price_tier', label: 'Price tier' },
  { value: 'protein_to_calories', label: 'Protein / calorie ratio' },
  { value: 'favorite', label: 'Favorites first' },
];

function pick(field: SortField): void {
  sort.set(field);
  open.value = false;
}
</script>

<template>
  <div class="sort-menu">
    <button class="icon-button" aria-label="Sort" @click="open = !open">⇅</button>
    <div v-if="open" class="dropdown" @click.self="open = false">
      <div class="panel">
        <button
          v-for="opt in options"
          :key="opt.value"
          class="option"
          :class="{ active: sort.field === opt.value }"
          @click="pick(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <span v-if="sort.field === opt.value" class="arrow">{{ sort.dir === 'asc' ? '↑' : '↓' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sort-menu { position: relative; }
.icon-button {
  background: transparent;
  border: none;
  font-size: 20px;
  padding: 8px;
  color: var(--color-text);
}
.dropdown {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 50;
}
.panel {
  position: absolute;
  top: 56px;
  right: 12px;
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  min-width: 220px;
  overflow: hidden;
}
.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.option:last-child { border-bottom: none; }
.option.active { color: var(--color-primary); font-weight: 600; }
.arrow { color: var(--color-primary); }
</style>
