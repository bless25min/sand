import type { FixedOrderAction, FormationType, UnitState, Vec2 } from '@expedition/shared-types';
import type { PlayableBattleState } from '@expedition/simulation-core';

export type CommandFeedbackTone =
  | 'advance'
  | 'hold'
  | 'attack'
  | 'impact'
  | 'formation'
  | 'retreat';

export interface CommandFeedback {
  readonly action: FixedOrderAction;
  readonly label: string;
  readonly tone: CommandFeedbackTone;
  readonly summary: string;
  readonly distanceMoved: number;
  readonly playerTroopLoss: number;
  readonly monsterTroopLoss: number;
  readonly playerMoraleDelta: number;
  readonly monsterMoraleDelta: number;
  readonly formation?: FormationType;
}

export interface CreateCommandFeedbackInput {
  readonly previousBattle?: PlayableBattleState;
  readonly battle: PlayableBattleState;
  readonly selectedUnitId: string;
}

const ACTION_LABELS: Readonly<Record<FixedOrderAction, string>> = {
  ADVANCE: '推進',
  HOLD: '固守',
  ATTACK: '攻擊',
  CHANGE_FORMATION: '變換陣形',
  RETREAT: '撤退',
};

const FORMATION_LABELS: Readonly<Record<FormationType, string>> = {
  DENSE_BLOCK: '密集方陣',
  LINE: '橫列陣',
  COLUMN: '縱隊',
  LOOSE: '疏散陣',
  SQUARE: '方陣',
  WEDGE: '楔形陣',
};

function distance(first: Vec2, second: Vec2): number {
  return Math.round(Math.hypot(first.x - second.x, first.y - second.y) * 10) / 10;
}

function percentDelta(previous: number, current: number): number {
  const result = Math.round((current - previous) * 100);
  return Object.is(result, -0) ? 0 : result;
}

function findUnit(battle: PlayableBattleState, unitId: string): UnitState | undefined {
  return battle.units.find((unit) => unit.id === unitId);
}

export function createCommandFeedback(
  input: CreateCommandFeedbackInput,
): CommandFeedback | null {
  const order = input.battle.lastOrder;
  const previousBattle = input.previousBattle;
  if (order === undefined || previousBattle === undefined) return null;

  const unitId = order.unitId || input.selectedUnitId;
  const previousUnit = findUnit(previousBattle, unitId);
  const currentUnit = findUnit(input.battle, unitId);
  if (previousUnit === undefined || currentUnit === undefined) return null;

  const distanceMoved = distance(previousUnit.position, currentUnit.position);
  const monsterDistance = distance(
    previousBattle.monsterGroup.position,
    input.battle.monsterGroup.position,
  );
  const playerTroopLoss = Math.max(0, previousUnit.troopCount - currentUnit.troopCount);
  const monsterTroopLoss = Math.max(
    0,
    previousBattle.monsterGroup.troopCount - input.battle.monsterGroup.troopCount,
  );
  const playerMoraleDelta = percentDelta(previousUnit.morale, currentUnit.morale);
  const monsterMoraleDelta = percentDelta(
    previousBattle.monsterGroup.morale,
    input.battle.monsterGroup.morale,
  );
  const impact =
    playerTroopLoss > 0 ||
    monsterTroopLoss > 0 ||
    playerMoraleDelta < 0 ||
    monsterMoraleDelta < 0;
  let tone: CommandFeedbackTone =
    order.action === 'CHANGE_FORMATION'
      ? 'formation'
      : (order.action.toLowerCase() as CommandFeedbackTone);
  let summary = '';

  if (order.action === 'ADVANCE') {
    summary = `${currentUnit.name}推進 ${distanceMoved} 格；灰牙逼近 ${monsterDistance} 格。`;
  } else if (order.action === 'HOLD') {
    summary = `${currentUnit.name}原地固守；灰牙逼近 ${monsterDistance} 格。`;
  } else if (order.action === 'ATTACK') {
    tone = impact ? 'impact' : 'attack';
    summary = impact
      ? `${currentUnit.name}接戰：我軍 -${playerTroopLoss}，灰牙 -${monsterTroopLoss}；敵軍士氣 ${monsterMoraleDelta}%。`
      : `${currentUnit.name}強行推進 ${distanceMoved} 格，準備接戰。`;
  } else if (order.action === 'CHANGE_FORMATION') {
    summary = `${currentUnit.name}變換為${FORMATION_LABELS[order.formation]}；灰牙逼近 ${monsterDistance} 格。`;
  } else {
    summary = '全軍撤離戰場，返回整備區。';
  }

  return {
    action: order.action,
    label: ACTION_LABELS[order.action],
    tone,
    summary,
    distanceMoved,
    playerTroopLoss,
    monsterTroopLoss,
    playerMoraleDelta,
    monsterMoraleDelta,
    ...(order.action === 'CHANGE_FORMATION' ? { formation: order.formation } : {}),
  };
}
