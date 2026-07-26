import type { RoundOrder } from '@expedition/shared-types';

export function completeTurn(order: RoundOrder, adventurerId: string): RoundOrder {
  if (order.activeAdventurerId !== adventurerId) {
    throw new Error(`It is not ${adventurerId}'s turn.`);
  }
  if (order.actedIds.includes(adventurerId)) {
    throw new Error(`Adventurer already acted: ${adventurerId}`);
  }

  const actedIds = [...order.actedIds, adventurerId];
  if (actedIds.length === order.currentOrder.length) {
    const currentOrder = order.carryCurrentOrder
      ? [...order.currentOrder]
      : [...order.defaultOrder];
    return {
      ...order,
      currentOrder,
      actedIds: [],
      activeAdventurerId: currentOrder[0]!,
    };
  }

  const nextId = order.currentOrder.find((id) => !actedIds.includes(id));
  return {
    ...order,
    actedIds,
    ...(nextId ? { activeAdventurerId: nextId } : {}),
  };
}
