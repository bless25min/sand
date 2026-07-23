import type { GridState, MonsterGroupState, UnitState } from '@expedition/shared-types';

export interface CreateBattleStateInput {
  readonly schemaVersion: string;
  readonly gameVersion: string;
  readonly rulesVersion: string;
  readonly seed: string;
  readonly grid: GridState;
  readonly units?: readonly UnitState[];
  readonly monsterGroups?: readonly MonsterGroupState[];
}
