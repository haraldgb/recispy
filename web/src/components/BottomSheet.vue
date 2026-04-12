<script setup lang="ts">
defineProps<{ open: boolean; title?: string }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click.self="$emit('close')">
      <section class="sheet" role="dialog" aria-modal="true">
        <header class="sheet-header">
          <h2>{{ title }}</h2>
          <button class="close" aria-label="Close" @click="$emit('close')">×</button>
        </header>
        <div class="sheet-body">
          <slot />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  background: var(--color-surface);
  width: 100%;
  max-width: 640px;
  max-height: 92dvh;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slide-up 220ms ease;
}
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}
.sheet-header h2 {
  margin: 0;
  font-size: 18px;
}
.close {
  background: transparent;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: var(--color-muted);
  padding: 4px 8px;
}
.sheet-body {
  overflow-y: auto;
  padding: 16px;
  padding-bottom: calc(16px + var(--safe-bottom));
}
</style>
