import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.e2e.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'threads',
    globals: true,
    environment: 'node',
    globalSetup: ['./test/helpers/e2e-global-setup.ts'],
  },
});
