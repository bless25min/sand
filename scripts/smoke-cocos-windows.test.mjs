import { EventEmitter } from 'node:events';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { smokeWindowsExecutable } from './smoke-cocos-windows.mjs';

const fakeChild = () => {
  const child = new EventEmitter();
  child.pid = 1234;
  child.exitCode = null;
  return child;
};

describe('Windows Cocos smoke', () => {
  it('requires the executable to stay alive, then always closes the owned process', async () => {
    const child = fakeChild();
    const terminate = vi.fn(async () => {
      child.exitCode = 0;
      child.emit('exit', 0);
    });

    await expect(
      smokeWindowsExecutable(path.resolve('CocosGame.exe'), {
        spawnExecutable: () => child,
        verifyExecutable: async () => undefined,
        wait: async () => undefined,
        terminate,
      }),
    ).resolves.toMatchObject({ launched: true, closed: true });
    expect(terminate).toHaveBeenCalledWith(child);
  });

  it('reports an executable that crashes before the smoke window completes', async () => {
    const child = fakeChild();
    await expect(
      smokeWindowsExecutable(path.resolve('CocosGame.exe'), {
        spawnExecutable: () => {
          globalThis.queueMicrotask(() => {
            child.exitCode = 9;
            child.emit('exit', 9);
          });
          return child;
        },
        verifyExecutable: async () => undefined,
        wait: async () => new Promise((resolve) => globalThis.setTimeout(resolve, 20)),
        terminate: async () => undefined,
      }),
    ).rejects.toThrow('exited during smoke test');
  });
});
