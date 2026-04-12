<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}>();
defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click.self="$emit('cancel')">
      <section class="modal">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="actions">
          <button class="secondary" @click="$emit('cancel')">Cancel</button>
          <button class="primary" :class="{ destructive }" @click="$emit('confirm')">
            {{ confirmLabel ?? 'Confirm' }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 24px;
  max-width: 360px;
  width: 100%;
}
h3 { margin: 0 0 8px; }
p { margin: 0 0 20px; color: var(--color-muted); }
.actions { display: flex; gap: 8px; justify-content: flex-end; }
button {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
}
.secondary { background: var(--color-bg); color: var(--color-text); }
.primary { background: var(--color-primary); color: white; }
.primary.destructive { background: var(--color-danger); }
</style>
