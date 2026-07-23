import type { GrowthEvent, UnitState } from '@expedition/shared-types';

export interface ReplenishUnitInput {
  readonly unit: UnitState;
  readonly availableRecruits: number;
  readonly eventId: string;
}

export type ReplenishUnitResult =
  | {
      readonly ok: true;
      readonly unit: UnitState;
      readonly addedCount: number;
      readonly unusedRecruitCount: number;
      readonly remainingVacancy: number;
      readonly event: GrowthEvent | undefined;
    }
  | {
      readonly ok: false;
      readonly reason: 'INVALID_RECRUIT_COUNT';
      readonly unit: UnitState;
    };

export function replenishUnit(input: ReplenishUnitInput): ReplenishUnitResult {
  if (
    !Number.isFinite(input.availableRecruits) ||
    input.availableRecruits < 0 ||
    !Number.isInteger(input.availableRecruits)
  ) {
    return { ok: false, reason: 'INVALID_RECRUIT_COUNT', unit: input.unit };
  }

  const availableVacancy = Math.max(
    0,
    input.unit.initialTroopCount - input.unit.troopCount - input.unit.woundedCount,
  );
  const addedCount = Math.min(input.availableRecruits, availableVacancy);
  const remainingVacancy = availableVacancy - addedCount;
  const unit = { ...input.unit, troopCount: input.unit.troopCount + addedCount };

  return {
    ok: true,
    unit,
    addedCount,
    unusedRecruitCount: input.availableRecruits - addedCount,
    remainingVacancy,
    event:
      addedCount === 0
        ? undefined
        : {
            id: input.eventId,
            unitId: input.unit.id,
            type: 'REINFORCEMENTS_ADDED',
            causes: [input.unit.id],
            effects: { addedCount, remainingVacancy },
          },
  };
}
