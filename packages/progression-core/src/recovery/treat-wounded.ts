import type { GrowthEvent, UnitState } from '@expedition/shared-types';

export interface TreatWoundedInput {
  readonly unit: UnitState;
  readonly treatmentCapacity: number;
  readonly eventId: string;
}

export type TreatWoundedResult =
  | {
      readonly ok: true;
      readonly unit: UnitState;
      readonly treatedCount: number;
      readonly remainingWoundedCount: number;
      readonly event: GrowthEvent | undefined;
    }
  | {
      readonly ok: false;
      readonly reason: 'INVALID_TREATMENT_CAPACITY';
      readonly unit: UnitState;
    };

export function treatWounded(input: TreatWoundedInput): TreatWoundedResult {
  if (!Number.isFinite(input.treatmentCapacity) || input.treatmentCapacity < 0 || !Number.isInteger(input.treatmentCapacity)) {
    return { ok: false, reason: 'INVALID_TREATMENT_CAPACITY', unit: input.unit };
  }

  const availableActiveSlots = Math.max(0, input.unit.initialTroopCount - input.unit.troopCount);
  const treatedCount = Math.min(input.unit.woundedCount, input.treatmentCapacity, availableActiveSlots);
  const remainingWoundedCount = input.unit.woundedCount - treatedCount;
  const unit = {
    ...input.unit,
    troopCount: input.unit.troopCount + treatedCount,
    woundedCount: remainingWoundedCount,
  };

  return {
    ok: true,
    unit,
    treatedCount,
    remainingWoundedCount,
    event:
      treatedCount === 0
        ? undefined
        : {
            id: input.eventId,
            unitId: input.unit.id,
            type: 'WOUNDED_TREATED',
            causes: [input.unit.id],
            effects: { treatedCount, remainingWoundedCount },
          },
  };
}
