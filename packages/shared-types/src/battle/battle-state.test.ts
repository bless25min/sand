import { describe, expect, expectTypeOf, it } from 'vitest';

import type { BattleState, MonsterGroupState, UnitState } from '../index';

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
});
