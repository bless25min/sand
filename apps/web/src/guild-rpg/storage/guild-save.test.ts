import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { createGuildProfile } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { parseGuildSave, serializeGuildSave } from './guild-save';

describe('guild save', () => {
  it('round-trips a version-two profile', () => {
    const profile = { ...createGuildProfile(GUILD_GAME_CONTENT), gold: 987 };
    expect(parseGuildSave(serializeGuildSave(profile))).toEqual(profile);
  });

  it('migrates a version-one profile without losing progress', () => {
    const current = createGuildProfile(GUILD_GAME_CONTENT);
    const legacy = JSON.stringify({
      ...current,
      version: 1,
      materials: undefined,
      selectedBuildId: undefined,
      gold: 321,
    });

    expect(parseGuildSave(legacy)).toMatchObject({
      version: 2,
      materials: {},
      selectedBuildId: 'retaliation',
      gold: 321,
    });
  });

  it.each(['', '{', 'null', '{"version":2}', '{"version":1,"party":[]}'])(
    'recovers from invalid save %s',
    (value) => {
      expect(parseGuildSave(value)).toBeUndefined();
    },
  );

  it('rejects malformed nested equipment instead of crashing the guild screen', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const malformed = JSON.stringify({
      ...profile,
      inventory: [{ id: 'broken', slot: 'helmet' }],
    });

    expect(parseGuildSave(malformed)).toBeUndefined();
  });
});
