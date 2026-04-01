import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/application/use-cases/**/*.spec.ts',
      'src/domain/errors/**/*.spec.ts',
      'src/presentation/filters/**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/application/use-cases/**',
        'src/domain/errors/**',
        'src/presentation/filters/**',
      ],
      reporter: ['text', 'lcov'],
    },
  },
});
