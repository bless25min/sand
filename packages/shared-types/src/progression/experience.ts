export type ExperienceReason =
  | 'BATTLE_PARTICIPATION'
  | 'COMMAND_COMPLETED'
  | 'FORMATION_HELD'
  | 'ALLY_PROTECTED'
  | 'MONSTER_DEFEATED'
  | 'BREAKTHROUGH_COMPLETED'
  | 'ROUT_SURVIVED'
  | 'UNKNOWN_NODE_EXPLORED';

export interface ExperienceAward {
  readonly reason: ExperienceReason;
  readonly quantity: number;
  readonly evidenceIds: readonly string[];
}

export interface ExperienceRule {
  readonly experiencePerOccurrence: number;
  readonly settlementCap: number;
}
