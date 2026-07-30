import { access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { terminateProcessTree } from './build-cocos.mjs';

const wait = (milliseconds) =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });

export async function smokeWindowsExecutable(executable, options = {}) {
  await (options.verifyExecutable ?? access)(executable);
  const spawnExecutable =
    options.spawnExecutable ??
    ((candidate) =>
      spawn(candidate, [], {
        cwd: path.dirname(candidate),
        stdio: 'ignore',
        windowsHide: true,
      }));
  const terminate = options.terminate ?? terminateProcessTree;
  const child = spawnExecutable(executable);
  let closed = false;
  const earlyExit = new Promise((_, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => {
      if (!closed) reject(new Error(`CocosGame exited during smoke test with code ${code}`));
    });
  });
  try {
    await Promise.race([(options.wait ?? wait)(options.durationMs ?? 3_000), earlyExit]);
  } finally {
    closed = true;
    await terminate(child);
  }
  return { launched: true, closed: true, executable };
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const executable =
    process.argv[2] ??
    path.resolve(
      'apps/game-client-cocos/build/windows/expedition-windows/proj/Release/CocosGame.exe',
    );
  const result = await smokeWindowsExecutable(executable);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
