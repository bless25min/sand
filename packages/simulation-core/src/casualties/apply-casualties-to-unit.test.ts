import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { applyCasualtiesToUnit } from './apply-casualties-to-unit';

describe('applyCasualtiesToUnit', () => {
  it('moves active troops into casualty categories without mutation', () => {
    const unit = createUnitState();
    const sourceSnapshot = structuredClone(unit);
    const next = applyCasualtiesToUnit(unit, {
      wounded: 5,
      dead: 3,
      routed: 1,
      missing: 1,
      captured: 0,
    });

    expect(next.troopCount).toBe(90);
    expect(next.woundedCount).toBe(5);
    expect(next.deadCount).toBe(3);
    expect(next.routedCount).toBe(1);
    expect(next.missingCount).toBe(1);
    expect(next.capturedCount).toBe(0);
    expect(
      next.troopCount +
        next.woundedCount +
        next.deadCount +
        next.routedCount +
        next.missingCount +
        next.capturedCount,
    ).toBe(next.initialTroopCount);
    expect(unit).toEqual(sourceSnapshot);
  });

  it('rejects invalid or over-budget allocations', () => {
    const unit = createUnitState({ troopCount: 10, initialTroopCount: 10 });

    expect(() =>
      applyCasualtiesToUnit(unit, {
        wounded: 11,
        dead: 0,
        routed: 0,
        missing: 0,
        captured: 0,
      }),
    ).toThrow('casualty allocation exceeds active troop count');
    expect(() =>
      applyCasualtiesToUnit(unit, {
        wounded: -1,
        dead: 0,
        routed: 0,
        missing: 0,
        captured: 0,
      }),
    ).toThrow('casualty allocation values must be non-negative integers');
  });
});
