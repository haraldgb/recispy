import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, ApiError } from '@/api/client.js';
import type { CurrentUser } from '@/api/types.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<CurrentUser | null>(null);
  const loading = ref(false);

  async function fetchMe(): Promise<void> {
    loading.value = true;
    try {
      const { user: u } = await api.me();
      user.value = u;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        user.value = null;
      } else {
        throw e;
      }
    } finally {
      loading.value = false;
    }
  }

  async function loginWithGoogle(idToken: string): Promise<void> {
    const { user: u } = await api.loginGoogle(idToken);
    user.value = u;
  }

  async function logout(): Promise<void> {
    await api.logout();
    user.value = null;
  }

  return { user, loading, fetchMe, loginWithGoogle, logout };
});
