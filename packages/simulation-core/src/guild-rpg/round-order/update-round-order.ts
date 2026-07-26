import type { RoundOrder } from '@expedition/shared-types';

export function resetCurrentRoundOrder(
  order: RoundOrder,
  livingAdventurerIds: readonly string[],
): RoundOrder {
  const acted = order.currentOrder.filter((id) => order.actedIds.includes(id));
  const remaining = order.defaultOrder.filter(
    (id) => !order.actedIds.includes(id) && livingAdventurerIds.includes(id),
  );
  const defeated = order.defaultOrder.filter(
    (id) => !order.actedIds.includes(id) && !livingAdventurerIds.includes(id),
  );
  return {
    ...order,
    currentOrder: [...acted, ...remaining, ...defeated],
    carryCurrentOrder: false,
    ...(remaining[0] ? { activeAdventurerId: remaining[0] } : {}),
  };
}

export function setRoundOrderCarry(order: RoundOrder, carryCurrentOrder: boolean): RoundOrder {
  return { ...order, carryCurrentOrder };
}
