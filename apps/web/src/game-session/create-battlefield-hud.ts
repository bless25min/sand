import type {
  FormationType,
  MonsterBehaviorState,
  UnitState,
  UnitType,
} from '@expedition/shared-types';
import type { PlayableBattleState } from '@expedition/simulation-core';

import type { CommandFeedback } from './create-command-feedback';

const ROLE_LABELS: Readonly<Record<UnitType, string>> = {
  HEAVY_INFANTRY: '前衛',
  ARCHER: '遠射',
  CAVALRY: '突擊',
  HERO_TEAM: '支援',
};

const FORMATION_LABELS: Readonly<Record<FormationType, string>> = {
  DENSE_BLOCK: '密集方陣',
  LINE: '橫列',
  COLUMN: '縱列',
  LOOSE: '散開',
  SQUARE: '方陣',
  WEDGE: '楔形',
};

const INTENT_LABELS: Readonly<Record<MonsterBehaviorState, string>> = {
  IDLE: '潛伏觀望',
  HUNTING: '正面追獵',
  ENCIRCLING: '迂迴包圍',
  ENGAGED: '近身撕咬',
  RETREATING: '脫離戰線',
  ROUTING: '潰散逃亡',
};

interface UnitHud {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly formation: string;
  readonly troops: number;
  readonly initialTroops: number;
  readonly moralePercent: number;
  readonly fatiguePercent: number;
  readonly cohesionPercent: number;
}

interface EnemyHud {
  readonly id: string;
  readonly name: string;
  readonly intent: MonsterBehaviorState;
  readonly intentLabel: string;
  readonly troops: number;
  readonly initialTroops: number;
  readonly moralePercent: number;
}

export interface BattlefieldImpactHud {
  readonly kind: 'volley' | 'contact';
  readonly label: string;
  readonly playerLoss: number;
  readonly enemyLoss: number;
}

export interface BattlefieldHudModel {
  readonly objective: string;
  readonly selected: UnitHud;
  readonly enemy: EnemyHud;
  readonly impact: BattlefieldImpactHud | null;
}

export interface CreateBattlefieldHudInput {
  readonly battle: PlayableBattleState;
  readonly selectedUnitId: string;
  readonly feedback: CommandFeedback | null;
}

function percent(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function selectedUnit(input: CreateBattlefieldHudInput): UnitState {
  const unit =
    input.battle.units.find(({ id }) => id === input.selectedUnitId) ?? input.battle.units[0];
  if (unit === undefined) {
    throw new Error('battlefield HUD requires at least one player unit');
  }
  return unit;
}

function createImpact(input: CreateBattlefieldHudInput): BattlefieldImpactHud | null {
  const feedback = input.feedback;
  if (
    feedback === null ||
    (feedback.playerTroopLoss === 0 && feedback.monsterTroopLoss === 0)
  ) {
    return null;
  }

  const ranged = input.battle.events.some(
    (event) => event.tick === input.battle.tick && event.type === 'RANGED_VOLLEY_RESOLVED',
  );
  return {
    kind: ranged ? 'volley' : 'contact',
    label: ranged ? '箭雨命中' : '戰線衝擊',
    playerLoss: feedback.playerTroopLoss,
    enemyLoss: feedback.monsterTroopLoss,
  };
}

export function createBattlefieldHud(input: CreateBattlefieldHudInput): BattlefieldHudModel {
  const unit = selectedUnit(input);
  const monster = input.battle.monsterGroup;

  return {
    objective:
      input.battle.outcome === 'IN_PROGRESS' ? '擊潰灰牙狼群' : '戰鬥結束，整備軍團',
    selected: {
      id: unit.id,
      name: unit.name,
      role: ROLE_LABELS[unit.unitType],
      formation: FORMATION_LABELS[unit.formation],
      troops: unit.troopCount,
      initialTroops: unit.initialTroopCount,
      moralePercent: percent(unit.morale),
      fatiguePercent: percent(unit.fatigue),
      cohesionPercent: percent(unit.cohesion),
    },
    enemy: {
      id: monster.id,
      name: '灰牙狼群',
      intent: monster.behaviorState,
      intentLabel: INTENT_LABELS[monster.behaviorState],
      troops: monster.troopCount,
      initialTroops: monster.initialTroopCount,
      moralePercent: percent(monster.morale),
    },
    impact: createImpact(input),
  };
}
