<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const open = ref(false);

async function handleLogout(): Promise<void> {
  await auth.logout();
  router.replace('/login');
}
</script>

<template>
  <div class="account">
    <button class="avatar" aria-label="Account" @click="open = !open">
      <img v-if="auth.user?.picture_url" :src="auth.user.picture_url" alt="" />
      <span v-else>{{ auth.user?.email?.[0]?.toUpperCase() ?? '?' }}</span>
    </button>
    <div v-if="open" class="dropdown" @click.self="open = false">
      <div class="panel">
        <div class="email">{{ auth.user?.email }}</div>
        <button class="logout" @click="handleLogout">Log out</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account { position: relative; }
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-border);
  border: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  font-weight: 600;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.dropdown { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 50; }
.panel {
  position: absolute;
  top: 56px;
  right: 12px;
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  min-width: 220px;
  padding: 12px;
}
.email { color: var(--color-muted); font-size: 14px; padding: 8px; }
.logout {
  display: block;
  width: 100%;
  padding: 12px;
  background: var(--color-bg);
  border: none;
  border-radius: 8px;
  color: var(--color-danger);
  font-weight: 600;
  margin-top: 8px;
}
</style>
