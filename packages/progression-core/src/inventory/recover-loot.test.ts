import { GREYFANG_MATERIALS } from '@expedition/game-data';
import type { LootDrop } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createEmptyInventory } from './create-empty-inventory';
import { recoverLoot } from './recover-loot';

const DROPS: readonly LootDrop[] = [
  {
    id: 'loot-pelt',
    materialId: 'WOLF_PELT',
    quantity: 4,
    rarity: 'COMMON',
    sourceId: 'greyfang',
    position: { x: 1, y: 0 },
  },
  {
    id: 'loot-fang',
    materialId: 'MONSTER_FANG',
    quantity: 6,
    rarity: 'COMMON',
    sourceId: 'greyfang',
    position: { x: 2, y: 0 },
  },
  {
    id: 'loot-horn',
    materialId: 'HORN_PLATE',
    quantity: 2,
    rarity: 'FINE',
    sourceId: 'greyfang',
    position: { x: 20, y: 0 },
  },
];

describe('recoverLoot', () => {
  it('collects reachable drops into a new inventory and leaves distant drops positioned', () => {
    const inventory = createEmptyInventory(10);
    const result = recoverLoot({
      inventory,
      drops: DROPS,
      recoveryPosition: { x: 0, y: 0 },
      recoveryRadius: 4,
      materialDefinitions: GREYFANG_MATERIALS,
    });

    expect(result.inventory.stacks).toEqual([
      { materialId: 'WOLF_PELT', quantity: 4 },
      { materialId: 'MONSTER_FANG', quantity: 6 },
    ]);
    expect(result.recovered).toEqual([
      { dropId: 'loot-pelt', materialId: 'WOLF_PELT', quantity: 4 },
      { dropId: 'loot-fang', materialId: 'MONSTER_FANG', quantity: 6 },
    ]);
    expect(result.remainingDrops).toEqual([DROPS[2]]);
    expect(inventory.stacks).toEqual([]);
  });

  it('partially collects a reachable drop when capacity is limited', () => {
    const result = recoverLoot({
      inventory: createEmptyInventory(1),
      drops: [DROPS[0]!],
      recoveryPosition: { x: 0, y: 0 },
      recoveryRadius: 4,
      materialDefinitions: GREYFANG_MATERIALS,
    });

    expect(result.inventory.stacks).toEqual([{ materialId: 'WOLF_PELT', quantity: 1 }]);
    expect(result.remainingDrops).toEqual([{ ...DROPS[0]!, quantity: 3 }]);
  });
});
