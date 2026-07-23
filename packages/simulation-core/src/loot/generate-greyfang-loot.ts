import type { ItemRarity, LootDrop, MaterialId, Vec2 } from '@expedition/shared-types';

import type { RandomSource } from '../rng/random-source';

export interface GenerateGreyfangLootInput {
  readonly sourceId: string;
  readonly defeatedWolves: number;
  readonly defeatedHornedAlphas: number;
  readonly position: Vec2;
  readonly random: RandomSource;
}

interface DropQuantity {
  readonly materialId: MaterialId;
  readonly quantity: number;
  readonly rarity: ItemRarity;
}

const DROP_RADIUS = 2;

function assertCount(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

function jitterPosition(position: Vec2, random: RandomSource): Vec2 {
  const angle = random.next() * Math.PI * 2;
  const radius = Math.sqrt(random.next()) * DROP_RADIUS;

  return {
    x: position.x + Math.cos(angle) * radius,
    y: position.y + Math.sin(angle) * radius,
  };
}

function createQuantities(input: GenerateGreyfangLootInput): DropQuantity[] {
  const peltBonusMaximum = Math.floor(input.defeatedWolves * 0.25);
  const fangBonusMaximum = Math.floor(input.defeatedWolves * 0.3);
  const quantities: DropQuantity[] = [];

  if (input.defeatedWolves > 0) {
    quantities.push(
      {
        materialId: 'WOLF_PELT',
        quantity:
          Math.floor(input.defeatedWolves * 0.5) + input.random.nextInt(0, peltBonusMaximum),
        rarity: 'COMMON',
      },
      {
        materialId: 'MONSTER_FANG',
        quantity:
          Math.floor(input.defeatedWolves * 0.4) + input.random.nextInt(0, fangBonusMaximum),
        rarity: 'COMMON',
      },
    );
  }

  if (input.defeatedHornedAlphas > 0) {
    quantities.push({
      materialId: 'HORN_PLATE',
      quantity: input.defeatedHornedAlphas * 2,
      rarity: 'FINE',
    });
  }

  return quantities.filter((drop) => drop.quantity > 0);
}

export function generateGreyfangLoot(input: GenerateGreyfangLootInput): LootDrop[] {
  assertCount(input.defeatedWolves, 'defeatedWolves');
  assertCount(input.defeatedHornedAlphas, 'defeatedHornedAlphas');

  if (!Number.isFinite(input.position.x) || !Number.isFinite(input.position.y)) {
    throw new RangeError('position must contain finite coordinates');
  }

  return createQuantities(input).map((drop) => ({
    id: `loot-${input.sourceId}-${drop.materialId.toLowerCase()}`,
    materialId: drop.materialId,
    quantity: drop.quantity,
    rarity: drop.rarity,
    sourceId: input.sourceId,
    position: jitterPosition(input.position, input.random),
  }));
}
