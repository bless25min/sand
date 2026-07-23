import type { BattleEvent } from '../events/battle-event';
import type { GridState } from '../grid/grid-state';
import type { MonsterGroupState } from '../monsters/monster-group-state';
import type { UnitState } from '../units/unit-state';

export interface BattleState {
  readonly schemaVersion: string;
  readonly gameVersion: string;
  readonly rulesVersion: string;
  readonly seed: string;
  readonly tick: number;
  readonly grid: GridState;
  readonly units: readonly UnitState[];
  readonly monsterGroups: readonly MonsterGroupState[];
  readonly events: readonly BattleEvent[];
}
