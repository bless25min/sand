import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { createUnitCombatSnapshot } from './create-unit-combat-snapshot';

describe('createUnitCombatSnapshot', () => {
  const shieldedUnit = createUnitState({
    defense: 10,
    frontalDefense: 16,
  });

  it('uses frontal defense for frontal contact', () => {
    const snapshot = createUnitCombatSnapshot({
      unit: shieldedUnit,
      contactType: 'FRONTAL',
    });

    expect(snapshot.defense).toBe(16);
  });

  it('uses base defense when attacked from a flank', () => {
    const snapshot = createUnitCombatSnapshot({
      unit: shieldedUnit,
      contactType: 'FLANK',
    });

    expect(snapshot.defense).toBe(10);
  });
});
