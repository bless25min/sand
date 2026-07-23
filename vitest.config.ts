import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const workspacePackage = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@expedition/command-schema': workspacePackage('./packages/command-schema/src/index.ts'),
      '@expedition/game-data': workspacePackage('./packages/game-data/src/index.ts'),
      '@expedition/pixi-renderer': workspacePackage('./packages/pixi-renderer/src/index.ts'),
      '@expedition/progression-core': workspacePackage('./packages/progression-core/src/index.ts'),
      '@expedition/shared-types': workspacePackage('./packages/shared-types/src/index.ts'),
      '@expedition/simulation-core': workspacePackage('./packages/simulation-core/src/index.ts'),
      '@expedition/test-fixtures': workspacePackage('./packages/test-fixtures/src/index.ts'),
    },
  },
  test: {
    include: [
      'apps/**/src/**/*.test.{ts,tsx}',
      'packages/**/src/**/*.test.ts',
      'scripts/**/*.test.mjs',
    ],
    passWithNoTests: false,
    reporters: ['default'],
  },
});
