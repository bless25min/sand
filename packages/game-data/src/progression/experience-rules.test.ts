import { describe, expect, it } from 'vitest';

import { EXPERIENCE_RULES } from './experience-rules';

describe('EXPERIENCE_RULES', () => {
  it('defines every Phase 5 reward and settlement cap', () => {
    expect(EXPERIENCE_RULES).toEqual({
      BATTLE_PARTICIPATION: { experiencePerOccurrence: 40, settlementCap: 40 },
      COMMAND_COMPLETED: { experiencePerOccurrence: 20, settlementCap: 40 },
      FORMATION_HELD: { experiencePerOccurrence: 25, settlementCap: 25 },
      ALLY_PROTECTED: { experiencePerOccurrence: 25, settlementCap: 25 },
      MONSTER_DEFEATED: { experiencePerOccurrence: 10, settlementCap: 50 },
      BREAKTHROUGH_COMPLETED: { experiencePerOccurrence: 30, settlementCap: 30 },
      ROUT_SURVIVED: { experiencePerOccurrence: 20, settlementCap: 20 },
      UNKNOWN_NODE_EXPLORED: { experiencePerOccurrence: 50, settlementCap: 50 },
    });
  });
});
