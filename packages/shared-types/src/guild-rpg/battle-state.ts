import type { AdventurerDefinition, GuildSkillDefinition, QuestDefinition } from './content';
import type { GuildAdventurer } from './profile';
import type { GuildStats } from './stats';

export type BattleStatus = 'active' | 'victory' | 'defeat';
export type BattleSide = 'heroes' | 'enemies';

export interface BattleUnit {
  id: string;
  name: string;
  side: BattleSide;
  role?: 'vanguard' | 'ranger' | 'cleric';
  stats: GuildStats;
  currentHp: number;
  gauge: number;
  threat: number;
  guarding: boolean;
  isLeader: boolean;
  skillIds: readonly string[];
}

export interface BattleAction {
  actorId: string;
  skillId: string;
  targetId: string;
}

export type BattleEventKind =
  'battle_started' | 'damage' | 'healing' | 'guard' | 'unit_defeated' | 'victory' | 'defeat';

export interface GuildBattleEvent {
  id: number;
  kind: BattleEventKind;
  message: string;
  actorId?: string;
  targetId?: string;
  amount?: number;
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
