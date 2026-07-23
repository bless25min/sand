import type { BattleState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { assertBattleState, findBattleStateViolations } from './assert-battle-state';

const validState: BattleState = {
  schemaVersion: '1',
  gameVersion: '0.1.0',
  rulesVersion: '1',
  seed: 'greyfang',
  tick: 0,
  grid: { width: 128, height: 128, cells: [] },
  units: [],
  monsterGroups: [],
  events: [],
};

describe('battle state invariants', () => {
  it('accepts a valid empty battle state', () => {
    expect(findBattleStateViolations(validState)).toEqual([]);
    expect(() => assertBattleState(validState)).not.toThrow();
  });

  it('reports invalid dimensions, tick, and duplicate actor ids', () => {
    const invalidState: BattleState = {
      ...validState,
      tick: -1,
      grid: { width: 0, height: 128, cells: [] },
      units: [
        {
          id: 'duplicate',
          definitionId: 'heavy',
          factionId: 'player',
          name: 'First Heavy',
          unitType: 'HEAVY_INFANTRY',
          classId: 'infantry',
          level: 1,
          experience: 0,
          troopCount: 100,
          initialTroopCount: 100,
          woundedCount: 0,
          deadCount: 0,
          routedCount: 0,
          missingCount: 0,
          capturedCount: 0,
          position: { x: 0, y: 0 },
          direction: { x: 1, y: 0 },
          morale: 1,
          moraleState: 'STEADY',
          fatigue: 0,
          cohesion: 1,
          discipline: 1,
          commandEfficiency: 1,
          attack: 10,
          defense: 10,
          mobility: 1,
          carryingCapacity: 10,
          formation: 'DENSE_BLOCK',
          executionState: 'IDLE',
          equipmentLoadoutId: 'starter',
          skillIds: [],
          passiveIds: [],
          statusEffectIds: [],
        },
      ],
      monsterGroups: [
        {
          id: 'duplicate',
          definitionId: 'greyfang-wolf',
          factionId: 'monsters',
          troopCount: 20,
          initialTroopCount: 20,
          woundedCount: 0,
          deadCount: 0,
          routedCount: 0,
          missingCount: 0,
          capturedCount: 0,
          position: { x: 1, y: 1 },
          direction: { x: -1, y: 0 },
          morale: 1,
          fatigue: 0,
          cohesion: 0.4,
          behaviorState: 'IDLE',
          abilityIds: [],
          statusEffectIds: [],
        },
      ],
    };

    expect(findBattleStateViolations(invalidState)).toEqual([
      { code: 'NEGATIVE_TICK', path: 'tick' },
      { code: 'INVALID_GRID_WIDTH', path: 'grid.width' },
      { code: 'DUPLICATE_ACTOR_ID', path: 'monsterGroups[0].id' },
    ]);
    expect(() => assertBattleState(invalidState)).toThrow('BattleState invariant violation');
  });
});
