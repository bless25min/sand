import { createMonsterGroupState, createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { isRangedVolleyAvailable, resolveRangedVolley } from './resolve-ranged-volley';

function rangedActors(distance = 20) {
  return {
    unit: createUnitState({
      id: 'archers',
      unitType: 'ARCHER',
      troopCount: 120,
      initialTroopCount: 120,
      attack: 12,
      position: { x: 0, y: 0 },
    }),
    monster: createMonsterGroupState({
      id: 'greyfang',
      troopCount: 80,
      initialTroopCount: 80,
      morale: 0.8,
      position: { x: distance, y: 0 },
    }),
  };
}

describe('resolveRangedVolley', () => {
  it('applies deterministic pre-contact losses and a traceable event', () => {
    const actors = rangedActors();
    const input = { seed: 'volley-seed', tick: 2, ...actors };

    const first = resolveRangedVolley(input);
    const replay = resolveRangedVolley(input);

    expect(replay).toEqual(first);
    expect(first.monster.troopCount).toBeLessThan(actors.monster.troopCount);
    expect(first.monster.morale).toBeLessThan(actors.monster.morale);
    expect(first.events).toEqual([
      expect.objectContaining({
        type: 'RANGED_VOLLEY_RESOLVED',
        sourceIds: ['archers'],
        targetIds: ['greyfang'],
        causes: ['ATTACK', 'ARCHER_VOLLEY'],
      }),
    ]);
  });

  it('is available only outside contact and inside maximum range', () => {
    expect(isRangedVolleyAvailable(rangedActors(20))).toBe(true);
    expect(isRangedVolleyAvailable(rangedActors(2))).toBe(false);
    expect(isRangedVolleyAvailable(rangedActors(40))).toBe(false);
  });
});
