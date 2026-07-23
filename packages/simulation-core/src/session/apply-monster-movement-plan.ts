import type { MonsterGroupState } from '@expedition/shared-types';

import type { GreyfangMovementPlan } from '../monsters/greyfang-movement-plan';

export interface ApplyMonsterMovementPlanInput {
  readonly monster: MonsterGroupState;
  readonly plan: GreyfangMovementPlan;
  readonly baseDistance: number;
}

export function applyMonsterMovementPlan(
  input: ApplyMonsterMovementPlanInput,
): MonsterGroupState {
  if (!Number.isFinite(input.baseDistance) || input.baseDistance < 0) {
    throw new RangeError('baseDistance must be a non-negative finite number');
  }
  if (!Number.isFinite(input.plan.speedMultiplier) || input.plan.speedMultiplier < 0) {
    throw new RangeError('speedMultiplier must be a non-negative finite number');
  }

  const deltaX = input.plan.targetPosition.x - input.monster.position.x;
  const deltaY = input.plan.targetPosition.y - input.monster.position.y;
  const remainingDistance = Math.hypot(deltaX, deltaY);
  const plannedDistance = input.baseDistance * input.plan.speedMultiplier;
  const step = Math.min(remainingDistance, plannedDistance);
  const position =
    remainingDistance === 0 || step === 0
      ? input.monster.position
      : {
          x: input.monster.position.x + (deltaX / remainingDistance) * step,
          y: input.monster.position.y + (deltaY / remainingDistance) * step,
        };

  return {
    ...input.monster,
    position,
    direction: input.plan.direction,
    targetPosition: input.plan.targetPosition,
    behaviorState: input.plan.behaviorState,
  };
}
