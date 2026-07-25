import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

const workerEntry = fileURLToPath(new URL('./worker/index.ts', import.meta.url));
const workerOutput = fileURLToPath(new URL('./dist', import.meta.url));

export default defineConfig({
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    lib: {
      entry: workerEntry,
      fileName: () => '_worker.js',
      formats: ['es'],
    },
    minify: true,
    outDir: workerOutput,
  },
});
