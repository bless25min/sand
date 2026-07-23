import type { InventoryState } from '@expedition/shared-types';

export function createEmptyInventory(capacityWeight: number): InventoryState {
  if (!Number.isFinite(capacityWeight) || capacityWeight < 0) {
    throw new RangeError('capacityWeight must be a non-negative finite number');
  }

  return {
    capacityWeight,
    stacks: [],
    equipment: [],
  };
}
