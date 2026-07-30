export interface RuntimeUnit {
  id: string;
  name: string;
  side: 'heroes' | 'enemies';
  currentHp: number;
  stats: { hp: number; attack: number; defense: number; speed: number; healing: number };
  skillIds: readonly string[];
  statusLayers?: Readonly<Record<'burn' | 'poison' | 'tide', number>>;
}

export interface RuntimeBattle {
  questId: string;
  status: 'active' | 'victory' | 'defeat';
  units: readonly RuntimeUnit[];
  roundOrder: RuntimeRoundOrder;
  selectedTargetId?: string;
  events: readonly RuntimeEvent[];
}

interface RuntimeRoundOrder {
  currentOrder: readonly string[];
  actedIds: readonly string[];
  activeAdventurerId?: string;
  carryCurrentOrder: boolean;
}

export interface RuntimeEvent {
  id: number;
  kind: string;
  actorId?: string;
  targetId?: string;
  amount?: number;
  element?: 'fire' | 'grass' | 'water';
}

export interface RuntimeProfile {
  version: 5;
  gold: number;
  unlockedQuestIds: readonly string[];
  defaultOrder: readonly string[];
  party: readonly {
    definitionId: string;
    skillIds: readonly string[];
    equipment: Readonly<Record<string, RuntimeRewardItem | undefined>>;
  }[];
  skillInventory: readonly RuntimeSkill[];
  inventory: readonly RuntimeRewardItem[];
  materials: Readonly<Record<string, number>>;
  questRecords: Readonly<Record<string, { clears: number }>>;
  forgeLocks: Readonly<Record<string, readonly string[]>>;
  progressionEvents: readonly { id: string; kind: string; label: string; detail: string }[];
  completedChallengeIds: readonly string[];
}

export interface RuntimeSkill {
  id: string;
  name: string;
  stars: 1 | 2 | 3;
  components: readonly {
    id: string;
    qualityRank: 1 | 2 | 3 | 4 | 5;
    element: 'fire' | 'grass' | 'water';
    specializationId: string;
    triggerId: string;
    power: number;
    layerStrength: number;
    triggerAddition: number;
    repeatCount: number;
  }[];
  sourceSkills?: readonly RuntimeSkill[];
}

export interface RuntimePreview {
  totalDamage: number;
  overkill: number;
  executionWindow: boolean;
  finisherPower: number;
  relayEchoes: number;
  damageSegments: number;
  chaseSegments: number;
  comboSteps: readonly {
    componentId: string;
    triggerId: string;
    readiness: 'ready' | 'pending-impact' | 'not-ready';
    missingStatus?: 'burn' | 'poison' | 'tide';
  }[];
  nextRelays: readonly { actorId: string; newlyReadySkillIds: readonly string[] }[];
  units: readonly {
    id: string;
    beforeStatus: Readonly<Record<'burn' | 'poison' | 'tide', number>>;
    afterStatus: Readonly<Record<'burn' | 'poison' | 'tide', number>>;
  }[];
  events: readonly RuntimeEvent[];
}

export interface RuntimeRewards {
  materials: readonly { id: string; name: string; quantity: number }[];
  items: readonly RuntimeRewardItem[];
  skillDrops: readonly RuntimeSkill[];
}

export interface RuntimeRewardItem {
  id: string;
  baseId: string;
  name: string;
  slot: 'weapon' | 'armor' | 'accessory';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  qualityRank: 1 | 2 | 3 | 4 | 5;
  mainStat: { stat: string; value: number };
  affixes: readonly { label?: string; value: number }[];
  sellValue: number;
  forgeRank?: number;
  coreId?: string;
  coreStrength?: number;
  cores?: readonly { id: string; strength: number }[];
  locked?: boolean;
  favorite?: boolean;
}

export type RuntimeGuildPage = 'quest' | 'party' | 'skills' | 'equipment';

export interface RuntimeGuildState {
  screen: 'guild' | 'battle' | 'rewards';
  page: RuntimeGuildPage;
  skillWorkspace: 'loadout' | 'fusion';
  profile: RuntimeProfile;
  preferences: {
    tutorial: 'active' | 'complete' | 'skipped';
    masterVolume: number;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
    motion: 'system' | 'reduced';
  };
  tutorialStep: string;
  selectedHeroId: string;
  selectedSkillSlot: number;
  selectedFusionIds: readonly string[];
  selectedSalvageIds: readonly string[];
  lastFusedSkillId?: string;
  tutorialSkillId?: string;
  battle?: RuntimeBattle;
  rewards?: RuntimeRewards;
  recentEvents: readonly RuntimeEvent[];
  message: string;
}

export interface RuntimeGuildAction {
  type: string;
  [key: string]: unknown;
}

export interface RuntimeGuildController {
  getState(): RuntimeGuildState;
  dispatch(action: RuntimeGuildAction): RuntimeGuildState;
  subscribe(listener: (state: RuntimeGuildState) => void): () => void;
}

export interface RuntimeContent {
  zones: readonly {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    questIds: readonly string[];
  }[];
  quests: readonly { id: string; zoneId: string; name: string; description: string }[];
  adventurers: readonly { id: string; name: string; title: string; role: string }[];
  ascensions: readonly { id: string; name: string; description: string; routeLabel: string }[];
  challenges: readonly {
    id: string;
    questId: string;
    name: string;
    description: string;
    rewardLabel: string;
  }[];
  elements: readonly { id: string; name: string; status: string; fantasy: string }[];
  skillSpecializations: readonly { id: string; name: string; description: string }[];
  triggerConditions: readonly { id: string; name: string; description: string }[];
  equipmentCores: readonly { id: string; name: string; description: string }[];
}

export interface ExpeditionRuntime {
  createProfile(): RuntimeProfile;
  startQuest(profile: RuntimeProfile, questId: string): RuntimeBattle;
  chooseNextHero(battle: RuntimeBattle, actorId: string): RuntimeBattle;
  previewSkill(input: RuntimeActionInput): RuntimePreview;
  resolveAction(input: RuntimeActionInput): {
    battle: RuntimeBattle;
    events: readonly RuntimeEvent[];
  };
  calculateRewards(profile: RuntimeProfile, battle: RuntimeBattle): RuntimeRewards | undefined;
}

export interface RuntimeActionInput {
  profile: RuntimeProfile;
  battle: RuntimeBattle;
  actorId: string;
  skillId: string;
  targetId: string;
}
