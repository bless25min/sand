import type {
  InventoryStack,
  InventoryState,
  LootDrop,
  MaterialDefinition,
  MaterialId,
  Vec2,
} from '@expedition/shared-types';

import { calculateInventoryWeight } from './calculate-inventory-weight';

export interface RecoverLootInput {
  readonly inventory: InventoryState;
  readonly drops: readonly LootDrop[];
  readonly recoveryPosition: Vec2;
  readonly recoveryRadius: number;
  readonly materialDefinitions: readonly MaterialDefinition[];
}

export interface RecoveredLoot {
  readonly dropId: string;
  readonly materialId: MaterialId;
  readonly quantity: number;
}

export interface RecoverLootResult {
  readonly inventory: InventoryState;
  readonly recovered: readonly RecoveredLoot[];
  readonly remainingDrops: readonly LootDrop[];
}

function addStack(
  stacks: readonly InventoryStack[],
  materialId: MaterialId,
  quantity: number,
): InventoryStack[] {
  const existing = stacks.find((stack) => stack.materialId === materialId);

  if (existing === undefined) {
    return [...stacks, { materialId, quantity }];
  }

  return stacks.map((stack) =>
    stack.materialId === materialId ? { ...stack, quantity: stack.quantity + quantity } : stack,
  );
}

function distance(first: Vec2, second: Vec2): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getMaterialDefinition(
  materialDefinitions: readonly MaterialDefinition[],
  materialId: MaterialId,
): MaterialDefinition {
  const definition = materialDefinitions.find((material) => material.id === materialId);

  if (definition === undefined) {
    throw new RangeError(`unknown material ${materialId}`);
  }

  return definition;
}

export function recoverLoot(input: RecoverLootInput): RecoverLootResult {
  if (!Number.isFinite(input.recoveryRadius) || input.recoveryRadius < 0) {
    throw new RangeError('recoveryRadius must be a non-negative finite number');
  }

  let stacks = [...input.inventory.stacks];
  let currentWeight = calculateInventoryWeight({
    inventory: input.inventory,
    materialDefinitions: input.materialDefinitions,
  });
  const recovered: RecoveredLoot[] = [];
  const remainingDrops: LootDrop[] = [];

  for (const drop of input.drops) {
    if (!Number.isInteger(drop.quantity) || drop.quantity <= 0) {
      throw new RangeError(`drop ${drop.id} quantity must be a positive integer`);
    }

    if (distance(drop.position, input.recoveryPosition) > input.recoveryRadius) {
      remainingDrops.push(drop);
      continue;
    }

    const unitWeight = getMaterialDefinition(input.materialDefinitions, drop.materialId).unitWeight;
    const availableWeight = Math.max(0, input.inventory.capacityWeight - currentWeight);
    const recoverableQuantity = Math.min(
      drop.quantity,
      Math.floor((availableWeight + Number.EPSILON) / unitWeight),
    );

    if (recoverableQuantity === 0) {
      remainingDrops.push(drop);
      continue;
    }

    stacks = addStack(stacks, drop.materialId, recoverableQuantity);
    currentWeight += recoverableQuantity * unitWeight;
    recovered.push({
      dropId: drop.id,
      materialId: drop.materialId,
      quantity: recoverableQuantity,
    });

    if (recoverableQuantity < drop.quantity) {
      remainingDrops.push({
        ...drop,
        quantity: drop.quantity - recoverableQuantity,
      });
    }
  }

  return {
    inventory: {
      ...input.inventory,
      stacks,
    },
    recovered,
    remainingDrops,
  };
}
