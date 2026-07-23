import type { InventoryState, MaterialDefinition, MaterialId } from '@expedition/shared-types';

export interface CalculateInventoryWeightInput {
  readonly inventory: InventoryState;
  readonly materialDefinitions: readonly MaterialDefinition[];
}

function unitWeight(
  materialDefinitions: readonly MaterialDefinition[],
  materialId: MaterialId,
): number {
  const definition = materialDefinitions.find((material) => material.id === materialId);

  if (definition === undefined) {
    throw new RangeError(`unknown material ${materialId}`);
  }

  return definition.unitWeight;
}

export function calculateInventoryWeight(input: CalculateInventoryWeightInput): number {
  return input.inventory.stacks.reduce(
    (total, stack) =>
      total + unitWeight(input.materialDefinitions, stack.materialId) * stack.quantity,
    0,
  );
}
