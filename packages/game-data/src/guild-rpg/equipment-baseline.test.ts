import { describe, expect, it } from 'vitest';

import { GUILD_GAME_CONTENT } from './index';

describe('guild equipment baseline', () => {
  it('keeps every authored attack weapon in the single-digit foundation range', () => {
    const baseWeapons = GUILD_GAME_CONTENT.equipmentBases.filter(
      ({ slot, mainStat }) => slot === 'weapon' && mainStat === 'attack',
    );
    const huntWeapons = GUILD_GAME_CONTENT.hunts
      .flatMap((hunt) => [
        ...hunt.enemies.flatMap(({ equipment }) => equipment),
        ...(hunt.annihilationChest ? [hunt.annihilationChest] : []),
      ])
      .filter(({ slot, mainStat }) => slot === 'weapon' && mainStat === 'attack');

    expect(baseWeapons.length).toBeGreaterThan(0);
    expect(huntWeapons.length).toBeGreaterThan(0);
    expect(
      baseWeapons.every(({ baseValue, mainStatRoll }) => baseValue <= 9 && mainStatRoll.max <= 9),
    ).toBe(true);
    expect(huntWeapons.every(({ baseValue }) => baseValue >= 1 && baseValue <= 9)).toBe(true);
  });
});
