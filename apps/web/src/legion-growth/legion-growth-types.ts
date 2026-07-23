import type { ExperienceAwardDetail } from '@expedition/progression-core';
import type { GrowthEvent, UnitState } from '@expedition/shared-types';

export interface LegionGrowthBattleMetrics {
  readonly attackingPressure: number;
  readonly defendingPressure: number;
  readonly distanceMoved: number;
}

export interface LegionGrowthUnitSnapshot {
  readonly experienceDetails: readonly ExperienceAwardDetail[];
  readonly experienceGained: number;
  readonly levelsGained: number;
  readonly treatedCount: number;
  readonly reinforcementCount: number;
  readonly className: string;
  readonly skillName: string;
  readonly before: UnitState;
  readonly after: UnitState;
  readonly beforeMetrics: LegionGrowthBattleMetrics;
  readonly afterMetrics: LegionGrowthBattleMetrics;
  readonly events: readonly GrowthEvent[];
}

export interface LegionGrowthSnapshot {
  readonly units: readonly [LegionGrowthUnitSnapshot, LegionGrowthUnitSnapshot];
}
