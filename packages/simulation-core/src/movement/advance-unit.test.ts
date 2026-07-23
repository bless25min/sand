import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { advanceUnit } from './advance-unit';

describe('advanceUnit', () => {
  it('returns a moving copy without mutating the source unit', () => {
    const unit = createUnitState({
      position: { x: 0, y: 0 },
      executionState: 'IDLE',
      formation: 'LINE',
    });
    const sourceSnapshot = structuredClone(unit);

    const result = advanceUnit({
      unit,
      target: { x: 10, y: 0 },
      equipmentWeight: 2,
      terrainMovementCost: 1,
      deltaSeconds: 1,
      mode: 'NORMAL',
    });

    expect(result.unit).not.toBe(unit);
    expect(result.unit.position.x).toBeGreaterThan(0);
    expect(result.unit.targetPosition).toEqual({ x: 10, y: 0 });
    expect(result.unit.executionState).toBe('MOVING');
    expect(unit).toEqual(sourceSnapshot);
  });

  it('clears the active target after arrival', () => {
    const unit = createUnitState({
      position: { x: 0, y: 0 },
      formation: 'LINE',
    });

    const result = advanceUnit({
      unit,
      target: { x: 0.25, y: 0 },
      equipmentWeight: 2,
      terrainMovementCost: 1,
      deltaSeconds: 1,
      mode: 'NORMAL',
    });

    expect(result.unit.position).toEqual({ x: 0.25, y: 0 });
    expect(result.unit.executionState).toBe('IDLE');
    expect('targetPosition' in result.unit).toBe(false);
  });
});
