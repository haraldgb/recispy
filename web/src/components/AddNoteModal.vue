<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ submit: [text: string]; close: [] }>();
const text = ref('');

watch(
  () => props.open,
  (open) => {
    if (open) text.value = '';
  },
);

function submit(): void {
  if (text.value.trim()) {
    emit('submit', text.value.trim());
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="backdrop" @click.self="emit('close')">
      <section class="modal">
        <h3>Add note</h3>
        <textarea v-model="text" rows="5" placeholder="Your note…" />
        <div class="actions">
          <button class="secondary" @click="emit('close')">Cancel</button>
          <button class="primary" :disabled="!text.trim()" @click="submit">Submit note</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal { background: var(--color-surface); border-radius: var(--radius); padding: 24px; max-width: 420px; width: 100%; }
h3 { margin: 0 0 12px; }
textarea { width: 100%; border: 1px solid var(--color-border); border-radius: 8px; padding: 12px; font: inherit; resize: vertical; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
button { padding: 10px 16px; border: none; border-radius: 8px; font-weight: 600; }
.secondary { background: var(--color-bg); color: var(--color-text); }
.primary { background: var(--color-primary); color: white; }
.primary:disabled { opacity: 0.5; }
</style>
