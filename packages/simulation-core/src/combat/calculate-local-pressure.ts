import type { ContactType, ContactZone } from '@expedition/shared-types';

import type { CombatSideSnapshot } from './combat-side-snapshot';
import { getFormationCombatModifier } from './formation-combat-modifier';

const CONTACT_ATTACK_MULTIPLIER: Readonly<Record<ContactType, number>> = Object.freeze({
  FRONTAL: 1,
  FLANK: 1.35,
  REAR: 1.6,
  RANGED: 0.8,
  CHARGE: 1.2,
  ENCIRCLEMENT: 1.5,
});

export interface CalculateLocalPressureInput {
  readonly zone: ContactZone;
  readonly attacker: CombatSideSnapshot;
  readonly defender: CombatSideSnapshot;
}

export interface LocalPressureResult {
  readonly attackingPressure: number;
  readonly defendingPressure: number;
  readonly lineShift: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function assertSide(side: CombatSideSnapshot, label: string): void {
  const values = [
    side.troopCount,
    side.attack,
    side.defense,
    side.morale,
    side.cohesion,
    side.fatigue,
  ];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError(`${label} combat values must be non-negative and finite`);
  }

  if (!Number.isInteger(side.troopCount)) {
    throw new RangeError(`${label} troopCount must be an integer`);
  }
}

function conditionMultiplier(side: CombatSideSnapshot): number {
  const morale = clamp(side.morale, 0, 1);
  const cohesion = clamp(side.cohesion, 0, 1);
  const fatigue = clamp(side.fatigue, 0, 1);

  return (0.5 + morale * 0.5) * (0.5 + cohesion * 0.5) * (1 - fatigue * 0.5);
}

export function calculateLocalPressure(input: CalculateLocalPressureInput): LocalPressureResult {
  assertSide(input.attacker, 'attacker');
  assertSide(input.defender, 'defender');

  if (!Number.isFinite(input.zone.width) || input.zone.width <= 0) {
    throw new RangeError('contact width must be greater than zero');
  }

  const attackerFormation = getFormationCombatModifier(input.attacker.formation);
  const defenderFormation = getFormationCombatModifier(input.defender.formation);
  const attackingPressure =
    input.attacker.troopCount *
    input.attacker.attack *
    conditionMultiplier(input.attacker) *
    attackerFormation.attackMultiplier *
    CONTACT_ATTACK_MULTIPLIER[input.zone.contactType] *
    input.zone.width;
  const defendingPressure =
    input.defender.troopCount *
    input.defender.defense *
    conditionMultiplier(input.defender) *
    defenderFormation.defenseMultiplier *
    input.zone.width;
  const combinedPressure = attackingPressure + defendingPressure;
  const lineShift =
    combinedPressure === 0
      ? 0
      : clamp((attackingPressure - defendingPressure) / combinedPressure, -1, 1);

  return {
    attackingPressure,
    defendingPressure,
    lineShift,
  };
}
