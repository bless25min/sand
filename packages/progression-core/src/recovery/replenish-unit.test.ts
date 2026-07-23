import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { replenishUnit } from './replenish-unit';

describe('replenishUnit', () => {
  it('keeps wounded formation slots reserved', () => {
    const result = replenishUnit({
      unit: createUnitState({ troopCount: 70, initialTroopCount: 100, woundedCount: 20 }),
      availableRecruits: 15,
      eventId: 'recruits-1',
    });

    expect(result).toMatchObject({
      ok: true,
      addedCount: 10,
      unusedRecruitCount: 5,
      remainingVacancy: 0,
      unit: { troopCount: 80, woundedCount: 20 },
      event: { id: 'recruits-1', type: 'REINFORCEMENTS_ADDED' },
    });
  });

  it('does not create an event for a full formation', () => {
    const result = replenishUnit({
      unit: createUnitState(),
      availableRecruits: 5,
      eventId: 'recruits-zero',
    });

    expect(result).toMatchObject({
      ok: true,
      addedCount: 0,
      unusedRecruitCount: 5,
      event: undefined,
    });
  });

  it.each([-1, 1.5, Number.POSITIVE_INFINITY])(
    'rejects invalid recruit counts atomically (%s)',
    (availableRecruits) => {
      const unit = createUnitState({ troopCount: 90 });
      const result = replenishUnit({ unit, availableRecruits, eventId: 'recruits-bad' });

      expect(result).toEqual({ ok: false, reason: 'INVALID_RECRUIT_COUNT', unit });
      if (!result.ok) expect(result.unit).toBe(unit);
    },
  );
});
