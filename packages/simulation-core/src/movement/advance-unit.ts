import type { UnitState, Vec2 } from '@expedition/shared-types';

import { calculateMovementStep, type MovementStep } from './calculate-movement-step';
import type { MovementMode } from './movement-mode';

export interface AdvanceUnitInput {
  readonly unit: UnitState;
  readonly target: Vec2;
  readonly equipmentWeight: number;
  readonly terrainMovementCost: number;
  readonly deltaSeconds: number;
  readonly mode: MovementMode;
}

export interface AdvanceUnitResult {
  readonly unit: UnitState;
  readonly movement: MovementStep;
}

function directionToward(position: Vec2, target: Vec2, fallback: Vec2): Vec2 {
  const deltaX = target.x - position.x;
  const deltaY = target.y - position.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance === 0) {
    return fallback;
  }

  return {
    x: deltaX / distance,
    y: deltaY / distance,
  };
}

export function advanceUnit(input: AdvanceUnitInput): AdvanceUnitResult {
  const movement = calculateMovementStep({
    position: input.unit.position,
    target: input.target,
    mobility: input.unit.mobility,
    fatigue: input.unit.fatigue,
    formation: input.unit.formation,
    equipmentWeight: input.equipmentWeight,
    carryingCapacity: input.unit.carryingCapacity,
    terrainMovementCost: input.terrainMovementCost,
    deltaSeconds: input.deltaSeconds,
    mode: input.mode,
  });
  const direction = directionToward(input.unit.position, input.target, input.unit.direction);
  const { targetPosition: previousTarget, ...unitWithoutTarget } = input.unit;
  void previousTarget;

  const unit: UnitState = movement.arrived
    ? {
        ...unitWithoutTarget,
        position: movement.position,
        direction,
        fatigue: movement.fatigue,
        executionState: 'IDLE',
      }
    : {
        ...unitWithoutTarget,
        position: movement.position,
        direction,
        targetPosition: input.target,
        fatigue: movement.fatigue,
        executionState: 'MOVING',
      };

  return {
    unit,
    movement,
  };
}
