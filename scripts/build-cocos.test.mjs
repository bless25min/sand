import path from 'node:path';
import process from 'node:process';

import { describe, expect, it, vi } from 'vitest';

import {
  buildCocosTarget,
  findCreatorExecutable,
  runProcess,
  serializeBuildArguments,
} from './build-cocos.mjs';

describe('Cocos build runner', () => {
  it('serializes one reproducible Creator command without shell quoting', () => {
    expect(
      serializeBuildArguments({
        platform: 'web-mobile',
        debug: false,
        md5Cache: true,
        buildPath: 'build/web-mobile',
        outputName: 'expedition-mobile',
      }),
    ).toBe(
      'platform=web-mobile;debug=false;md5Cache=true;buildPath=project://build/web-mobile;outputName=expedition-mobile',
    );
  });

  it('accepts only an existing Creator executable and explains the manual install gate', async () => {
    const expected = path.resolve('CocosCreator.exe');
    await expect(
      findCreatorExecutable({
        environmentPath: expected,
        exists: async (candidate) => candidate === expected,
      }),
    ).resolves.toBe(expected);

    await expect(
      findCreatorExecutable({ environmentPath: '', exists: async () => false }),
    ).rejects.toThrow('Cocos Creator 3.8.8 is not installed');
  });

  it('syncs runtime and audio before invoking Creator and surfaces a failed build', async () => {
    const calls = [];
    const run = vi.fn(async (executable, arguments_) => {
      calls.push([executable, ...arguments_]);
      return calls.length < 3 ? 0 : 7;
    });

    await expect(
      buildCocosTarget('web-mobile', {
        creatorExecutable: 'C:/CocosCreator.exe',
        run,
      }),
    ).rejects.toThrow('Cocos web-mobile build failed with exit code 7');
    expect(calls[0]?.join(' ')).toContain('sync-cocos-runtime.mjs');
    expect(calls[1]?.join(' ')).toContain('generate-cocos-audio.mjs');
    expect(calls[2]).toEqual([
      'C:/CocosCreator.exe',
      '--project',
      path.resolve('apps/game-client-cocos'),
      '--build',
      expect.stringContaining('platform=web-mobile'),
    ]);
  });

  it('accepts Creator exit code 36 as a successful command-line build', async () => {
    const run = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(36);

    await expect(
      buildCocosTarget('web-mobile', {
        creatorExecutable: 'C:/CocosCreator.exe',
        run,
      }),
    ).resolves.toBe(
      path.resolve('apps/game-client-cocos', 'build/web-mobile', 'expedition-mobile'),
    );
  });

  it('compiles the generated Windows solution and returns a real executable', async () => {
    const calls = [];
    const run = vi.fn(async (executable, arguments_) => {
      calls.push([executable, ...arguments_]);
      return calls.length === 3 ? 36 : 0;
    });
    const creatorExecutable = path.resolve('.cocos-cache/creator-3.8.8/CocosCreator.exe');

    const output = await buildCocosTarget('windows', {
      creatorExecutable,
      run,
      verifyWindowsExecutable: async (candidate) => candidate.endsWith('CocosGame.exe'),
    });

    expect(calls).toHaveLength(4);
    expect(calls[3]).toEqual([
      expect.stringContaining('cmake.exe'),
      '--build',
      expect.stringContaining('expedition-windows'),
      '--config',
      'Release',
      '--target',
      'CocosGame',
      '--',
      '/m',
    ]);
    expect(output).toBe(
      path.resolve(
        'apps/game-client-cocos/build/windows/expedition-windows/proj/Release/CocosGame.exe',
      ),
    );
  });

  it('terminates a timed-out child process instead of leaving Creator behind', async () => {
    await expect(
      runProcess(process.execPath, ['-e', 'setInterval(() => undefined, 1_000)'], {
        timeoutMs: 80,
      }),
    ).rejects.toThrow('timed out');
  });

  it('terminates an owned child tree when the build is aborted', async () => {
    const controller = new globalThis.AbortController();
    const running = runProcess(process.execPath, ['-e', 'setInterval(() => undefined, 1_000)'], {
      timeoutMs: 5_000,
      signal: controller.signal,
    });
    controller.abort();

    await expect(running).rejects.toThrow('aborted');
  });
});
