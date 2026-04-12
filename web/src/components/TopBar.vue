<script setup lang="ts">
import SortMenu from './SortMenu.vue';
import AccountMenu from './AccountMenu.vue';
</script>

<template>
  <header class="top-bar">
    <h1 class="brand">Recispy</h1>
    <div class="actions">
      <SortMenu />
      <AccountMenu />
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand {
  margin: 0;
  font-size: 20px;
  color: var(--color-primary);
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
