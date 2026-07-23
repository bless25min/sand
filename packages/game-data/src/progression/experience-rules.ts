import type { ExperienceReason, ExperienceRule } from '@expedition/shared-types';

export const EXPERIENCE_RULES: Readonly<Record<ExperienceReason, ExperienceRule>> = {
  BATTLE_PARTICIPATION: { experiencePerOccurrence: 40, settlementCap: 40 },
  COMMAND_COMPLETED: { experiencePerOccurrence: 20, settlementCap: 40 },
  FORMATION_HELD: { experiencePerOccurrence: 25, settlementCap: 25 },
  ALLY_PROTECTED: { experiencePerOccurrence: 25, settlementCap: 25 },
  MONSTER_DEFEATED: { experiencePerOccurrence: 10, settlementCap: 50 },
  BREAKTHROUGH_COMPLETED: { experiencePerOccurrence: 30, settlementCap: 30 },
  ROUT_SURVIVED: { experiencePerOccurrence: 20, settlementCap: 20 },
  UNKNOWN_NODE_EXPLORED: { experiencePerOccurrence: 50, settlementCap: 50 },
};
