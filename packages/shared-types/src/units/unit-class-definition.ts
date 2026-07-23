import type { UnitStatModifiers } from './unit-stat-modifiers';

export interface UnitClassDefinition {
  readonly id: string;
  readonly name: string;
  readonly sourceClassId: string;
  readonly minimumLevel: number;
  readonly skillIds: readonly string[];
  readonly passiveIds: readonly string[];
  readonly appearanceIds: readonly string[];
  readonly statModifiers: UnitStatModifiers;
}
