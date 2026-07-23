import type { UnitStatModifiers } from '../units/unit-stat-modifiers';

export type SkillType = 'PASSIVE' | 'TACTICAL' | 'REACTION' | 'COMMAND' | 'FIELD';

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: SkillType;
  readonly description: string;
  readonly statModifiers: UnitStatModifiers;
}
