import type { BattleEvent, FixedOrder, UnitState } from '@expedition/shared-types';

import { advancePlayableTurn } from './advance-playable-turn';
import {
  createBattleEndedEvent,
  createFormationEvent,
  createMovementEvent,
  createOrderEvent,
} from './create-playable-battle-event';
import type { PlayableBattleLootFacts, PlayableBattleState } from './playable-battle-state';
import { resolvePlayableContact } from './resolve-playable-contact';
import { isRangedVolleyAvailable, resolveRangedVolley } from './resolve-ranged-volley';

export interface ResolveFixedOrderInput {
  readonly battle: PlayableBattleState;
  readonly order: FixedOrder;
}

const CONTACT_DISTANCE = 3;
const MAX_LOOT_ELIGIBLE_WOLVES = 24;

function distanceBetween(unit: UnitState, target: { readonly x: number; readonly y: number }) {
  return Math.hypot(unit.position.x - target.x, unit.position.y - target.y);
}

function replaceUnit(units: readonly UnitState[], next: UnitState): UnitState[] {
  return units.map((unit) => (unit.id === next.id ? next : unit));
}

function createLootFacts(monster: PlayableBattleState['monsterGroup']): PlayableBattleLootFacts {
  return {
    defeatedWolves: Math.min(
      MAX_LOOT_ELIGIBLE_WOLVES,
      monster.deadCount + monster.routedCount,
    ),
    defeatedHornedAlphas: monster.leaderId === undefined ? 0 : 1,
  };
}

export function resolveFixedOrder(input: ResolveFixedOrderInput): PlayableBattleState {
  if (input.battle.outcome !== 'IN_PROGRESS') return input.battle;

  const unit = input.battle.units.find((candidate) => candidate.id === input.order.unitId);
  if (unit === undefined) throw new Error(`unknown unit: ${input.order.unitId}`);

  const tick = input.battle.tick + 1;
  const events: BattleEvent[] = [...input.battle.events, createOrderEvent(input.order, tick)];

  if (input.order.action === 'RETREAT') {
    const units = input.battle.units.map((candidate) => ({
      ...candidate,
      executionState: 'RETREATING' as const,
    }));
    events.push(
      createBattleEndedEvent({
        battle: input.battle,
        tick,
        outcome: 'RETREATED',
        playerUnitIds: units.map(({ id }) => id),
        cause: input.order.action,
      }),
    );
    return { ...input.battle, tick, units, outcome: 'RETREATED', events, lastOrder: input.order };
  }

  let orderedUnit = unit;
  if (input.order.action === 'CHANGE_FORMATION') {
    orderedUnit = { ...unit, formation: input.order.formation };
    events.push(createFormationEvent(orderedUnit, tick, input.order.action));
  }

  const turn = advancePlayableTurn({
    unit: orderedUnit,
    monster: input.battle.monsterGroup,
    order: input.order,
  });
  const moved = turn.unit;
  const monster = turn.monster;

  if (turn.playerMoved || turn.monsterMoved) {
    events.push(
      createMovementEvent({
        unit: moved,
        monster,
        playerMoved: turn.playerMoved,
        tick,
        cause: input.order.action,
      }),
    );
  }

  if (
    input.order.action === 'ATTACK' &&
    isRangedVolleyAvailable({ unit: moved, monster })
  ) {
    const volley = resolveRangedVolley({
      seed: input.battle.seed,
      tick,
      unit: moved,
      monster,
    });
    events.push(...volley.events);
    const attackingUnit = { ...moved, executionState: 'ENGAGED' as const };

    if (volley.victory) {
      const lootFacts = createLootFacts(volley.monster);
      events.push(
        createBattleEndedEvent({
          battle: input.battle,
          tick,
          outcome: 'VICTORY',
          playerUnitIds: [unit.id],
          cause: input.order.action,
          lootFacts,
        }),
      );
      return {
        ...input.battle,
        tick,
        units: replaceUnit(input.battle.units, attackingUnit),
        monsterGroup: volley.monster,
        outcome: 'VICTORY',
        events,
        lastOrder: input.order,
        lootFacts,
      };
    }

    return {
      ...input.battle,
      tick,
      units: replaceUnit(input.battle.units, attackingUnit),
      monsterGroup: volley.monster,
      events,
      lastOrder: input.order,
    };
  }

  const inContact = distanceBetween(moved, monster.position) <= CONTACT_DISTANCE;
  if (inContact) {
    const contact = resolvePlayableContact({
      seed: input.battle.seed,
      tick,
      unit: moved,
      monster,
    });
    events.push(...contact.events);
    if (contact.defeat) {
      events.push(
        createBattleEndedEvent({
          battle: input.battle,
          tick,
          outcome: 'DEFEAT',
          playerUnitIds: [unit.id],
          cause: input.order.action,
        }),
      );
      return {
        ...input.battle,
        tick,
        units: replaceUnit(input.battle.units, contact.unit),
        monsterGroup: contact.monster,
        outcome: 'DEFEAT',
        events,
        lastOrder: input.order,
      };
    }
    if (contact.victory) {
      const lootFacts = createLootFacts(contact.monster);
      events.push(
        createBattleEndedEvent({
          battle: input.battle,
          tick,
          outcome: 'VICTORY',
          playerUnitIds: [unit.id],
          cause: input.order.action,
          lootFacts,
        }),
      );
      return {
        ...input.battle,
        tick,
        units: replaceUnit(input.battle.units, contact.unit),
        monsterGroup: contact.monster,
        outcome: 'VICTORY',
        events,
        lastOrder: input.order,
        lootFacts,
      };
    }
    return {
      ...input.battle,
      tick,
      units: replaceUnit(input.battle.units, contact.unit),
      monsterGroup: contact.monster,
      outcome: 'IN_PROGRESS',
      events,
      lastOrder: input.order,
    };
  }

  return {
    ...input.battle,
    tick,
    units: replaceUnit(input.battle.units, moved),
    monsterGroup: monster,
    events,
    lastOrder: input.order,
  };
}
