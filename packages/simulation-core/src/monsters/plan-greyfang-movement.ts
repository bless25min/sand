import type { MonsterGroupState, Vec2 } from '@expedition/shared-types';

import type { GreyfangMovementPlan } from './greyfang-movement-plan';

export interface PlanGreyfangMovementInput {
  readonly pack: MonsterGroupState;
  readonly targetPosition: Vec2;
  readonly leaderAlive: boolean;
}

const ENGAGEMENT_RANGE = 1.5;
const ENCIRCLEMENT_RANGE = 6;
const FLANK_DISTANCE = 1.75;

function normalize(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function deterministicFlankSide(id: string): -1 | 1 {
  let hash = 0;

  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % 2 === 0 ? 1 : -1;
}

export function planGreyfangMovement(input: PlanGreyfangMovementInput): GreyfangMovementPlan {
  const toTarget = {
    x: input.targetPosition.x - input.pack.position.x,
    y: input.targetPosition.y - input.pack.position.y,
  };
  const distance = Math.hypot(toTarget.x, toTarget.y);
  const targetDirection = normalize(toTarget);

  if (!input.leaderAlive) {
    return {
      behaviorState: input.pack.morale <= 0.25 ? 'ROUTING' : 'RETREATING',
      direction: { x: -targetDirection.x, y: -targetDirection.y },
      targetPosition: {
        x: input.pack.position.x - targetDirection.x * ENCIRCLEMENT_RANGE,
        y: input.pack.position.y - targetDirection.y * ENCIRCLEMENT_RANGE,
      },
      speedMultiplier: input.pack.morale <= 0.25 ? 1.3 : 1.1,
    };
  }

  if (distance <= ENGAGEMENT_RANGE) {
    return {
      behaviorState: 'ENGAGED',
      direction: targetDirection,
      targetPosition: input.targetPosition,
      speedMultiplier: 0,
    };
  }

  if (distance <= ENCIRCLEMENT_RANGE) {
    const flankSide = deterministicFlankSide(input.pack.id);
    const flankPosition = {
      x: input.targetPosition.x - targetDirection.y * FLANK_DISTANCE * flankSide,
      y: input.targetPosition.y + targetDirection.x * FLANK_DISTANCE * flankSide,
    };

    return {
      behaviorState: 'ENCIRCLING',
      direction: normalize({
        x: flankPosition.x - input.pack.position.x,
        y: flankPosition.y - input.pack.position.y,
      }),
      targetPosition: flankPosition,
      speedMultiplier: 1,
    };
  }

  return {
    behaviorState: 'HUNTING',
    direction: targetDirection,
    targetPosition: input.targetPosition,
    speedMultiplier: 1.15,
  };
}
