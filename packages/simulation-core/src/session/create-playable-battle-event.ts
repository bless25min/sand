import type {
  BattleEvent,
  FixedOrder,
  MonsterGroupState,
  UnitState,
} from '@expedition/shared-types';

import type {
  PlayableBattleLootFacts,
  PlayableBattleOutcome,
  PlayableBattleState,
} from './playable-battle-state';

export function createOrderEvent(order: FixedOrder, tick: number): BattleEvent {
  return {
    id: `order:${tick}:${order.unitId}:${order.action}`,
    tick,
    type: 'ORDER_ISSUED',
    sourceIds: [order.unitId],
    targetIds: [],
    causes: [order.action],
    effects: order.formation === undefined ? {} : { formation: order.formation },
    visibility: 'PLAYER',
  };
}

export function createFormationEvent(
  unit: UnitState,
  tick: number,
  cause: FixedOrder['action'],
): BattleEvent {
  return {
    id: `formation:${tick}:${unit.id}`,
    tick,
    type: 'FORMATION_CHANGED',
    sourceIds: [unit.id],
    targetIds: [],
    causes: [cause],
    effects: { formation: unit.formation },
    visibility: 'PLAYER',
  };
}

interface CreateMovementEventInput {
  readonly unit: UnitState;
  readonly monster: MonsterGroupState;
  readonly playerMoved: boolean;
  readonly tick: number;
  readonly cause: FixedOrder['action'];
}

export function createMovementEvent(input: CreateMovementEventInput): BattleEvent {
  return {
    id: `movement:${input.tick}:${input.playerMoved ? input.unit.id : input.monster.id}`,
    tick: input.tick,
    type: 'UNIT_MOVED',
    sourceIds: input.playerMoved ? [input.unit.id, input.monster.id] : [input.monster.id],
    targetIds: [],
    position: input.playerMoved ? input.unit.position : input.monster.position,
    causes: [input.cause],
    effects: {
      unitX: input.unit.position.x,
      monsterX: input.monster.position.x,
    },
    visibility: 'PLAYER',
  };
}

interface CreateBattleEndedEventInput {
  readonly battle: PlayableBattleState;
  readonly tick: number;
  readonly outcome: Exclude<PlayableBattleOutcome, 'IN_PROGRESS'>;
  readonly playerUnitIds: readonly string[];
  readonly cause: FixedOrder['action'];
  readonly lootFacts?: PlayableBattleLootFacts;
}

export function createBattleEndedEvent(input: CreateBattleEndedEventInput): BattleEvent {
  const playerDefeated = input.outcome === 'DEFEAT';
  return {
    id: `battle:${input.battle.seed}:${input.outcome.toLowerCase()}:${input.tick}`,
    tick: input.tick,
    type: 'BATTLE_ENDED',
    sourceIds: playerDefeated ? [input.battle.monsterGroup.id] : input.playerUnitIds,
    targetIds: playerDefeated ? input.playerUnitIds : [input.battle.monsterGroup.id],
    causes: [input.cause],
    effects:
      input.lootFacts === undefined
        ? { outcome: input.outcome }
        : { outcome: input.outcome, ...input.lootFacts },
    visibility: 'PLAYER',
  };
}
