import type { BattleState } from '@expedition/shared-types';

import type { CreateBattleStateInput } from './battle-state-input';

export function createBattleState(input: CreateBattleStateInput): BattleState {
  return {
    schemaVersion: input.schemaVersion,
    gameVersion: input.gameVersion,
    rulesVersion: input.rulesVersion,
    seed: input.seed,
    tick: 0,
    grid: input.grid,
    units: input.units === undefined ? [] : [...input.units],
    monsterGroups: input.monsterGroups === undefined ? [] : [...input.monsterGroups],
    events: [],
  };
}
