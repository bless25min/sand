import type { EquipmentAffixDefinition, EquipmentBaseDefinition } from './equipment';
import type { HuntDefinition } from './hunt';
import type { CardCatalog } from './combo/content';
import type { BuildDefinition, RuleCatalog } from './combo/rules';
import type { GuildStats } from './stats';

export type AdventurerRole = 'vanguard' | 'ranger' | 'cleric';
export type SkillKind = 'attack' | 'heal' | 'guard';
export type SkillTarget = 'enemy' | 'ally' | 'self';

export interface AdventurerDefinition {
  id: string;
  name: string;
  title: string;
  role: AdventurerRole;
  baseStats: GuildStats;
  skillIds: readonly string[];
}

export interface GuildSkillDefinition {
  id: string;
  name: string;
  description: string;
  kind: SkillKind;
  target: SkillTarget;
  power: number;
  threat: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  stats: GuildStats;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  recommendedLevel: number;
  rewardExperience: number;
  rewardGold: number;
  enemies: readonly EnemyDefinition[];
}

export interface GuildGameContent {
  adventurers: readonly AdventurerDefinition[];
  cards: CardCatalog;
  rules: RuleCatalog;
  builds: readonly BuildDefinition[];
  hunts: readonly HuntDefinition[];
  skills: Readonly<Record<string, GuildSkillDefinition>>;
  quests: readonly QuestDefinition[];
  equipmentBases: readonly EquipmentBaseDefinition[];
  equipmentAffixes: readonly EquipmentAffixDefinition[];
}
