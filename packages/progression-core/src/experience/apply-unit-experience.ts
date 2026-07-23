import type { GrowthEvent, UnitState } from '@expedition/shared-types';

import type { ExperienceCalculationResult } from './calculate-experience-awards';

export interface ApplyUnitExperienceInput {
  readonly unit: UnitState;
  readonly calculation: Extract<ExperienceCalculationResult, { readonly ok: true }>;
  readonly eventId: string;
}

export interface ApplyUnitExperienceResult {
  readonly unit: UnitState;
  readonly levelsGained: number;
  readonly events: readonly GrowthEvent[];
}

export function applyUnitExperience(input: ApplyUnitExperienceInput): ApplyUnitExperienceResult {
  const causes = uniqueEvidenceIds(input.calculation);
  let level = input.unit.level;
  let experience = input.unit.experience + input.calculation.totalExperience;
  const events: GrowthEvent[] = [];

  if (input.calculation.totalExperience > 0) {
    events.push({
      id: input.eventId,
      unitId: input.unit.id,
      type: 'EXPERIENCE_AWARDED',
      causes,
      effects: { experience: input.calculation.totalExperience },
    });
  }

  while (experience >= level * 100) {
    experience -= level * 100;
    level += 1;
    events.push({
      id: `${input.eventId}:level:${level}`,
      unitId: input.unit.id,
      type: 'LEVEL_GAINED',
      causes,
      effects: { level },
    });
  }

  return {
    unit: { ...input.unit, level, experience },
    levelsGained: level - input.unit.level,
    events,
  };
}

function uniqueEvidenceIds(
  calculation: Extract<ExperienceCalculationResult, { readonly ok: true }>,
): string[] {
  const evidenceIds = new Set<string>();
  for (const detail of calculation.details) {
    for (const evidenceId of detail.evidenceIds) {
      evidenceIds.add(evidenceId);
    }
  }

  return [...evidenceIds];
}
