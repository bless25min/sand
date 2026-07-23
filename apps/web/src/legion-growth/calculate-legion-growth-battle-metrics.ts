import type { ContactZone, UnitState } from '@expedition/shared-types';
import {
  calculateLocalPressure,
  calculateMovementStep,
  createUnitCombatSnapshot,
  type CombatSideSnapshot,
} from '@expedition/simulation-core';
import type { LegionGrowthBattleMetrics } from './legion-growth-types';

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

export function calculateLegionGrowthBattleMetrics(unit: UnitState): LegionGrowthBattleMetrics {
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
