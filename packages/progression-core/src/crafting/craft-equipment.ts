import type {
  CraftingRecipe,
  EquipmentInstance,
  InventoryStack,
  InventoryState,
  MaterialId,
} from '@expedition/shared-types';

export interface CraftEquipmentInput {
  readonly inventory: InventoryState;
  readonly recipe: CraftingRecipe;
  readonly equipmentInstanceId: string;
}

export interface CraftEquipmentResult {
  readonly inventory: InventoryState;
  readonly equipmentInstance: EquipmentInstance;
}

function stackQuantity(stacks: readonly InventoryStack[], materialId: MaterialId): number {
  return stacks.find((stack) => stack.materialId === materialId)?.quantity ?? 0;
}

export function craftEquipment(input: CraftEquipmentInput): CraftEquipmentResult {
  if (input.inventory.equipment.some((equipment) => equipment.id === input.equipmentInstanceId)) {
    throw new RangeError(`equipment instance ${input.equipmentInstanceId} already exists`);
  }

  for (const ingredient of input.recipe.ingredients) {
    if (!Number.isInteger(ingredient.quantity) || ingredient.quantity <= 0) {
      throw new RangeError(
        `recipe ingredient ${ingredient.materialId} quantity must be a positive integer`,
      );
    }

    if (stackQuantity(input.inventory.stacks, ingredient.materialId) < ingredient.quantity) {
      throw new RangeError(`insufficient ${ingredient.materialId}`);
    }
  }

  const requiredByMaterial = new Map(
    input.recipe.ingredients.map((ingredient) => [ingredient.materialId, ingredient.quantity]),
  );
  const stacks = input.inventory.stacks
    .map((stack) => ({
      ...stack,
      quantity: stack.quantity - (requiredByMaterial.get(stack.materialId) ?? 0),
    }))
    .filter((stack) => stack.quantity > 0);
  const equipmentInstance: EquipmentInstance = {
    id: input.equipmentInstanceId,
    definitionId: input.recipe.outputEquipmentDefinitionId,
  };

  return {
    inventory: {
      ...input.inventory,
      stacks,
      equipment: [...input.inventory.equipment, equipmentInstance],
    },
    equipmentInstance,
  };
}
