import type { ContactType, UnitState } from '@expedition/shared-types';

import type { CombatSideSnapshot } from './combat-side-snapshot';

export interface CreateUnitCombatSnapshotInput {
  readonly unit: UnitState;
  readonly contactType: ContactType;
}

function isFrontalContact(contactType: ContactType): boolean {
  return contactType === 'FRONTAL' || contactType === 'CHARGE';
}

export function createUnitCombatSnapshot(input: CreateUnitCombatSnapshotInput): CombatSideSnapshot {
  return {
    factionId: input.unit.factionId,
    actorIds: [input.unit.id],
    troopCount: input.unit.troopCount,
    attack: input.unit.attack,
    defense: isFrontalContact(input.contactType) ? input.unit.frontalDefense : input.unit.defense,
    morale: input.unit.morale,
    cohesion: input.unit.cohesion,
    fatigue: input.unit.fatigue,
    formation: input.unit.formation,
  };
}
