import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { treatWounded } from './treat-wounded';

describe('treatWounded', () => {
  it('moves only treatable wounded troops back to active duty', () => {
    const unit = createUnitState({
      troopCount: 70,
      initialTroopCount: 100,
      woundedCount: 20,
      deadCount: 10,
      missingCount: 3,
    });
    const result = treatWounded({ unit, treatmentCapacity: 12, eventId: 'treatment-1' });

    expect(result).toMatchObject({
      ok: true,
      treatedCount: 12,
      remainingWoundedCount: 8,
      unit: { troopCount: 82, woundedCount: 8, deadCount: 10, missingCount: 3 },
      event: {
        id: 'treatment-1',
        unitId: 'unit-1',
        type: 'WOUNDED_TREATED',
        causes: ['unit-1'],
        effects: { treatedCount: 12, remainingWoundedCount: 8 },
      },
    });
  });

  it('returns no event when nobody can be treated', () => {
    const result = treatWounded({
      unit: createUnitState(),
      treatmentCapacity: 10,
      eventId: 'treatment-zero',
    });

    expect(result).toMatchObject({ ok: true, treatedCount: 0, event: undefined });
  });

  it('rejects a non-integer capacity without replacing the unit', () => {
    const unit = createUnitState({ woundedCount: 5 });
    const result = treatWounded({ unit, treatmentCapacity: 1.5, eventId: 'treatment-bad' });

    expect(result).toEqual({ ok: false, reason: 'INVALID_TREATMENT_CAPACITY', unit });
    if (!result.ok) expect(result.unit).toBe(unit);
  });
});
