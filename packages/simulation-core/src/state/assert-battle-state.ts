import type { BattleState } from '@expedition/shared-types';

export type BattleStateViolationCode =
  'NEGATIVE_TICK' | 'INVALID_GRID_WIDTH' | 'INVALID_GRID_HEIGHT' | 'DUPLICATE_ACTOR_ID';

export interface BattleStateViolation {
  readonly code: BattleStateViolationCode;
  readonly path: string;
}

export function findBattleStateViolations(state: BattleState): BattleStateViolation[] {
  const violations: BattleStateViolation[] = [];

  if (state.tick < 0) {
    violations.push({ code: 'NEGATIVE_TICK', path: 'tick' });
  }

  if (!Number.isInteger(state.grid.width) || state.grid.width <= 0) {
    violations.push({ code: 'INVALID_GRID_WIDTH', path: 'grid.width' });
  }

  if (!Number.isInteger(state.grid.height) || state.grid.height <= 0) {
    violations.push({ code: 'INVALID_GRID_HEIGHT', path: 'grid.height' });
  }

  const actorIds = new Set<string>();

  state.units.forEach((unit, index) => {
    if (actorIds.has(unit.id)) {
      violations.push({ code: 'DUPLICATE_ACTOR_ID', path: `units[${index}].id` });
    }
    actorIds.add(unit.id);
  });

  state.monsterGroups.forEach((monsterGroup, index) => {
    if (actorIds.has(monsterGroup.id)) {
      violations.push({
        code: 'DUPLICATE_ACTOR_ID',
        path: `monsterGroups[${index}].id`,
      });
    }
    actorIds.add(monsterGroup.id);
  });

  return violations;
}

export function assertBattleState(state: BattleState): void {
  const violations = findBattleStateViolations(state);

  if (violations.length > 0) {
    throw new Error(`BattleState invariant violation: ${JSON.stringify(violations)}`);
  }
}
