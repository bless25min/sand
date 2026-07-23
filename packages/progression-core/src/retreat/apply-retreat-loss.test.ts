import type { InventoryState, RetreatOutcome } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { applyRetreatLoss } from './apply-retreat-loss';

const INVENTORY: InventoryState = {
  capacityWeight: 30,
  stacks: [
    { materialId: 'WOLF_PELT', quantity: 10 },
    { materialId: 'MONSTER_FANG', quantity: 10 },
    { materialId: 'HORN_PLATE', quantity: 5 },
  ],
  equipment: [],
};

function remainingQuantity(outcome: RetreatOutcome): number {
  return applyRetreatLoss({ inventory: INVENTORY, outcome }).inventory.stacks.reduce(
    (total, stack) => total + stack.quantity,
    0,
  );
}

describe('applyRetreatLoss', () => {
  it('keeps normal retreat inventory intact without mutating it', () => {
    const result = applyRetreatLoss({ inventory: INVENTORY, outcome: 'NORMAL' });

    expect(result.inventory).toEqual(INVENTORY);
    expect(result.lostStacks).toEqual([]);
    expect(result.inventory).not.toBe(INVENTORY);
  });

  it('loses progressively more material for emergency retreat and rout', () => {
    expect(remainingQuantity('NORMAL')).toBeGreaterThan(remainingQuantity('EMERGENCY'));
    expect(remainingQuantity('EMERGENCY')).toBeGreaterThan(remainingQuantity('ROUT'));
  });
});
