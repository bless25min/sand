import type { StatModifier } from './stats';
import type { IntegerRollRange } from './skill-build';

export type GuildEquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type GuildItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface EquipmentCoreRoll {
  id: string;
  strength: number;
}

export interface EquipmentItem {
  id: string;
  baseId: string;
  name: string;
  slot: GuildEquipmentSlot;
  rarity: GuildItemRarity;
  mainStat: StatModifier;
  affixes: readonly StatModifier[];
  sellValue: number;
  ruleIds?: readonly string[];
  sourceEnemyId?: string;
  forgeMaterialId?: string;
  forgeRank?: number;
  coreId?: string;
  coreStrength?: number;
  cores?: readonly EquipmentCoreRoll[];
  locked?: boolean;
  favorite?: boolean;
}

export interface EquipmentLoadout {
  weapon?: EquipmentItem;
  armor?: EquipmentItem;
  accessory?: EquipmentItem;
}

export interface EquipmentBaseDefinition {
  id: string;
  name: string;
  slot: GuildEquipmentSlot;
  mainStat: StatModifier['stat'];
  baseValue: number;
  forgeMaterialId: string;
  ruleIds?: readonly string[];
  mainStatRoll: IntegerRollRange;
  coreStrengthRoll: IntegerRollRange;
  coreIds: readonly string[];
}

export interface EquipmentAffixDefinition {
  id: string;
  name: string;
  stat: StatModifier['stat'];
}
