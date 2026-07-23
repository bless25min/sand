import type { MonsterBehaviorState, Vec2 } from '@expedition/shared-types';

export interface GreyfangMovementPlan {
  readonly behaviorState: MonsterBehaviorState;
  readonly direction: Vec2;
  readonly targetPosition: Vec2;
  readonly speedMultiplier: number;
}
