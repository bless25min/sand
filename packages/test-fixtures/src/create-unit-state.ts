import type { UnitState } from '@expedition/shared-types';

const DEFAULT_UNIT: UnitState = {
  id: 'unit-1',
  definitionId: 'heavy-infantry',
  factionId: 'player',
  name: 'First Heavy',
  unitType: 'HEAVY_INFANTRY',
  classId: 'infantry',
  level: 1,
  experience: 0,
  troopCount: 100,
  initialTroopCount: 100,
  woundedCount: 0,
  deadCount: 0,
  routedCount: 0,
  missingCount: 0,
  capturedCount: 0,
  position: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  morale: 1,
  moraleState: 'STEADY',
  fatigue: 0,
  cohesion: 1,
  discipline: 1,
  commandEfficiency: 1,
  attack: 10,
  defense: 10,
  frontalDefense: 10,
  mobility: 2,
  carryingCapacity: 10,
  equipmentWeight: 0,
  formation: 'DENSE_BLOCK',
  executionState: 'IDLE',
  equipmentLoadoutId: 'starter',
  equipmentIds: [],
  appearanceIds: [],
  skillIds: [],
  passiveIds: [],
  statusEffectIds: [],
};

export function createUnitState(overrides: Partial<UnitState> = {}): UnitState {
  return {
    ...DEFAULT_UNIT,
    ...overrides,
  };
}
