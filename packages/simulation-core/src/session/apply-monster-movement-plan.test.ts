import { createMonsterGroupState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { applyMonsterMovementPlan } from './apply-monster-movement-plan';

describe('applyMonsterMovementPlan', () => {
  it('moves toward the planned flank target and preserves encircling intent', () => {
    const monster = createMonsterGroupState({
      position: { x: 0, y: 0 },
      behaviorState: 'HUNTING',
    });

    const result = applyMonsterMovementPlan({
      monster,
      plan: {
        behaviorState: 'ENCIRCLING',
        direction: { x: 1, y: 0 },
        targetPosition: { x: 10, y: 0 },
        speedMultiplier: 1.5,
      },
      baseDistance: 4,
    });

    expect(result.position).toEqual({ x: 6, y: 0 });
    expect(result.targetPosition).toEqual({ x: 10, y: 0 });
    expect(result.direction).toEqual({ x: 1, y: 0 });
    expect(result.behaviorState).toBe('ENCIRCLING');
  });

  it('does not move an engaged group with a zero-speed plan', () => {
    const monster = createMonsterGroupState({
      position: { x: 2, y: 3 },
      behaviorState: 'HUNTING',
    });

    const result = applyMonsterMovementPlan({
      monster,
      plan: {
        behaviorState: 'ENGAGED',
        direction: { x: 0, y: 0 },
        targetPosition: { x: 2, y: 3 },
        speedMultiplier: 0,
      },
      baseDistance: 8,
    });

    expect(result.position).toEqual(monster.position);
    expect(result.behaviorState).toBe('ENGAGED');
  });
});
