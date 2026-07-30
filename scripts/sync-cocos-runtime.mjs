import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');

function readOutputDirectory(arguments_) {
  const optionIndex = arguments_.indexOf('--out-dir');
  const value = optionIndex >= 0 ? arguments_[optionIndex + 1] : undefined;
  if (!value) throw new Error('Usage: node scripts/sync-cocos-runtime.mjs --out-dir <directory>');
  return path.resolve(value);
}

export async function syncCocosRuntime(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  await rm(path.join(outputDirectory, 'expedition-runtime.js'), { force: true });
  await build({
    configFile: false,
    logLevel: 'silent',
    resolve: {
      alias: {
        '@expedition/game-data': path.join(repositoryRoot, 'packages/game-data/src/index.ts'),
        '@expedition/guild-session-core': path.join(
          repositoryRoot,
          'packages/guild-session-core/src/index.ts',
        ),
        '@expedition/shared-types': path.join(repositoryRoot, 'packages/shared-types/src/index.ts'),
        '@expedition/presentation-core': path.join(
          repositoryRoot,
          'packages/presentation-core/src/index.ts',
        ),
        '@expedition/simulation-core': path.join(
          repositoryRoot,
          'packages/simulation-core/src/index.ts',
        ),
      },
    },
    build: {
      emptyOutDir: false,
      lib: {
        entry: path.join(scriptDirectory, 'cocos-runtime-entry.ts'),
        formats: ['es'],
        fileName: () => 'expedition-runtime.mjs',
      },
      minify: false,
      outDir: outputDirectory,
      target: 'es2022',
    },
  });
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const outputDirectory = readOutputDirectory(process.argv.slice(2));
  await syncCocosRuntime(outputDirectory);
  process.stdout.write(`${path.join(outputDirectory, 'expedition-runtime.mjs')}\n`);
}
