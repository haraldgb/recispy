<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const error = ref<string | null>(null);
const buttonContainer = ref<HTMLDivElement | null>(null);

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

async function handleCredential(idToken: string): Promise<void> {
  error.value = null;
  try {
    await auth.loginWithGoogle(idToken);
    router.replace('/');
  } catch (e) {
    error.value = (e as Error).message;
  }
}

onMounted(async () => {
  try {
    await loadGsi();
  } catch (e) {
    error.value = (e as Error).message;
    return;
  }
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    error.value = 'VITE_GOOGLE_CLIENT_ID is not configured';
    return;
  }
  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => handleCredential(response.credential),
  });
  if (buttonContainer.value) {
    window.google!.accounts.id.renderButton(buttonContainer.value, {
      type: 'standard',
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
    });
  }
});
</script>

<template>
  <main class="login">
    <div class="card">
      <h1>Recispy</h1>
      <p class="subtitle">Sign in with Google to continue.</p>
      <div ref="buttonContainer" class="gsi-button" />
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 24px;
}
.card {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 32px 24px;
  box-shadow: var(--shadow);
  text-align: center;
  max-width: 360px;
  width: 100%;
}
h1 {
  margin: 0 0 8px;
  color: var(--color-primary);
}
.subtitle {
  margin: 0 0 24px;
  color: var(--color-muted);
}
.gsi-button {
  display: flex;
  justify-content: center;
}
.error {
  color: var(--color-danger);
  margin-top: 16px;
}
</style>
