import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../rng/seeded-random';
import { generateGreyfangLoot } from './generate-greyfang-loot';

describe('generateGreyfangLoot', () => {
  it('generates deterministic positioned pelt, fang, and horn plate drops', () => {
    const input = {
      sourceId: 'greyfang-pack-1',
      defeatedWolves: 20,
      defeatedHornedAlphas: 1,
      position: { x: 12, y: 8 },
    } as const;
    const first = generateGreyfangLoot({
      ...input,
      random: createSeededRandom('loot-seed'),
    });
    const replay = generateGreyfangLoot({
      ...input,
      random: createSeededRandom('loot-seed'),
    });

    expect(replay).toEqual(first);
    expect(first.map((drop) => drop.materialId)).toEqual([
      'WOLF_PELT',
      'MONSTER_FANG',
      'HORN_PLATE',
    ]);
    expect(first.every((drop) => drop.quantity > 0)).toBe(true);
    expect(
      first.every(
        (drop) =>
          Math.hypot(drop.position.x - input.position.x, drop.position.y - input.position.y) <= 2,
      ),
    ).toBe(true);
  });

  it('omits horn plate when no horned alpha was defeated', () => {
    const drops = generateGreyfangLoot({
      sourceId: 'greyfang-pack-1',
      defeatedWolves: 8,
      defeatedHornedAlphas: 0,
      position: { x: 0, y: 0 },
      random: createSeededRandom('no-alpha'),
    });

    expect(drops.some((drop) => drop.materialId === 'HORN_PLATE')).toBe(false);
  });

  it('rejects fractional defeated counts', () => {
    expect(() =>
      generateGreyfangLoot({
        sourceId: 'greyfang-pack-1',
        defeatedWolves: 1.5,
        defeatedHornedAlphas: 0,
        position: { x: 0, y: 0 },
        random: createSeededRandom('invalid'),
      }),
    ).toThrow('defeatedWolves');
  });
});
