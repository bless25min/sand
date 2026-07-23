import { createMonsterGroupState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { planGreyfangMovement } from './plan-greyfang-movement';

describe('planGreyfangMovement', () => {
  const pack = createMonsterGroupState({
    id: 'greyfang-pack-1',
    definitionId: 'greyfang-wolf',
    position: { x: 0, y: 0 },
  });

  it('hunts directly while the target is distant', () => {
    const plan = planGreyfangMovement({
      pack,
      targetPosition: { x: 10, y: 0 },
      leaderAlive: true,
    });

    expect(plan).toEqual({
      behaviorState: 'HUNTING',
      direction: { x: 1, y: 0 },
      targetPosition: { x: 10, y: 0 },
      speedMultiplier: 1.15,
    });
  });

  it('moves toward a deterministic flank at encirclement range', () => {
    const first = planGreyfangMovement({
      pack,
      targetPosition: { x: 4, y: 0 },
      leaderAlive: true,
    });
    const second = planGreyfangMovement({
      pack,
      targetPosition: { x: 4, y: 0 },
      leaderAlive: true,
    });

    expect(first).toEqual(second);
    expect(first.behaviorState).toBe('ENCIRCLING');
    expect(first.targetPosition).not.toEqual({ x: 4, y: 0 });
    expect(first.speedMultiplier).toBe(1);
  });

  it('engages at contact range', () => {
    const plan = planGreyfangMovement({
      pack,
      targetPosition: { x: 1, y: 0 },
      leaderAlive: true,
    });

    expect(plan.behaviorState).toBe('ENGAGED');
    expect(plan.speedMultiplier).toBe(0);
  });

  it('routes away when leader loss leaves morale critical', () => {
    const plan = planGreyfangMovement({
      pack: { ...pack, morale: 0.2 },
      targetPosition: { x: 2, y: 0 },
      leaderAlive: false,
    });

    expect(plan.behaviorState).toBe('ROUTING');
    expect(plan.direction.x).toBeLessThan(0);
    expect(plan.speedMultiplier).toBe(1.3);
  });
});
