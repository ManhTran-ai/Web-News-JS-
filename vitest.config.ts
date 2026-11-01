import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client/src', import.meta.url)),
    },
  },
  test: {
    include: ['client/src/**/*.test.ts', 'server/src/**/*.test.ts'],
    environment: 'node',
  },
});
