import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { createGuildProfile } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { parseGuildSave, serializeGuildSave } from './guild-save';

describe('guild save', () => {
  it('round-trips a version-one profile', () => {
    const profile = { ...createGuildProfile(GUILD_GAME_CONTENT), gold: 987 };
    expect(parseGuildSave(serializeGuildSave(profile))).toEqual(profile);
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
