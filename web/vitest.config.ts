import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['tests/**/*.spec.ts'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
