import { HORNPLATE_SHIELD_RECIPE } from '@expedition/game-data';
import type { InventoryState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { craftEquipment } from './craft-equipment';

const CRAFTING_INVENTORY: InventoryState = {
  capacityWeight: 30,
  stacks: [
    { materialId: 'WOLF_PELT', quantity: 6 },
    { materialId: 'MONSTER_FANG', quantity: 8 },
    { materialId: 'HORN_PLATE', quantity: 2 },
  ],
  equipment: [],
};

describe('craftEquipment', () => {
  it('consumes the exact recipe and adds one equipment instance', () => {
    const result = craftEquipment({
      inventory: CRAFTING_INVENTORY,
      recipe: HORNPLATE_SHIELD_RECIPE,
      equipmentInstanceId: 'equipment-hornplate-1',
    });

    expect(result.inventory.stacks).toEqual([
      { materialId: 'WOLF_PELT', quantity: 2 },
      { materialId: 'MONSTER_FANG', quantity: 2 },
    ]);
    expect(result.inventory.equipment).toEqual([
      {
        id: 'equipment-hornplate-1',
        definitionId: 'hornplate-heavy-shield',
      },
    ]);
    expect(CRAFTING_INVENTORY.stacks[0]?.quantity).toBe(6);
  });

  it('rejects insufficient material without mutating input', () => {
    const insufficient: InventoryState = {
      ...CRAFTING_INVENTORY,
      stacks: [{ materialId: 'WOLF_PELT', quantity: 1 }],
    };

    expect(() =>
      craftEquipment({
        inventory: insufficient,
        recipe: HORNPLATE_SHIELD_RECIPE,
        equipmentInstanceId: 'equipment-hornplate-1',
      }),
    ).toThrow('insufficient');
    expect(insufficient.stacks).toEqual([{ materialId: 'WOLF_PELT', quantity: 1 }]);
  });
});
