import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/application/use-cases/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/application/use-cases/**'],
      reporter: ['text', 'lcov'],
    },
  },
});
