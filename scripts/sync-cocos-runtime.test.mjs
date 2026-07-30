import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

import { afterEach, expect, test } from 'vitest';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

test('bundles the real six-hero hunt as a browser and native safe ESM runtime', async () => {
  const outputDirectory = await mkdtemp(path.join(tmpdir(), 'expedition-cocos-runtime-'));
  temporaryDirectories.push(outputDirectory);
  const scriptPath = path.resolve('scripts/sync-cocos-runtime.mjs');
  const result = spawnSync(process.execPath, [scriptPath, '--out-dir', outputDirectory], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  expect(result.status, result.stderr).toBe(0);
  const bundlePath = path.join(outputDirectory, 'expedition-runtime.mjs');
  const source = await readFile(bundlePath, 'utf8');
  const executableSource = source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');
  const browserGlobal = executableSource.match(/\b(?:document|localStorage|window)\s*(?:\.|\[)/);
  expect(browserGlobal?.[0]).toBeUndefined();

  const runtime = await import(`${pathToFileURL(bundlePath).href}?test=${Date.now()}`);
  const profile = runtime.createProfile();
  const questId = profile.unlockedQuestIds[0];
  expect(questId).toBeTypeOf('string');
  const battle = runtime.startQuest(profile, questId);

  expect(profile.party).toHaveLength(6);
  expect(battle.units.filter(({ side }) => side === 'heroes')).toHaveLength(6);
  expect(battle.units.filter(({ side }) => side === 'enemies')).toHaveLength(3);
  expect(runtime.previewSkill).toBeTypeOf('function');
  expect(runtime.resolveAction).toBeTypeOf('function');
  expect(runtime.createCommandLens).toBeTypeOf('function');
  expect(runtime.compilePresentation).toBeTypeOf('function');
  expect(runtime.createLootLayout).toBeTypeOf('function');
  expect(runtime.calculateRewards).toBeTypeOf('function');
  expect(runtime.createGuildSessionController).toBeTypeOf('function');
  expect(runtime.previewForge).toBeTypeOf('function');
  expect(runtime.GUILD_RPG_ACTION_TYPES).toHaveLength(34);

  const values = new Map();
  const controller = runtime.createGuildSessionController({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  });
  controller.dispatch({ type: 'NAVIGATE', page: 'party' });
  expect(controller.getState().page).toBe('party');
  expect(values.size).toBeGreaterThan(0);
});
