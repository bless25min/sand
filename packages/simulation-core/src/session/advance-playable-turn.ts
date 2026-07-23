import type { FixedOrder, MonsterGroupState, UnitState } from '@expedition/shared-types';

import { planGreyfangMovement } from '../monsters/plan-greyfang-movement';
import { advanceUnit } from '../movement/advance-unit';
import { applyMonsterMovementPlan } from './apply-monster-movement-plan';

const GREYFANG_MOVEMENT_DISTANCE = 8;
const GREYFANG_ENCIRCLEMENT_DISTANCE = 2.5;

export interface AdvancePlayableTurnInput {
  readonly unit: UnitState;
  readonly monster: MonsterGroupState;
  readonly order: FixedOrder;
}

export interface AdvancePlayableTurnResult {
  readonly unit: UnitState;
  readonly monster: MonsterGroupState;
  readonly playerMoved: boolean;
  readonly monsterMoved: boolean;
}

export function advancePlayableTurn(input: AdvancePlayableTurnInput): AdvancePlayableTurnResult {
  const playerMoved = input.order.action === 'ADVANCE' || input.order.action === 'ATTACK';
  const unit = playerMoved
    ? advanceUnit({
        unit: input.unit,
        target: input.monster.position,
        equipmentWeight: input.unit.equipmentWeight,
        terrainMovementCost: 1,
        deltaSeconds: 10,
        mode: input.order.action === 'ATTACK' ? 'FORCED_MARCH' : 'NORMAL',
      }).unit
    : { ...input.unit, executionState: 'IDLE' as const };
  const monsterPlan = planGreyfangMovement({
    pack: input.monster,
    targetPosition: unit.position,
    leaderAlive: input.monster.leaderId !== undefined,
  });
  const monster = applyMonsterMovementPlan({
    monster: input.monster,
    plan: monsterPlan,
    baseDistance:
      monsterPlan.behaviorState === 'ENCIRCLING'
        ? GREYFANG_ENCIRCLEMENT_DISTANCE
        : GREYFANG_MOVEMENT_DISTANCE,
  });
  const monsterMoved =
    monster.position.x !== input.monster.position.x ||
    monster.position.y !== input.monster.position.y;

  return { unit, monster, playerMoved, monsterMoved };
}
