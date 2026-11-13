import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/testSupport/yieldTestEventLoop.ts'],
    coverage: {
      enabled: false,
    },
  },
});
