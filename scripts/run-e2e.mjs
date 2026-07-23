import { spawn } from 'node:child_process';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewUrl = 'http://127.0.0.1:4173';
const startupTimeoutMs = 20_000;
const shutdownTimeoutMs = 5_000;

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.off('exit', onExit);
      resolve(false);
    }, timeoutMs);
    const onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };

    child.once('exit', onExit);
  });
}

async function waitForPreview(preview) {
  const deadline = Date.now() + startupTimeoutMs;

  while (Date.now() < deadline) {
    if (preview.exitCode !== null || preview.signalCode !== null) {
      throw new Error(`Vite preview exited before readiness (code ${preview.exitCode ?? 'none'})`);
    }

    try {
      const response = await globalThis.fetch(previewUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // The direct preview process is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Vite preview did not return HTTP 200 within ${startupTimeoutMs}ms`);
}

async function stopPreview(preview) {
  if (preview.exitCode !== null || preview.signalCode !== null) {
    return;
  }

  preview.kill();
  if (await waitForExit(preview, shutdownTimeoutMs)) {
    return;
  }

  preview.kill('SIGKILL');
  await waitForExit(preview, shutdownTimeoutMs);
}

async function run() {
  const preview = spawn(
    process.execPath,
    [
      path.join(rootDirectory, 'node_modules', 'vite', 'bin', 'vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '4173',
      '--strictPort',
    ],
    {
      cwd: path.join(rootDirectory, 'apps', 'web'),
      env: process.env,
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  try {
    await waitForPreview(preview);

    const playwright = spawn(
      process.execPath,
      [
        path.join(rootDirectory, 'node_modules', '@playwright', 'test', 'cli.js'),
        'test',
        ...process.argv.slice(2),
      ],
      {
        cwd: rootDirectory,
        env: {
          ...process.env,
          EXPEDITION_E2E_EXTERNAL_SERVER: '1',
        },
        stdio: 'inherit',
        windowsHide: true,
      },
    );
    const [code, signal] = await new Promise((resolve, reject) => {
      playwright.once('error', reject);
      playwright.once('exit', (...result) => resolve(result));
    });

    if (signal !== null) {
      throw new Error(`Playwright exited from signal ${signal}`);
    }

    process.exitCode = code ?? 1;
  } finally {
    await stopPreview(preview);
  }
}

await run();
