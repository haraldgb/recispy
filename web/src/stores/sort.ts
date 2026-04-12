import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { SortField, SortDir } from '@/lib/sort.js';

const STORAGE_KEY = 'recispy.sort.v1';

type Stored = { field: SortField; dir: SortDir };

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {}
  return { field: 'date_added', dir: 'desc' };
}

export const useSortStore = defineStore('sort', () => {
  const initial = load();
  const field = ref<SortField>(initial.field);
  const dir = ref<SortDir>(initial.dir);

  watch([field, dir], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ field: field.value, dir: dir.value }));
  });

  function set(nextField: SortField): void {
    if (nextField === field.value) {
      dir.value = dir.value === 'asc' ? 'desc' : 'asc';
    } else {
      field.value = nextField;
      dir.value = nextField === 'date_added' ? 'desc' : 'asc';
    }
  }

  return { field, dir, set };
});
