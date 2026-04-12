<script setup lang="ts">
defineProps<{ label?: string }>();
defineEmits<{ click: [] }>();
</script>

<template>
  <button class="fab" :aria-label="label ?? 'Add'" @click="$emit('click')">
    <span aria-hidden="true">+</span>
  </button>
</template>

<style scoped>
.fab {
  position: fixed;
  right: 18px;
  bottom: calc(18px + var(--safe-bottom));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  font-size: 32px;
  line-height: 1;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.fab:active { background: var(--color-primary-hover); }
</style>
