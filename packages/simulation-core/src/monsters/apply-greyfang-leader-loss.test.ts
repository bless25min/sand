import { createMonsterGroupState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { applyGreyfangLeaderLoss } from './apply-greyfang-leader-loss';

describe('applyGreyfangLeaderLoss', () => {
  const pack = createMonsterGroupState({
    id: 'greyfang-pack-1',
    definitionId: 'greyfang-wolf',
    leaderId: 'greyfang-alpha-1',
    morale: 0.5,
    cohesion: 0.35,
  });

  it('drops morale and cohesion, retreats, and emits an explainable event', () => {
    const result = applyGreyfangLeaderLoss({
      pack,
      tick: 12,
    });

    expect(result.monsterGroup).toMatchObject({
      morale: 0.15,
      cohesion: 0.2,
      behaviorState: 'ROUTING',
      statusEffectIds: ['GREYFANG_LEADER_LOST'],
    });
    expect(result.events).toEqual([
      {
        id: 'event-greyfang-pack-1-leader-loss-12',
        tick: 12,
        type: 'MORALE_CHANGED',
        sourceIds: ['greyfang-alpha-1'],
        targetIds: ['greyfang-pack-1'],
        position: pack.position,
        causes: ['GREYFANG_LEADER_DEFEATED'],
        effects: {
          moraleBefore: 0.5,
          moraleAfter: 0.15,
          cohesionBefore: 0.35,
          cohesionAfter: 0.2,
        },
        visibility: 'PLAYER',
      },
    ]);
  });

  it('is idempotent once the loss has been applied', () => {
    const first = applyGreyfangLeaderLoss({ pack, tick: 12 });
    const second = applyGreyfangLeaderLoss({
      pack: first.monsterGroup,
      tick: 13,
    });

    expect(second.monsterGroup).toBe(first.monsterGroup);
    expect(second.events).toEqual([]);
  });
});
