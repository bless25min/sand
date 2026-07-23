import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { applyUnitExperience } from './apply-unit-experience';

describe('applyUnitExperience', () => {
  it('levels once and preserves overflow with traceable events', () => {
    const unit = createUnitState({ level: 1, experience: 80 });

    const result = applyUnitExperience({
      unit,
      calculation: {
        ok: true,
        totalExperience: 65,
        details: [
          {
            reason: 'FORMATION_HELD',
            quantity: 1,
            awardedExperience: 25,
            evidenceIds: ['formation-1'],
          },
          {
            reason: 'BATTLE_PARTICIPATION',
            quantity: 1,
            awardedExperience: 40,
            evidenceIds: ['battle-1'],
          },
        ],
      },
      eventId: 'growth-infantry',
    });

    expect(result.unit).toMatchObject({ level: 2, experience: 45 });
    expect(result.levelsGained).toBe(1);
    expect(result.events.map((event) => event.id)).toEqual([
      'growth-infantry',
      'growth-infantry:level:2',
    ]);
    expect(result.events[0]?.causes).toEqual(['formation-1', 'battle-1']);
    expect(unit).toMatchObject({ level: 1, experience: 80 });
  });

  it('can cross multiple level thresholds', () => {
    const result = applyUnitExperience({
      unit: createUnitState({ level: 1, experience: 0 }),
      calculation: { ok: true, totalExperience: 350, details: [] },
      eventId: 'growth-multi',
    });

    expect(result.unit).toMatchObject({ level: 3, experience: 50 });
    expect(result.levelsGained).toBe(2);
    expect(result.events.map((event) => event.id)).toEqual([
      'growth-multi',
      'growth-multi:level:2',
      'growth-multi:level:3',
    ]);
  });

  it('does not emit an award event when no experience is gained', () => {
    const result = applyUnitExperience({
      unit: createUnitState({ level: 1, experience: 99 }),
      calculation: { ok: true, totalExperience: 0, details: [] },
      eventId: 'growth-none',
    });

    expect(result.unit).toMatchObject({ level: 1, experience: 99 });
    expect(result.levelsGained).toBe(0);
    expect(result.events).toEqual([]);
  });
});
