import { createGreyfangPack, createPlayableBattle } from '@expedition/simulation-core';
import type { UnitState } from '@expedition/shared-types';

import type { PlayableSessionState } from './playable-session-types';

function prepareRematchArmy(army: readonly UnitState[]): UnitState[] {
  const positions = [
    { x: 10, y: 18 },
    { x: 8, y: 38 },
    { x: 14, y: 52 },
    { x: 6, y: 28 },
  ];

  return army.map((unit, index) => {
    const { targetPosition, ...unitWithoutTarget } = unit;
    void targetPosition;
    return {
      ...unitWithoutTarget,
      position: positions[index] ?? unit.position,
      direction: { x: 1, y: 0 },
      executionState: 'IDLE',
    };
  });
}

export function createPlayableRematch(state: PlayableSessionState): PlayableSessionState {
  const army = prepareRematchArmy(state.army);
  const monsterGroup = createGreyfangPack({
    id: 'greyfang-pack-veteran',
    leaderId: 'greyfang-alpha-veteran',
    troopCount: 1_600,
    position: { x: 82, y: 30 },
    factionId: 'greyfang',
  });

  return {
    ...state,
    phase: 'BATTLE',
    battleNumber: 2,
    selectedUnitId: army[0]?.id ?? state.selectedUnitId,
    battle: createPlayableBattle({
      seed: `${state.seed}:rematch`,
      units: army,
      monsterGroup,
    }),
    army,
    drops: [],
    recoveredDropIds: [],
  };
}
