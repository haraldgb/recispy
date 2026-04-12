import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './views/LoginView.vue';
import HomeView from './views/HomeView.vue';
import { useAuthStore } from './stores/auth.js';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', name: 'home', component: HomeView },
    { path: '/r/:id', name: 'recipe', component: HomeView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.user === null && !auth.loading) {
    await auth.fetchMe();
  }
  if (!to.meta.public && !auth.user) {
    return { name: 'login' };
  }
  if (to.meta.public && auth.user) {
    return { name: 'home' };
  }
});
