import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  BattleState,
  ContactZone,
  GridCellState,
  MonsterGroupState,
  UnitState,
} from '../index';

describe('BattleState contract', () => {
  it('contains deterministic replay inputs and battle-owned collections', () => {
    const state: BattleState = {
      schemaVersion: '1',
      gameVersion: '0.1.0',
      rulesVersion: '1',
      seed: 'greyfang',
      tick: 0,
      grid: {
        width: 128,
        height: 128,
        cells: [],
      },
      units: [],
      monsterGroups: [],
      events: [],
    };

    expect(state.seed).toBe('greyfang');
    expect(state.tick).toBe(0);
    expectTypeOf(state.units).toEqualTypeOf<readonly UnitState[]>();
    expectTypeOf(state.monsterGroups).toEqualTypeOf<readonly MonsterGroupState[]>();
  });

  it('describes projected cell metrics and a serializable contact zone', () => {
    const cell: GridCellState = {
      index: 0,
      position: { x: 0, y: 0 },
      terrain: 'PLAIN',
      height: 0,
      movementCost: 1,
      factionDensity: { player: 100, monsters: 20 },
      factionPressure: {},
      factionMorale: { player: 1, monsters: 0.8 },
      factionCohesion: { player: 1, monsters: 0.4 },
      factionFlow: {
        player: { x: 1, y: 0 },
        monsters: { x: -1, y: 0 },
      },
      activeUnitIds: ['heavy-1'],
      activeMonsterIds: ['wolves-1'],
      environmentalEffects: [],
      isActiveContactCell: true,
    };
    const zone: ContactZone = {
      id: 'contact-0-player-monsters',
      cellIndices: [0],
      attackingFactionId: 'player',
      defendingFactionId: 'monsters',
      attackingUnitIds: ['heavy-1'],
      defendingUnitIds: ['wolves-1'],
      contactNormal: { x: 1, y: 0 },
      width: 1,
      attackingPressure: 0,
      defendingPressure: 0,
      contactType: 'FRONTAL',
    };

    expect(cell.factionDensity.player).toBe(100);
    expect(zone.cellIndices).toEqual([0]);
  });
});
