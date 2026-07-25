import type { EquipmentItem, EquipmentLoadout } from './equipment';

export interface GuildAdventurer {
  definitionId: string;
  level: number;
  experience: number;
  equipment: EquipmentLoadout;
}

export interface QuestRecord {
  clears: number;
  bestClearMs?: number;
}

export interface GuildProfile {
  version: 1;
  leaderId: string;
  party: readonly GuildAdventurer[];
  inventory: readonly EquipmentItem[];
  gold: number;
  unlockedQuestIds: readonly string[];
  questRecords: Readonly<Record<string, QuestRecord>>;
  nextLootSeed: number;
}

export interface QuestRewards {
  questId: string;
  experience: number;
  gold: number;
  clearMs: number;
  items: readonly EquipmentItem[];
}

export type ItemChoice = 'equip' | 'keep' | 'sell';

export interface RewardResolution {
  profile: GuildProfile;
  message: string;
}
