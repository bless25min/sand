import type { RoundOrder } from '@expedition/shared-types';

export function chooseNextAdventurer(
  order: RoundOrder,
  adventurerId: string,
  livingAdventurerIds: readonly string[],
): RoundOrder {
  if (!livingAdventurerIds.includes(adventurerId)) {
    throw new Error(`Adventurer is not living: ${adventurerId}`);
  }
  if (order.actedIds.includes(adventurerId)) {
    throw new Error(`Adventurer already acted: ${adventurerId}`);
  }

  const nextIndex = order.actedIds.length;
  const currentIndex = order.currentOrder.indexOf(adventurerId);
  if (currentIndex < 0) throw new Error(`Adventurer is not in round order: ${adventurerId}`);
  const currentOrder = [...order.currentOrder];
  currentOrder.splice(currentIndex, 1);
  currentOrder.splice(nextIndex, 0, adventurerId);

  return {
    ...order,
    currentOrder,
    activeAdventurerId: adventurerId,
  };
}
