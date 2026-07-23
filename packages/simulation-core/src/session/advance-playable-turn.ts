import type { FixedOrder, MonsterGroupState, UnitState } from '@expedition/shared-types';

import { advanceUnit } from '../movement/advance-unit';
import { moveMonsterToward } from './move-monster-toward';

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
  const monster = moveMonsterToward(input.monster, unit.position, 8);
  const monsterMoved =
    monster.position.x !== input.monster.position.x ||
    monster.position.y !== input.monster.position.y;

  return { unit, monster, playerMoved, monsterMoved };
}
