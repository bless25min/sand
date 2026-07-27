import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const buildCommand =
  process.platform === 'win32'
    ? {
        arguments: ['/d', '/s', '/c', 'pnpm.cmd --filter @expedition/web build:sites'],
        executable: 'cmd.exe',
      }
    : {
        arguments: ['--filter', '@expedition/web', 'build:sites'],
        executable: 'pnpm',
      };

describe('Sites build layout', () => {
  it('stages the worker and browser assets in their independent directories', () => {
    execFileSync(buildCommand.executable, buildCommand.arguments, {
      cwd: repositoryRoot,
      stdio: 'pipe',
    });

    expect(existsSync(join(repositoryRoot, 'apps', 'web', 'dist', '_worker.js'))).toBe(true);
    expect(existsSync(join(repositoryRoot, 'dist', 'server', 'index.js'))).toBe(true);
    expect(existsSync(join(repositoryRoot, 'dist', 'client', 'index.html'))).toBe(true);
    expect(existsSync(join(repositoryRoot, 'dist', '.openai', 'hosting.json'))).toBe(true);
    expect(existsSync(join(repositoryRoot, 'dist', 'index.html'))).toBe(false);
    const clientHtml = readFileSync(
      join(repositoryRoot, 'apps', 'web', 'dist', 'index.html'),
      'utf8',
    );
    expect(clientHtml).not.toMatch(/modulepreload[^>]+(?:pixi|prototypes)/);
    const assetDirectory = join(repositoryRoot, 'apps', 'web', 'dist', 'assets');
    const oversizedJavaScript = readdirSync(assetDirectory)
      .filter((name) => name.endsWith('.js'))
      .filter((name) => !name.startsWith('pixi-'))
      .filter((name) => statSync(join(assetDirectory, name)).size >= 500 * 1024);
    expect(oversizedJavaScript).toEqual([]);
    const pixiChunk = readdirSync(assetDirectory).find((name) => name.startsWith('pixi-'));
    expect(pixiChunk).toBeDefined();
    expect(statSync(join(assetDirectory, pixiChunk!)).size).toBeLessThan(525 * 1024);
  }, 15_000);
});
