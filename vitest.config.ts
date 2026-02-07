/**
 * @file Root Vitest Configuration
 * @description Global vitest config for the monorepo. Each package can extend or override.
 * @remarks Workspace packages define their own vitest configs that inherit from this.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
    testTimeout: 15_000,
  },
});
