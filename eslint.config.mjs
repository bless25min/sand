import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '.cocos-cache/**',
      'apps/game-client-cocos/build/**',
      'apps/game-client-cocos/library/**',
      'apps/game-client-cocos/local/**',
      'apps/game-client-cocos/native/**',
      'apps/game-client-cocos/profiles/**',
      'apps/game-client-cocos/temp/**',
      'apps/game-client-cocos/assets/runtime/expedition-runtime.mjs',
      'apps/worker-api/worker-configuration.d.ts',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
