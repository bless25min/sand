import type { InventoryStack, InventoryState, RetreatOutcome } from '@expedition/shared-types';

export interface ApplyRetreatLossInput {
  readonly inventory: InventoryState;
  readonly outcome: RetreatOutcome;
}

export interface RetreatLossResult {
  readonly inventory: InventoryState;
  readonly lostStacks: readonly InventoryStack[];
}

const LOSS_RATIOS: Readonly<Record<RetreatOutcome, number>> = {
  NORMAL: 0,
  EMERGENCY: 0.5,
  ROUT: 0.8,
};

export function applyRetreatLoss(input: ApplyRetreatLossInput): RetreatLossResult {
  const ratio = LOSS_RATIOS[input.outcome];
  const lostStacks: InventoryStack[] = [];
  const retainedStacks: InventoryStack[] = [];

  for (const stack of input.inventory.stacks) {
    const lostQuantity = Math.floor(stack.quantity * ratio);
    const retainedQuantity = stack.quantity - lostQuantity;

    if (lostQuantity > 0) {
      lostStacks.push({
        materialId: stack.materialId,
        quantity: lostQuantity,
      });
    }

    if (retainedQuantity > 0) {
      retainedStacks.push({
        materialId: stack.materialId,
        quantity: retainedQuantity,
      });
    }
  }

  return {
    inventory: {
      ...input.inventory,
      stacks: retainedStacks,
      equipment: [...input.inventory.equipment],
    },
    lostStacks,
  };
}
