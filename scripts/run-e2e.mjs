import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewHost = '127.0.0.1';
const previewPort = 4173;
const previewUrl = `http://${previewHost}:${previewPort}`;
const startupTimeoutMs = 20_000;
const shutdownTimeoutMs = 5_000;

export async function assertPortAvailable(host, port) {
  await new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });

    socket.once('connect', () => {
      socket.destroy();
      reject(new Error(`E2E preview port ${host}:${port} is already occupied`));
    });
    socket.once('error', (error) => {
      socket.destroy();
      if (error.code === 'ECONNREFUSED') {
        resolve();
        return;
      }

      reject(new Error(`Could not verify E2E preview port ${host}:${port}: ${error.message}`));
    });
  });
}

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
  await assertPortAvailable(previewHost, previewPort);

  const preview = spawn(
    process.execPath,
    [
      path.join(rootDirectory, 'node_modules', 'vite', 'bin', 'vite.js'),
      'preview',
      '--host',
      previewHost,
      '--port',
      String(previewPort),
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
    if (preview.exitCode !== null || preview.signalCode !== null) {
      throw new Error(`Vite preview exited after readiness (code ${preview.exitCode ?? 'none'})`);
    }

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

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await run();
}
