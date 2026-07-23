import { describe, expect, it } from 'vitest';

import { calculateMovementStep, type CalculateMovementStepInput } from './calculate-movement-step';

const baseInput: CalculateMovementStepInput = {
  position: { x: 0, y: 0 },
  target: { x: 10, y: 0 },
  mobility: 2,
  fatigue: 0,
  formation: 'LINE',
  equipmentWeight: 2,
  carryingCapacity: 10,
  terrainMovementCost: 1,
  deltaSeconds: 1,
  mode: 'NORMAL',
};

describe('calculateMovementStep', () => {
  it('moves toward the target without overshooting', () => {
    const result = calculateMovementStep(baseInput);

    expect(result.position.x).toBeGreaterThan(0);
    expect(result.position.x).toBeLessThan(10);
    expect(result.position.y).toBe(0);
    expect(result.distanceMoved).toBeCloseTo(result.position.x);
    expect(result.arrived).toBe(false);
  });

  it('makes Forced March faster and more fatiguing', () => {
    const normal = calculateMovementStep(baseInput);
    const forced = calculateMovementStep({
      ...baseInput,
      mode: 'FORCED_MARCH',
    });

    expect(forced.distanceMoved).toBeGreaterThan(normal.distanceMoved);
    expect(forced.fatigueDelta).toBeGreaterThan(normal.fatigueDelta);
  });

  it('makes heavy equipment slower than light equipment', () => {
    const light = calculateMovementStep({
      ...baseInput,
      equipmentWeight: 1,
    });
    const heavy = calculateMovementStep({
      ...baseInput,
      equipmentWeight: 9,
    });

    expect(heavy.distanceMoved).toBeLessThan(light.distanceMoved);
  });

  it('slows movement on higher-cost terrain', () => {
    const plain = calculateMovementStep(baseInput);
    const mud = calculateMovementStep({
      ...baseInput,
      terrainMovementCost: 2,
    });

    expect(mud.distanceMoved).toBeCloseTo(plain.distanceMoved / 2);
  });

  it('arrives exactly at a nearby target', () => {
    const result = calculateMovementStep({
      ...baseInput,
      target: { x: 0.25, y: 0 },
    });

    expect(result.position).toEqual({ x: 0.25, y: 0 });
    expect(result.distanceMoved).toBe(0.25);
    expect(result.arrived).toBe(true);
  });

  it('rejects invalid movement inputs', () => {
    expect(() => calculateMovementStep({ ...baseInput, terrainMovementCost: 0 })).toThrow(
      'terrainMovementCost must be greater than zero',
    );
    expect(() => calculateMovementStep({ ...baseInput, equipmentWeight: -1 })).toThrow(
      'equipmentWeight must be a non-negative finite number',
    );
    expect(() => calculateMovementStep({ ...baseInput, deltaSeconds: Number.NaN })).toThrow(
      'deltaSeconds must be a non-negative finite number',
    );
  });
});
