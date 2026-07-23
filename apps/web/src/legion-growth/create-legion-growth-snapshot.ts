import {
  BEAST_HUNTER_MARKSMAN,
  EXPERIENCE_RULES,
  HEAVY_SHIELD_GUARD,
  LEGION_SKILLS,
} from '@expedition/game-data';
import {
  applyUnitExperience,
  calculateExperienceAwards,
  promoteUnit,
  replenishUnit,
  treatWounded,
  type ExperienceAwardDetail,
} from '@expedition/progression-core';
import type {
  ContactZone,
  ExperienceAward,
  GrowthEvent,
  UnitClassDefinition,
  UnitState,
} from '@expedition/shared-types';
import {
  calculateLocalPressure,
  calculateMovementStep,
  createUnitCombatSnapshot,
  type CombatSideSnapshot,
} from '@expedition/simulation-core';

export interface LegionGrowthBattleMetrics {
  readonly attackingPressure: number;
  readonly defendingPressure: number;
  readonly distanceMoved: number;
}

export interface LegionGrowthUnitSnapshot {
  readonly experienceDetails: readonly ExperienceAwardDetail[];
  readonly experienceGained: number;
  readonly levelsGained: number;
  readonly treatedCount: number;
  readonly reinforcementCount: number;
  readonly className: string;
  readonly skillName: string;
  readonly before: UnitState;
  readonly after: UnitState;
  readonly beforeMetrics: LegionGrowthBattleMetrics;
  readonly afterMetrics: LegionGrowthBattleMetrics;
  readonly events: readonly GrowthEvent[];
}

export interface LegionGrowthSnapshot {
  readonly units: readonly [LegionGrowthUnitSnapshot, LegionGrowthUnitSnapshot];
}

interface LegionGrowthFixture {
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

const INFANTRY: LegionGrowthFixture = {
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

const ARCHER: LegionGrowthFixture = {
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

const GREYFANG: CombatSideSnapshot = {
  factionId: 'greyfang',
  actorIds: ['greyfang-pack'],
  troopCount: 100,
  attack: 8,
  defense: 6,
  morale: 0.8,
  cohesion: 0.7,
  fatigue: 0.1,
  formation: 'LOOSE',
};

function createFrontalZone(
  attacker: CombatSideSnapshot,
  defender: CombatSideSnapshot,
): ContactZone {
  return {
    id: `contact-${attacker.actorIds.join('-')}-${defender.actorIds.join('-')}`,
    cellIndices: [0],
    attackingFactionId: attacker.factionId,
    defendingFactionId: defender.factionId,
    attackingUnitIds: attacker.actorIds,
    defendingUnitIds: defender.actorIds,
    contactNormal: { x: 1, y: 0 },
    width: 1,
    attackingPressure: 0,
    defendingPressure: 0,
    contactType: 'FRONTAL',
  };
}

function battleMetrics(unit: UnitState): LegionGrowthBattleMetrics {
  const unitSide = createUnitCombatSnapshot({ unit, contactType: 'FRONTAL' });
  const attacking = calculateLocalPressure({
    zone: createFrontalZone(unitSide, GREYFANG),
    attacker: unitSide,
    defender: GREYFANG,
  });
  const defending = calculateLocalPressure({
    zone: createFrontalZone(GREYFANG, unitSide),
    attacker: GREYFANG,
    defender: unitSide,
  });
  const movement = calculateMovementStep({
    position: unit.position,
    target: unit.targetPosition ?? unit.position,
    mobility: unit.mobility,
    fatigue: unit.fatigue,
    formation: unit.formation,
    equipmentWeight: unit.equipmentWeight,
    carryingCapacity: unit.carryingCapacity,
    terrainMovementCost: 1,
    deltaSeconds: 1,
    mode: 'NORMAL',
  });

  return {
    attackingPressure: attacking.attackingPressure,
    defendingPressure: defending.defendingPressure,
    distanceMoved: movement.distanceMoved,
  };
}

function createUnitGrowthSnapshot(fixture: LegionGrowthFixture): LegionGrowthUnitSnapshot {
  const skillId = fixture.classDefinition.skillIds[0];
  if (skillId === undefined) {
    throw new Error(`fixed legion growth fixture has no skill ID: ${fixture.classDefinition.id}`);
  }
  const skillDefinition = LEGION_SKILLS[skillId];
  if (skillDefinition === undefined) {
    throw new Error(`fixed legion growth fixture has no skill definition: ${skillId}`);
  }

  const calculation = calculateExperienceAwards({
    awards: fixture.awards,
    rules: EXPERIENCE_RULES,
  });
  if (!calculation.ok) {
    throw new Error(`fixed experience fixture failed: ${calculation.reason}`);
  }

  const experience = applyUnitExperience({
    unit: fixture.unit,
    calculation,
    eventId: `${fixture.unit.id}:experience`,
  });
  const treatment = treatWounded({
    unit: experience.unit,
    treatmentCapacity: fixture.treatmentCapacity,
    eventId: `${fixture.unit.id}:treatment`,
  });
  if (!treatment.ok) {
    throw new Error(`fixed treatment fixture failed: ${treatment.reason}`);
  }

  const reinforcement = replenishUnit({
    unit: treatment.unit,
    availableRecruits: fixture.availableRecruits,
    eventId: `${fixture.unit.id}:reinforcement`,
  });
  if (!reinforcement.ok) {
    throw new Error(`fixed reinforcement fixture failed: ${reinforcement.reason}`);
  }

  const promotion = promoteUnit({
    unit: reinforcement.unit,
    classDefinition: fixture.classDefinition,
    skillDefinitions: LEGION_SKILLS,
    eventId: `${fixture.unit.id}:promotion`,
  });
  if (!promotion.ok) {
    throw new Error(`fixed promotion fixture failed: ${promotion.reason}`);
  }

  const events: GrowthEvent[] = [...experience.events];
  if (treatment.event !== undefined) {
    events.push(treatment.event);
  }
  if (reinforcement.event !== undefined) {
    events.push(reinforcement.event);
  }
  events.push(promotion.event);

  return {
    experienceDetails: calculation.details,
    experienceGained: calculation.totalExperience,
    levelsGained: experience.levelsGained,
    treatedCount: treatment.treatedCount,
    reinforcementCount: reinforcement.addedCount,
    className: fixture.classDefinition.name,
    skillName: skillDefinition.name,
    before: fixture.unit,
    after: promotion.unit,
    beforeMetrics: battleMetrics(fixture.unit),
    afterMetrics: battleMetrics(promotion.unit),
    events,
  };
}

export function createLegionGrowthSnapshot(): LegionGrowthSnapshot {
  return {
    units: [createUnitGrowthSnapshot(INFANTRY), createUnitGrowthSnapshot(ARCHER)],
  };
}
