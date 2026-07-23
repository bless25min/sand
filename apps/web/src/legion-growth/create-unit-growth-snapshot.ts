import { EXPERIENCE_RULES, LEGION_SKILLS } from '@expedition/game-data';
import {
  applyUnitExperience,
  calculateExperienceAwards,
  promoteUnit,
  replenishUnit,
  treatWounded,
} from '@expedition/progression-core';
import type { GrowthEvent } from '@expedition/shared-types';
import { calculateLegionGrowthBattleMetrics } from './calculate-legion-growth-battle-metrics';
import type { LegionGrowthFixture } from './legion-growth-fixtures';
import type { LegionGrowthUnitSnapshot } from './legion-growth-types';

export function createUnitGrowthSnapshot(fixture: LegionGrowthFixture): LegionGrowthUnitSnapshot {
  const skillId = fixture.classDefinition.skillIds[0];
  if (skillId === undefined) {
    throw new Error(`fixed legion growth fixture has no skill ID: ${fixture.classDefinition.id}`);
  }
  const skillDefinition = LEGION_SKILLS[skillId];
  if (skillDefinition === undefined) {
    throw new Error(`fixed legion growth fixture has no skill definition: ${skillId}`);
  }

  const calculation = calculateExperienceAwards({
    awards: fixture.awards,
    rules: EXPERIENCE_RULES,
  });
  if (!calculation.ok) {
    throw new Error(`fixed experience fixture failed: ${calculation.reason}`);
  }

  const experience = applyUnitExperience({
    unit: fixture.unit,
    calculation,
    eventId: `${fixture.unit.id}:experience`,
  });
  const treatment = treatWounded({
    unit: experience.unit,
    treatmentCapacity: fixture.treatmentCapacity,
    eventId: `${fixture.unit.id}:treatment`,
  });
  if (!treatment.ok) {
    throw new Error(`fixed treatment fixture failed: ${treatment.reason}`);
  }

  const reinforcement = replenishUnit({
    unit: treatment.unit,
    availableRecruits: fixture.availableRecruits,
    eventId: `${fixture.unit.id}:reinforcement`,
  });
  if (!reinforcement.ok) {
    throw new Error(`fixed reinforcement fixture failed: ${reinforcement.reason}`);
  }

  const promotion = promoteUnit({
    unit: reinforcement.unit,
    classDefinition: fixture.classDefinition,
    skillDefinitions: LEGION_SKILLS,
    eventId: `${fixture.unit.id}:promotion`,
  });
  if (!promotion.ok) {
    throw new Error(`fixed promotion fixture failed: ${promotion.reason}`);
  }

  const events: GrowthEvent[] = [...experience.events];
  if (treatment.event !== undefined) {
    events.push(treatment.event);
  }
  if (reinforcement.event !== undefined) {
    events.push(reinforcement.event);
  }
  events.push(promotion.event);

  return {
    experienceDetails: calculation.details,
    experienceGained: calculation.totalExperience,
    levelsGained: experience.levelsGained,
    treatedCount: treatment.treatedCount,
    reinforcementCount: reinforcement.addedCount,
    className: fixture.classDefinition.name,
    skillName: skillDefinition.name,
    before: fixture.unit,
    after: promotion.unit,
    beforeMetrics: calculateLegionGrowthBattleMetrics(fixture.unit),
    afterMetrics: calculateLegionGrowthBattleMetrics(promotion.unit),
    events,
  };
}
