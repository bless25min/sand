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
  bestOverkill?: number;
  bestLootMultiplier?: number;
  bestItemQuality?: number;
  bestChain?: number;
  ascendedClears?: number;
}

export interface GuildProgressionEvent {
  id: string;
  kind: 'forge' | 'challenge' | 'ascension';
  label: string;
  detail: string;
}

export interface GuildProfile {
  version: 3;
  leaderId: string;
  party: readonly GuildAdventurer[];
  inventory: readonly EquipmentItem[];
  materials: Readonly<Record<string, number>>;
  gold: number;
  unlockedQuestIds: readonly string[];
  questRecords: Readonly<Record<string, QuestRecord>>;
  nextLootSeed: number;
  selectedBuildId: string;
  loadouts: Readonly<Record<string, readonly string[]>>;
  completedChallengeIds: readonly string[];
  discoveredEquipmentIds: readonly string[];
  discoveredRuleIds: readonly string[];
  forgeSequence: number;
  progressionEvents: readonly GuildProgressionEvent[];
}

export interface QuestRewards {
  questId: string;
  experience: number;
  gold: number;
  clearMs: number;
  items: readonly EquipmentItem[];
  successful?: boolean;
  materials?: readonly MaterialReward[];
}

export interface MaterialReward {
  id: string;
  name: string;
  quantity: number;
}

export type ItemChoice = 'equip' | 'keep' | 'sell';

export interface RewardResolution {
  profile: GuildProfile;
  message: string;
}
