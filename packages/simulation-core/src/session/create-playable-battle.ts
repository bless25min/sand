import type { MonsterGroupState, UnitState } from '@expedition/shared-types';

import type { PlayableBattleState } from './playable-battle-state';

export interface CreatePlayableBattleInput {
  readonly seed: string;
  readonly units: readonly UnitState[];
  readonly monsterGroup: MonsterGroupState;
}

export function createPlayableBattle(input: CreatePlayableBattleInput): PlayableBattleState {
  if (input.seed.length === 0) {
    throw new Error('playable battle seed must not be empty');
  }
  if (input.units.length === 0) {
    throw new Error('playable battle requires at least one unit');
  }

  return {
    seed: input.seed,
    tick: 0,
    units: [...input.units],
    monsterGroup: { ...input.monsterGroup },
    outcome: 'IN_PROGRESS',
    events: [
      {
        id: `battle:${input.seed}:started`,
        tick: 0,
        type: 'BATTLE_STARTED',
        sourceIds: input.units.map((unit) => unit.id),
        targetIds: [input.monsterGroup.id],
        causes: [input.seed],
        effects: { unitCount: input.units.length },
        visibility: 'PLAYER',
      },
    ],
  };
}
