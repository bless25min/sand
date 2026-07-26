import type { RoundOrder } from '@expedition/shared-types';

export function createRoundOrder(defaultOrder: readonly string[]): RoundOrder {
  if (defaultOrder.length !== 6 || new Set(defaultOrder).size !== 6) {
    throw new Error('Round order requires six distinct adventurers.');
  }
  return {
    defaultOrder: [...defaultOrder],
    currentOrder: [...defaultOrder],
    actedIds: [],
    activeAdventurerId: defaultOrder[0]!,
    carryCurrentOrder: false,
  };
}
