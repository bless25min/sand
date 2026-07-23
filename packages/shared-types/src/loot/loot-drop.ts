import type { ItemRarity } from '../items/item-rarity';
import type { MaterialId } from '../items/material-id';
import type { Vec2 } from '../primitives/vec2';

export interface LootDrop {
  readonly id: string;
  readonly materialId: MaterialId;
  readonly quantity: number;
  readonly rarity: ItemRarity;
  readonly sourceId: string;
  readonly position: Vec2;
}
