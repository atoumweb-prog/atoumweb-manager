import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/testSupport/yieldTestEventLoop.ts'],
    coverage: {
      enabled: false,
    },
  },
});
