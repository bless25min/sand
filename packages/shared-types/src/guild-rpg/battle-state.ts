import type {
  AdventurerDefinition,
  AdventurerRole,
  GuildSkillDefinition,
  QuestDefinition,
} from './content';
import type { ComboRuntimeState } from './combo/runtime';
import type { GuildAdventurer } from './profile';
import type { HuntEnemyTrait } from './hunt';
import type { GuildStats } from './stats';
import type { AscensionDefinition } from './progression';
import type {
  GuildElement,
  RoundOrder,
  SkillHistoryEntry,
  SkillSpecialization,
  StatusLayers,
  TriggerCondition,
} from './skill-build';

export type BattleStatus = 'active' | 'victory' | 'defeat';
export type BattleSide = 'heroes' | 'enemies';

export interface BattleUnit {
  id: string;
  name: string;
  side: BattleSide;
  role?: AdventurerRole;
  stats: GuildStats;
  currentHp: number;
  gauge: number;
  threat: number;
  guarding: boolean;
  isLeader: boolean;
  skillIds: readonly string[];
  huntTraits?: readonly HuntEnemyTrait[];
  statusLayers?: StatusLayers;
  defenseReduction?: number;
  strengthened?: number;
  equippedCores?: readonly {
    id: string;
    strength: number;
  }[];
  deliveryPassiveId?: string;
}

export interface BattleAction {
  actorId: string;
  skillId: string;
  targetId: string;
}

export type BattleEventKind =
  | 'battle_started'
  | 'skill_cast'
  | 'damage'
  | 'healing'
  | 'guard'
  | 'status_applied'
  | 'reaction'
  | 'weaken'
  | 'strengthen'
  | 'triggered'
  | 'bounce'
  | 'echo'
  | 'relay'
  | 'core_triggered'
  | 'passive'
  | 'finisher'
  | 'overkill'
  | 'infinite_engine'
  | 'unit_defeated'
  | 'victory'
  | 'defeat';

export interface GuildBattleEvent {
  id: number;
  kind: BattleEventKind;
  message: string;
  roundIndex?: number;
  causalDepth?: number;
  actorId?: string;
  targetId?: string;
  amount?: number;
  causalId?: string;
  parentCausalId?: string;
  skillId?: string;
  componentId?: string;
  element?: GuildElement;
  specializationId?: SkillSpecialization;
  triggerId?: TriggerCondition;
}

export interface GuildBattleState {
  questId: string;
  seed: string;
  elapsedMs: number;
  sequence: number;
  status: BattleStatus;
  units: readonly BattleUnit[];
  selectedTargetId?: string | undefined;
  pendingLeaderId?: string | undefined;
  leaderAuto: boolean;
  events: readonly GuildBattleEvent[];
  combo?: ComboRuntimeState;
  ascension?: AscensionDefinition;
  roundOrder?: RoundOrder;
  skillHistory?: readonly SkillHistoryEntry[];
  roundIndex?: number;
}

export interface StartBattleInput {
  adventurers: readonly AdventurerDefinition[];
  quest: QuestDefinition;
  party: GuildAdventurer[];
  leaderId: string;
  seed: string;
  leaderAuto?: boolean;
}

export interface ResolveBattleActionInput {
  battle: GuildBattleState;
  action: BattleAction;
  skills: Readonly<Record<string, GuildSkillDefinition>>;
}
