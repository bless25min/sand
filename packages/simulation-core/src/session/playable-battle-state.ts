import type {
  BattleEvent,
  FixedOrder,
  MonsterGroupState,
  UnitState,
} from '@expedition/shared-types';

export type PlayableBattleOutcome = 'IN_PROGRESS' | 'VICTORY' | 'RETREATED' | 'DEFEAT';

export interface PlayableBattleLootFacts {
  readonly defeatedWolves: number;
  readonly defeatedHornedAlphas: number;
}

export interface PlayableBattleState {
  readonly seed: string;
  readonly tick: number;
  readonly units: readonly UnitState[];
  readonly monsterGroup: MonsterGroupState;
  readonly outcome: PlayableBattleOutcome;
  readonly events: readonly BattleEvent[];
  readonly lastOrder?: FixedOrder;
  readonly lootFacts?: PlayableBattleLootFacts;
}
