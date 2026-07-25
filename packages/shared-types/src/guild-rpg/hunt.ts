import type { EquipmentItem, GuildEquipmentSlot, GuildItemRarity } from './equipment';
import type { MaterialReward, QuestRewards } from './profile';
import type { GuildStatKey } from './stats';
import type { ComboTransformKind } from './combo/rules';

export interface HuntMaterialDefinition {
  id: string;
  name: string;
  baseQuantity: number;
}

export interface HuntEquipmentDefinition {
  id: string;
  name: string;
  slot: GuildEquipmentSlot;
  mainStat: GuildStatKey;
  baseValue: number;
  ruleIds?: readonly string[];
}

export interface HuntEnemyTrait {
  id: string;
  name: string;
  description: string;
  counterBuildIds: readonly string[];
  pressureMultiplier?: number;
  guardedByEnemyIds?: readonly string[];
  guardedDamageMultiplier?: number;
  vulnerableTransform?: ComboTransformKind;
  vulnerabilityMultiplier?: number;
}

export interface HuntEnemyRewards {
  enemyId: string;
  material: HuntMaterialDefinition;
  equipment: readonly HuntEquipmentDefinition[];
  traits?: readonly HuntEnemyTrait[];
}

export interface HuntDefinition {
  id: string;
  questId: string;
  rewardExperience: number;
  rewardGold: number;
  bossEnemyId?: string;
  guardEnemyIds?: readonly string[];
  enemies: readonly HuntEnemyRewards[];
  annihilationChest?: HuntEquipmentDefinition;
}

export interface HuntEquipmentItem extends EquipmentItem {
  sourceEnemyId: string;
  qualityScore: number;
  jackpot: boolean;
  rarity: GuildItemRarity;
}

export interface HuntRewardAxes {
  multiKill: number;
  chainWipe: boolean;
  annihilation: boolean;
  perfectAnnihilation: boolean;
  bossChest: boolean;
  quantityMultiplier: number;
  individualOverkill: Readonly<Record<string, number>>;
  sharedOverflow: number;
  totalOverkill: number;
}

export interface HuntRewards extends QuestRewards {
  huntId: string;
  successful: boolean;
  materials: readonly MaterialReward[];
  items: readonly HuntEquipmentItem[];
  axes: HuntRewardAxes;
}
