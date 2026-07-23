import { EXPERIENCE_RULES } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { calculateExperienceAwards } from './calculate-experience-awards';

describe('calculateExperienceAwards', () => {
  it('groups repeated reasons and caps the settlement total', () => {
    const result = calculateExperienceAwards({
      awards: [
        { reason: 'MONSTER_DEFEATED', quantity: 3, evidenceIds: ['wolf-a'] },
        { reason: 'MONSTER_DEFEATED', quantity: 4, evidenceIds: ['wolf-b'] },
        { reason: 'BATTLE_PARTICIPATION', quantity: 1, evidenceIds: ['battle-1'] },
      ],
      rules: EXPERIENCE_RULES,
    });

    expect(result).toEqual({
      ok: true,
      totalExperience: 90,
      details: [
        {
          reason: 'MONSTER_DEFEATED',
          quantity: 7,
          awardedExperience: 50,
          evidenceIds: ['wolf-a', 'wolf-b'],
        },
        {
          reason: 'BATTLE_PARTICIPATION',
          quantity: 1,
          awardedExperience: 40,
          evidenceIds: ['battle-1'],
        },
      ],
    });
  });

  it.each([
    [{ reason: 'COMMAND_COMPLETED', quantity: 0, evidenceIds: ['command-1'] }, 'INVALID_QUANTITY'],
    [
      { reason: 'COMMAND_COMPLETED', quantity: 1.5, evidenceIds: ['command-1'] },
      'INVALID_QUANTITY',
    ],
    [{ reason: 'COMMAND_COMPLETED', quantity: 1, evidenceIds: [] }, 'MISSING_EVIDENCE'],
  ] as const)('rejects invalid award %j atomically', (award, reason) => {
    expect(calculateExperienceAwards({ awards: [award], rules: EXPERIENCE_RULES })).toEqual({
      ok: false,
      reason,
      awardIndex: 0,
    });
  });

  it('returns the award index when an experience rule is missing', () => {
    expect(
      calculateExperienceAwards({
        awards: [
          {
            reason: 'COMMAND_COMPLETED',
            quantity: 1,
            evidenceIds: ['command-1'],
          },
        ],
        rules: {},
      }),
    ).toEqual({
      ok: false,
      reason: 'MISSING_EXPERIENCE_RULE',
      awardIndex: 0,
    });
  });
});
