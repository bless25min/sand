import type { FormationType, Vec2 } from '@expedition/shared-types';

import { getFormationProfile } from './formation-profile';
import type { MovementMode } from './movement-mode';

const FORCED_MARCH_SPEED_MULTIPLIER = 1.4;
const FORCED_MARCH_FATIGUE_MULTIPLIER = 2;
const FATIGUE_PER_DISTANCE = 0.002;

export interface CalculateMovementStepInput {
  readonly position: Vec2;
  readonly target: Vec2;
  readonly mobility: number;
  readonly fatigue: number;
  readonly formation: FormationType;
  readonly equipmentWeight: number;
  readonly carryingCapacity: number;
  readonly terrainMovementCost: number;
  readonly deltaSeconds: number;
  readonly mode: MovementMode;
}

export interface MovementStep {
  readonly position: Vec2;
  readonly distanceMoved: number;
  readonly fatigue: number;
  readonly fatigueDelta: number;
  readonly arrived: boolean;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number`);
  }
}

function assertVector(vector: Vec2, name: string): void {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new RangeError(`${name} must contain finite coordinates`);
  }
}

export function calculateMovementStep(input: CalculateMovementStepInput): MovementStep {
  assertVector(input.position, 'position');
  assertVector(input.target, 'target');
  assertNonNegativeFinite(input.mobility, 'mobility');
  assertNonNegativeFinite(input.fatigue, 'fatigue');
  assertNonNegativeFinite(input.equipmentWeight, 'equipmentWeight');
  assertNonNegativeFinite(input.carryingCapacity, 'carryingCapacity');
  assertNonNegativeFinite(input.deltaSeconds, 'deltaSeconds');

  if (!Number.isFinite(input.terrainMovementCost) || input.terrainMovementCost <= 0) {
    throw new RangeError('terrainMovementCost must be greater than zero');
  }

  const deltaX = input.target.x - input.position.x;
  const deltaY = input.target.y - input.position.y;
  const targetDistance = Math.hypot(deltaX, deltaY);

  if (targetDistance === 0) {
    return {
      position: input.target,
      distanceMoved: 0,
      fatigue: clamp(input.fatigue, 0, 1),
      fatigueDelta: 0,
      arrived: true,
    };
  }

  const profile = getFormationProfile(input.formation);
  const loadRatio =
    input.carryingCapacity === 0
      ? input.equipmentWeight === 0
        ? 0
        : Number.POSITIVE_INFINITY
      : input.equipmentWeight / input.carryingCapacity;
  const encumbranceMultiplier = clamp(1 - loadRatio * 0.4, 0.35, 1);
  const fatigueMultiplier = clamp(1 - input.fatigue * 0.5, 0.5, 1);
  const marchSpeedMultiplier = input.mode === 'FORCED_MARCH' ? FORCED_MARCH_SPEED_MULTIPLIER : 1;
  const distanceBudget =
    (input.mobility *
      profile.speedMultiplier *
      fatigueMultiplier *
      encumbranceMultiplier *
      marchSpeedMultiplier *
      input.deltaSeconds) /
    input.terrainMovementCost;
  const distanceMoved = Math.min(targetDistance, distanceBudget);
  const progress = distanceMoved / targetDistance;
  const marchFatigueMultiplier =
    input.mode === 'FORCED_MARCH' ? FORCED_MARCH_FATIGUE_MULTIPLIER : 1;
  const finiteLoadRatio = Number.isFinite(loadRatio) ? loadRatio : 1;
  const fatigueDelta =
    distanceMoved *
    FATIGUE_PER_DISTANCE *
    profile.fatigueMultiplier *
    marchFatigueMultiplier *
    (1 + finiteLoadRatio * 0.25);

  return {
    position: {
      x: input.position.x + deltaX * progress,
      y: input.position.y + deltaY * progress,
    },
    distanceMoved,
    fatigue: clamp(input.fatigue + fatigueDelta, 0, 1),
    fatigueDelta,
    arrived: distanceMoved === targetDistance,
  };
}
