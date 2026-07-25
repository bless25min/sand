import type { StatModifier } from './stats';

export type GuildEquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type GuildItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

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
  ruleIds?: readonly string[];
}

export interface EquipmentAffixDefinition {
  id: string;
  name: string;
  stat: StatModifier['stat'];
}
