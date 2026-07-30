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
  unlockedQuestIds: readonly string[];
  party: readonly { definitionId: string; skillIds: readonly string[] }[];
  skillInventory: readonly RuntimeSkill[];
}

export interface RuntimeSkill {
  id: string;
  name: string;
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

interface RuntimeRewardItem {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  qualityRank: 1 | 2 | 3 | 4 | 5;
  mainStat: { stat: string; value: number };
  affixes: readonly { label?: string; value: number }[];
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
