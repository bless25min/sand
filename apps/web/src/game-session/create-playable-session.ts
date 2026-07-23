import { createEmptyInventory } from '@expedition/progression-core';
import { createGreyfangPack, createPlayableBattle } from '@expedition/simulation-core';

import { createPlayerArmy } from './create-player-army';
import type { PlayableSessionState } from './playable-session-types';

const PLAYABLE_SESSION_SEED = 'greyfang-road-01';

export function createPlayableSession(seed: string = PLAYABLE_SESSION_SEED): PlayableSessionState {
  const army = createPlayerArmy();
  const monsterGroup = createGreyfangPack({
    id: 'greyfang-pack',
    leaderId: 'greyfang-alpha',
    troopCount: 1_200,
    position: { x: 78, y: 30 },
    factionId: 'greyfang',
  });

  return {
    seed,
    phase: 'BATTLE',
    battleNumber: 1,
    selectedUnitId: army[0]?.id ?? '',
    battle: createPlayableBattle({ seed, units: army, monsterGroup }),
    army,
    drops: [],
    inventory: createEmptyInventory(40),
    recoveredDropIds: [],
    shieldEquipped: false,
  };
}
