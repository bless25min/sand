import type {
  BattleEventKind,
  GuildElement,
  SkillSpecialization,
  StatusLayers,
  TriggerCondition,
} from '@expedition/shared-types';

export type GuildCombatUnitState =
  'idle' | 'acting' | 'next' | 'targeted' | 'hit' | 'broken' | 'defeated';

export interface GuildHeroVisual {
  id: string;
  sigil: string;
  primary: number;
  secondary: number;
  accent: number;
  weapon: 'shield' | 'bow' | 'staff' | 'flask' | 'tome' | 'blades';
}

export interface GuildEnemyVisual {
  id: string;
  family: 'greyfang' | 'deepmine' | 'ember' | 'storm';
  archetype: 'skirmisher' | 'brute' | 'guardian' | 'artillery' | 'boss' | 'flying';
  primary: number;
  secondary: number;
  accent: number;
  scale: number;
  crowned?: boolean;
}

export interface GuildZoneVisual {
  id: string;
  skyTop: number;
  skyBottom: number;
  ground: number;
  accent: number;
  atmosphere: 'moon-mist' | 'ore-dust' | 'ember-ash' | 'storm-rain';
  weather: 'cloud-drift' | 'falling-cinders' | 'ash-squall' | 'forked-lightning';
}

export interface GuildCombatVisualEvent {
  id: string;
  sourceEventId: number;
  eventKind: BattleEventKind;
  phase: 'windup' | 'travel' | 'impact' | 'aftermath' | 'finisher';
  headline: string;
  detail: string;
  relay: number;
  intensity: number;
  durationMs: number;
  polarity: 'damage' | 'support' | 'neutral';
  route: 'direct' | 'bounce' | 'echo' | 'area' | 'none';
  camera: 'none' | 'track' | 'punch' | 'shake' | 'finisher';
  actorId?: string;
  targetId?: string;
  number?: number;
  element?: GuildElement;
  specializationId?: SkillSpecialization;
  triggerId?: TriggerCondition;
  status?: 'burn' | 'poison' | 'tide' | 'weaken' | 'strengthen';
}

export interface GuildCombatSceneUnit {
  id: string;
  name: string;
  side: 'heroes' | 'enemies';
  x: number;
  y: number;
  currentHp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  hpRatio: number;
  state: GuildCombatUnitState;
  selected: boolean;
  statusLayers: StatusLayers;
  defenseReduction?: number;
  strengthened?: number;
  preview?: {
    afterHp: number;
    damage: number;
    healing: number;
    afterStatus: StatusLayers;
    afterDefenseReduction: number;
    afterStrengthened: number;
  };
  hero?: GuildHeroVisual;
  enemy?: GuildEnemyVisual;
}

export interface GuildCombatScenePreview {
  actorId: string;
  targetIds: readonly string[];
  totalDamage: number;
  element?: GuildElement;
}

export interface GuildCombatScene {
  width: number;
  height: number;
  layout: 'portrait' | 'landscape';
  questId: string;
  zone: GuildZoneVisual;
  relay: number;
  units: readonly GuildCombatSceneUnit[];
  event?: GuildCombatVisualEvent;
  preview?: GuildCombatScenePreview;
}
