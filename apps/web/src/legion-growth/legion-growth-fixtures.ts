import { BEAST_HUNTER_MARKSMAN, HEAVY_SHIELD_GUARD } from '@expedition/game-data';
import type { ExperienceAward, UnitClassDefinition, UnitState } from '@expedition/shared-types';

export interface LegionGrowthFixture {
  readonly unit: UnitState;
  readonly awards: readonly ExperienceAward[];
  readonly treatmentCapacity: number;
  readonly availableRecruits: number;
  readonly classDefinition: UnitClassDefinition;
}

const BASE_UNIT: UnitState = {
  id: 'legion-infantry',
  definitionId: 'legion-infantry',
  factionId: 'expedition',
  name: 'Ironwall Infantry',
  unitType: 'HEAVY_INFANTRY',
  classId: 'infantry',
  level: 1,
  experience: 0,
  troopCount: 80,
  initialTroopCount: 100,
  woundedCount: 12,
  deadCount: 8,
  routedCount: 0,
  missingCount: 0,
  capturedCount: 0,
  position: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  targetPosition: { x: 100, y: 0 },
  morale: 0.9,
  moraleState: 'STEADY',
  fatigue: 0.1,
  cohesion: 0.9,
  discipline: 0.9,
  commandEfficiency: 0.9,
  attack: 8,
  defense: 10,
  frontalDefense: 10,
  mobility: 2,
  carryingCapacity: 10,
  equipmentWeight: 2,
  formation: 'DENSE_BLOCK',
  executionState: 'MOVING',
  equipmentLoadoutId: 'starter-infantry',
  equipmentIds: [],
  appearanceIds: [],
  skillIds: [],
  passiveIds: [],
  statusEffectIds: [],
};

export const INFANTRY: LegionGrowthFixture = {
  unit: BASE_UNIT,
  awards: [
    {
      reason: 'BATTLE_PARTICIPATION',
      quantity: 1,
      evidenceIds: ['battle-greyfang:infantry:participation'],
    },
    {
      reason: 'FORMATION_HELD',
      quantity: 1,
      evidenceIds: ['battle-greyfang:infantry:formation-held'],
    },
    {
      reason: 'MONSTER_DEFEATED',
      quantity: 4,
      evidenceIds: [
        'battle-greyfang:infantry:defeat:1',
        'battle-greyfang:infantry:defeat:2',
        'battle-greyfang:infantry:defeat:3',
        'battle-greyfang:infantry:defeat:4',
      ],
    },
  ],
  treatmentCapacity: 7,
  availableRecruits: 10,
  classDefinition: HEAVY_SHIELD_GUARD,
};

export const ARCHER: LegionGrowthFixture = {
  unit: {
    ...BASE_UNIT,
    id: 'legion-archer',
    definitionId: 'legion-archer',
    name: 'Greywind Archers',
    unitType: 'ARCHER',
    classId: 'archer',
    troopCount: 75,
    woundedCount: 15,
    deadCount: 10,
    attack: 9,
    defense: 6,
    frontalDefense: 6,
    mobility: 2.5,
    formation: 'LINE',
    equipmentLoadoutId: 'starter-archer',
  },
  awards: [
    {
      reason: 'BATTLE_PARTICIPATION',
      quantity: 1,
      evidenceIds: ['battle-greyfang:archer:participation'],
    },
    {
      reason: 'COMMAND_COMPLETED',
      quantity: 2,
      evidenceIds: ['battle-greyfang:archer:command:1', 'battle-greyfang:archer:command:2'],
    },
    {
      reason: 'MONSTER_DEFEATED',
      quantity: 3,
      evidenceIds: [
        'battle-greyfang:archer:defeat:1',
        'battle-greyfang:archer:defeat:2',
        'battle-greyfang:archer:defeat:3',
      ],
    },
  ],
  treatmentCapacity: 10,
  availableRecruits: 15,
  classDefinition: BEAST_HUNTER_MARKSMAN,
};
