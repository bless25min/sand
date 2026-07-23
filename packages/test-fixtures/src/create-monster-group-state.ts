import type { MonsterGroupState } from '@expedition/shared-types';

const DEFAULT_MONSTER_GROUP: MonsterGroupState = {
  id: 'monster-group-1',
  definitionId: 'greyfang-wolf',
  factionId: 'monsters',
  troopCount: 20,
  initialTroopCount: 20,
  woundedCount: 0,
  deadCount: 0,
  routedCount: 0,
  missingCount: 0,
  capturedCount: 0,
  position: { x: 1, y: 0 },
  direction: { x: -1, y: 0 },
  morale: 1,
  fatigue: 0,
  cohesion: 0.4,
  behaviorState: 'IDLE',
  abilityIds: [],
  statusEffectIds: [],
};

export function createMonsterGroupState(
  overrides: Partial<MonsterGroupState> = {},
): MonsterGroupState {
  return {
    ...DEFAULT_MONSTER_GROUP,
    ...overrides,
  };
}
