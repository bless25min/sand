import type { FixedOrder } from '@expedition/shared-types';
import { createMonsterGroupState, createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { createPlayableBattle } from './create-playable-battle';
import { resolveFixedOrder } from './resolve-fixed-order';

function battleAtDistance(distance: number) {
  return createPlayableBattle({
    seed: 'playable-greyfang',
    units: [
      createUnitState({
        id: 'heavy',
        factionId: 'expedition',
        troopCount: 100,
        initialTroopCount: 100,
        position: { x: 0, y: 0 },
      }),
    ],
    monsterGroup: createMonsterGroupState({
      id: 'greyfang',
      leaderId: 'greyfang-alpha',
      factionId: 'greyfang',
      troopCount: 80,
      initialTroopCount: 80,
      position: { x: distance, y: 0 },
      morale: 0.8,
    }),
  });
}

function issue(order: FixedOrder, distance = 40) {
  return resolveFixedOrder({ battle: battleAtDistance(distance), order });
}

describe('playable fixed-order battle', () => {
  it('starts a traceable deterministic battle', () => {
    const first = battleAtDistance(40);
    const replay = battleAtDistance(40);

    expect(replay).toEqual(first);
    expect(first.tick).toBe(0);
    expect(first.outcome).toBe('IN_PROGRESS');
    expect(first.events.map((event) => event.type)).toEqual(['BATTLE_STARTED']);
  });

  it('advances the selected unit and the hunting Greyfang pack', () => {
    const result = issue({ unitId: 'heavy', action: 'ADVANCE' });

    expect(result.tick).toBe(1);
    expect(result.units[0]?.position.x).toBeGreaterThan(0);
    expect(result.monsterGroup.position.x).toBeLessThan(40);
    expect(result.events.at(-1)?.type).toBe('UNIT_MOVED');
  });

  it('changes formation without mutating the source battle', () => {
    const source = battleAtDistance(40);
    const result = resolveFixedOrder({
      battle: source,
      order: { unitId: 'heavy', action: 'CHANGE_FORMATION', formation: 'LINE' },
    });

    expect(source.units[0]?.formation).toBe('DENSE_BLOCK');
    expect(result.units[0]?.formation).toBe('LINE');
    expect(result.monsterGroup.position.x).toBeLessThan(source.monsterGroup.position.x);
    expect(result.events.some((event) => event.type === 'FORMATION_CHANGED')).toBe(true);
    expect(result.events.at(-1)?.type).toBe('UNIT_MOVED');
  });

  it('records the Greyfang movement while the selected unit holds', () => {
    const source = battleAtDistance(40);
    const result = resolveFixedOrder({
      battle: source,
      order: { unitId: 'heavy', action: 'HOLD' },
    });

    expect(result.units[0]?.position).toEqual(source.units[0]?.position);
    expect(result.monsterGroup.position.x).toBeLessThan(source.monsterGroup.position.x);
    expect(result.events.at(-1)).toMatchObject({
      type: 'UNIT_MOVED',
      sourceIds: ['greyfang'],
      position: result.monsterGroup.position,
    });
  });

  it('keeps the Greyfang encircling intent visible before contact', () => {
    const result = issue({ unitId: 'heavy', action: 'HOLD' }, 6);

    expect(result.monsterGroup.behaviorState).toBe('ENCIRCLING');
    expect(result.events.some((event) => event.type === 'CASUALTIES_APPLIED')).toBe(false);
  });

  it('lets the Greyfang pack attack when formation changes in contact', () => {
    const result = issue({ unitId: 'heavy', action: 'CHANGE_FORMATION', formation: 'LINE' }, 1);

    expect(result.events.some((event) => event.type === 'FORMATION_CHANGED')).toBe(true);
    expect(result.events.some((event) => event.type === 'CASUALTIES_APPLIED')).toBe(true);
  });

  it('resolves contact casualties deterministically', () => {
    const order: FixedOrder = { unitId: 'heavy', action: 'ATTACK' };
    const first = issue(order, 1);
    const replay = issue(order, 1);

    expect(replay).toEqual(first);
    expect(first.units[0]?.troopCount).toBeLessThan(100);
    expect(first.monsterGroup.troopCount).toBeLessThan(80);
    expect(first.events.some((event) => event.type === 'CASUALTIES_APPLIED')).toBe(true);
  });

  it('lets archers inflict losses before contact without forced movement', () => {
    const source = createPlayableBattle({
      seed: 'archer-volley',
      units: [
        createUnitState({
          id: 'archers',
          unitType: 'ARCHER',
          troopCount: 120,
          initialTroopCount: 120,
          attack: 12,
          position: { x: 0, y: 0 },
        }),
      ],
      monsterGroup: createMonsterGroupState({
        id: 'greyfang',
        leaderId: 'greyfang-alpha',
        troopCount: 80,
        initialTroopCount: 80,
        position: { x: 20, y: 0 },
      }),
    });

    const result = resolveFixedOrder({
      battle: source,
      order: { unitId: 'archers', action: 'ATTACK' },
    });

    expect(result.units[0]?.position).toEqual(source.units[0]?.position);
    expect(result.monsterGroup.troopCount).toBeLessThan(source.monsterGroup.troopCount);
    expect(result.events.some((event) => event.type === 'RANGED_VOLLEY_RESOLVED')).toBe(true);
    expect(result.events.some((event) => event.type === 'CASUALTIES_APPLIED')).toBe(false);
  });

  it('replays a complete fixed-order sequence identically from the same seed', () => {
    const orders: FixedOrder[] = [
      { unitId: 'heavy', action: 'ADVANCE' },
      { unitId: 'heavy', action: 'CHANGE_FORMATION', formation: 'LINE' },
      { unitId: 'heavy', action: 'HOLD' },
      { unitId: 'heavy', action: 'ATTACK' },
    ];
    const replay = () =>
      orders.reduce((battle, order) => resolveFixedOrder({ battle, order }), battleAtDistance(40));

    expect(replay()).toEqual(replay());
  });

  it('lets repeated attacks rout the Greyfang pack and end in victory', () => {
    let battle = battleAtDistance(1);

    for (let turn = 0; turn < 10 && battle.outcome === 'IN_PROGRESS'; turn += 1) {
      battle = resolveFixedOrder({
        battle,
        order: { unitId: 'heavy', action: 'ATTACK' },
      });
    }

    expect(battle.outcome).toBe('VICTORY');
    expect(battle.monsterGroup.behaviorState).toBe('ROUTING');
    expect(battle.events.at(-1)?.type).toBe('BATTLE_ENDED');
  });

  it('allows an explicit retreat without resolving combat', () => {
    const result = issue({ unitId: 'heavy', action: 'RETREAT' });

    expect(result.outcome).toBe('RETREATED');
    expect(result.units[0]?.executionState).toBe('RETREATING');
    expect(result.events.at(-1)?.type).toBe('BATTLE_ENDED');
  });

  it('ends in defeat when the acting unit routes during contact', () => {
    const source = battleAtDistance(1);
    const fragile = source.units[0];
    if (fragile === undefined) throw new Error('test requires a player unit');

    const result = resolveFixedOrder({
      battle: {
        ...source,
        units: [
          {
            ...fragile,
            troopCount: 1,
            initialTroopCount: 1,
            morale: 0.01,
            moraleState: 'BREAKING',
          },
        ],
      },
      order: { unitId: 'heavy', action: 'ATTACK' },
    });

    expect(result.outcome).toBe('DEFEAT');
    expect(result.units[0]?.executionState).toBe('ROUTING');
    expect(result.events.at(-1)?.type).toBe('BATTLE_ENDED');
  });
});
