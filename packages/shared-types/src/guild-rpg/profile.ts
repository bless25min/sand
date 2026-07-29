import type { EquipmentItem, EquipmentLoadout } from './equipment';
import type { GuildSkillItem } from './skill-build';

export interface GuildAdventurer {
  definitionId: string;
  equipment: EquipmentLoadout;
  skillIds: readonly string[];
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
  kind: 'forge' | 'fusion' | 'challenge' | 'ascension';
  label: string;
  detail: string;
}

export interface GuildProfile {
  version: 5;
  leaderId: string;
  party: readonly GuildAdventurer[];
  defaultOrder: readonly string[];
  skillInventory: readonly GuildSkillItem[];
  inventory: readonly EquipmentItem[];
  materials: Readonly<Record<string, number>>;
  gold: number;
  unlockedQuestIds: readonly string[];
  questRecords: Readonly<Record<string, QuestRecord>>;
  nextLootSeed: number;
  completedChallengeIds: readonly string[];
  discoveredEquipmentIds: readonly string[];
  discoveredCoreIds: readonly string[];
  forgeSequence: number;
  forgeLocks: Readonly<Record<string, readonly string[]>>;
  progressionEvents: readonly GuildProgressionEvent[];
}

export interface QuestRewards {
  questId: string;
  gold: number;
  clearMs: number;
  items: readonly EquipmentItem[];
  skillDrops: readonly GuildSkillItem[];
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
