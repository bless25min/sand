export const CORE_RESOURCE_IDS = ['PROGRESS', 'INTEGRITY', 'INSTABILITY', 'CREDITS'] as const;
export const MODULE_ROLE_IDS = [
  'PRODUCER',
  'AMPLIFIER',
  'STABILIZER',
  'DEFENSE',
  'CONVERTER',
] as const;
export const MODULE_TRIGGER_IDS = [
  'ROUND_START',
  'FIXED_TIME',
  'ADJACENT_TRIGGER',
  'DAMAGED',
  'DISABLED',
  'RESOURCE_THRESHOLD',
] as const;
export const MODULE_EFFECT_IDS = [
  'ADD_PROGRESS',
  'DAMAGE_THREAT',
  'REPAIR_INTEGRITY',
  'ADD_INSTABILITY',
  'REDUCE_INSTABILITY',
  'SPEED_UP',
  'AMPLIFY_NEXT',
  'CONVERT',
  'PROTECT',
  'DISABLE',
  'REVIVE',
] as const;
export const MODULE_TARGET_IDS = ['SELF', 'ADJACENT', 'LEFT', 'RIGHT', 'ROW', 'ALL'] as const;
export const WORLD_RULE_IDS = [
  'ADJACENCY_SURGE',
  'HIGH_INSTABILITY_BONUS',
  'LOW_INTEGRITY_BONUS',
  'EDGE_CREDIT',
  'CHAIN_MOMENTUM',
  'BALANCED_GRID',
] as const;
export const THREAT_KIND_IDS = ['NORMAL', 'ELITE', 'BOSS'] as const;
export const THREAT_MODIFIER_IDS = [
  'NONE',
  'BLOCK_EDGE',
  'OVERLOAD',
  'COUNTER_ROLE',
  'LOCK_TOP_OUTPUT',
  'REVERSE_HORIZONTAL',
  'PUNISH_REPEAT',
] as const;

export type CoreResourceId = (typeof CORE_RESOURCE_IDS)[number];
export type ModuleRoleId = (typeof MODULE_ROLE_IDS)[number];
export type ModuleTriggerId = (typeof MODULE_TRIGGER_IDS)[number];
export type ModuleEffectId = (typeof MODULE_EFFECT_IDS)[number];
export type ModuleTargetId = (typeof MODULE_TARGET_IDS)[number];
export type WorldRuleId = (typeof WORLD_RULE_IDS)[number];
export type ThreatKindId = (typeof THREAT_KIND_IDS)[number];
export type ThreatModifierId = (typeof THREAT_MODIFIER_IDS)[number];

export const MODULE_ROLE_COUNTS: Readonly<Record<ModuleRoleId, number>> = {
  PRODUCER: 3,
  AMPLIFIER: 2,
  STABILIZER: 2,
  DEFENSE: 3,
  CONVERTER: 2,
};

export interface GameModuleDefinition {
  id: string;
  name: string;
  description: string;
  role: ModuleRoleId;
  trigger: ModuleTriggerId;
  effect: ModuleEffectId;
  target: ModuleTargetId;
  baseValue: number;
  cost: number;
  cooldown: number;
  repeatOnce?: boolean;
}

export interface GameThreat {
  id: string;
  round: number;
  name: string;
  telegraph: string;
  kind: ThreatKindId;
  targetProgress: number;
  integrityDamage: number;
  instabilityGain: number;
  modifier: ThreatModifierId;
  phaseTwoModifier?: ThreatModifierId;
}

export interface GenomeCounter {
  id: string;
  role: ModuleRoleId;
  label: string;
  outputMultiplier: number;
}

export interface GameEnding {
  title: string;
  description: string;
}

export interface GameGenome {
  version: 1;
  seed: string;
  title: string;
  premise: string;
  aliases: Record<CoreResourceId, string>;
  winDescription: string;
  failDescription: string;
  rules: [WorldRuleId, WorldRuleId];
  modules: GameModuleDefinition[];
  threats: GameThreat[];
  counters: [GenomeCounter, GenomeCounter, GenomeCounter];
  endings: {
    victory: GameEnding;
    defeat: GameEnding;
  };
}

export interface GenomeValidation {
  valid: boolean;
  issues: string[];
}

export interface GenomeProbe {
  playable: boolean;
  reason?: 'NO_PROGRESS_SOURCE' | 'NO_SURVIVAL_SOURCE' | 'INSUFFICIENT_OUTPUT';
}
