import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { applyUnitStatModifiers } from './apply-unit-stat-modifiers';

describe('applyUnitStatModifiers', () => {
  it('adds every supported modifier without changing troop or casualty state', () => {
    const unit = createUnitState({
      attack: 10.1234,
      defense: 20.1234,
      frontalDefense: 30.1234,
      mobility: 2.1234,
      discipline: 1.1234,
      commandEfficiency: 0.9234,
      troopCount: 87,
      initialTroopCount: 100,
      woundedCount: 5,
      deadCount: 4,
      routedCount: 3,
      missingCount: 2,
      capturedCount: 1,
    });

    const updated = applyUnitStatModifiers(unit, {
      attack: 0.00006,
      defense: -0.12346,
      frontalDefense: 0.87656,
      mobility: -0.12346,
      discipline: 0.5,
      commandEfficiency: -0.02346,
    });

    expect(updated).toMatchObject({
      attack: 10.1235,
      defense: 19.9999,
      frontalDefense: 31,
      mobility: 1.9999,
      discipline: 1.6234,
      commandEfficiency: 0.8999,
      troopCount: 87,
      initialTroopCount: 100,
      woundedCount: 5,
      deadCount: 4,
      routedCount: 3,
      missingCount: 2,
      capturedCount: 1,
    });
  });

  it('does not mutate the source unit and defaults missing modifiers to zero', () => {
    const unit = createUnitState();
    const updated = applyUnitStatModifiers(unit, { attack: 1 });

    expect(updated).not.toBe(unit);
    expect(updated.attack).toBe(11);
    expect(updated.defense).toBe(10);
    expect(unit).toEqual(createUnitState());
  });
});
