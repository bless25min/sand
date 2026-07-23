import { describe, expect, it } from 'vitest';

import { createBattleState } from './create-battle-state';

describe('createBattleState', () => {
  it('starts a deterministic battle at tick zero with no events', () => {
    const state = createBattleState({
      schemaVersion: '1',
      gameVersion: '0.1.0',
      rulesVersion: '1',
      seed: 'greyfang',
      grid: { width: 128, height: 128, cells: [] },
    });

    expect(state.tick).toBe(0);
    expect(state.seed).toBe('greyfang');
    expect(state.units).toEqual([]);
    expect(state.monsterGroups).toEqual([]);
    expect(state.events).toEqual([]);
  });
});
