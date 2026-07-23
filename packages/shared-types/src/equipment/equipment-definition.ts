import type { UnitType } from '../units/unit-state';

export type EquipmentSlot = 'ARMOR' | 'WEAPON' | 'SHIELD' | 'BANNER' | 'MARCH_GEAR';

export interface EquipmentDefinition {
  readonly id: string;
  readonly name: string;
  readonly slot: EquipmentSlot;
  readonly allowedUnitTypes: readonly UnitType[];
  readonly weight: number;
  readonly frontalDefenseBonus: number;
  readonly mobilityMultiplier: number;
  readonly fatigueModifier: number;
  readonly appearanceId: string;
  readonly tags: readonly string[];
}
