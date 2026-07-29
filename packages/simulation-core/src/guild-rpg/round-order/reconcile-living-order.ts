import type { RoundOrder } from '@expedition/shared-types';

export function reconcileLivingOrder(
  order: RoundOrder,
  livingAdventurerIds: readonly string[],
): RoundOrder {
  const living = new Set(livingAdventurerIds);
  const defaultOrder = order.defaultOrder.filter((id) => living.has(id));
  const currentOrder = order.currentOrder.filter((id) => living.has(id));
  const actedIds = order.actedIds.filter((id) => living.has(id));
  const nextId = currentOrder.find((id) => !actedIds.includes(id));

  if (nextId) {
    return { ...order, defaultOrder, currentOrder, actedIds, activeAdventurerId: nextId };
  }

  const nextRound = (order.carryCurrentOrder ? currentOrder : defaultOrder).filter((id) =>
    living.has(id),
  );
  return {
    ...order,
    defaultOrder,
    currentOrder: nextRound,
    actedIds: [],
    activeAdventurerId: nextRound[0] ?? '',
  };
}
