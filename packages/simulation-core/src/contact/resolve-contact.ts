import type { BattleEvent, ContactZone } from '@expedition/shared-types';

import { calculateCasualties, type CasualtyResult } from '../casualties/calculate-casualties';
import {
  calculateLocalPressure,
  type LocalPressureResult,
} from '../combat/calculate-local-pressure';
import type { CombatSideSnapshot } from '../combat/combat-side-snapshot';
import type { RandomSource } from '../rng/random-source';

export interface ResolveContactInput {
  readonly zone: ContactZone;
  readonly attacker: CombatSideSnapshot;
  readonly defender: CombatSideSnapshot;
  readonly tick: number;
  readonly random: RandomSource;
}

export interface ContactResolution extends LocalPressureResult, CasualtyResult {
  readonly zone: ContactZone;
  readonly events: readonly BattleEvent[];
}

function assertInput(input: ResolveContactInput): void {
  if (!Number.isInteger(input.tick) || input.tick < 0) {
    throw new RangeError('tick must be a non-negative integer');
  }

  if (input.zone.attackingFactionId !== input.attacker.factionId) {
    throw new RangeError('attacker faction must match contact zone');
  }

  if (input.zone.defendingFactionId !== input.defender.factionId) {
    throw new RangeError('defender faction must match contact zone');
  }
}

export function resolveContact(input: ResolveContactInput): ContactResolution {
  assertInput(input);

  const pressure = calculateLocalPressure({
    zone: input.zone,
    attacker: input.attacker,
    defender: input.defender,
  });
  const casualties = calculateCasualties({
    pressure,
    attackingTroopCount: input.attacker.troopCount,
    defendingTroopCount: input.defender.troopCount,
    random: input.random,
  });
  const zone: ContactZone = {
    ...input.zone,
    attackingPressure: pressure.attackingPressure,
    defendingPressure: pressure.defendingPressure,
  };
  const event: BattleEvent = {
    id: `event-${input.tick}-${input.zone.id}-casualties`,
    tick: input.tick,
    type: 'CASUALTIES_APPLIED',
    sourceIds: [...input.attacker.actorIds],
    targetIds: [...input.defender.actorIds],
    causes: [input.zone.id, input.zone.contactType],
    effects: {
      attackerLosses: casualties.attackerLosses,
      defenderLosses: casualties.defenderLosses,
      lineShift: pressure.lineShift,
      exchangeIntensity: casualties.exchangeIntensity,
    },
    visibility: 'PLAYER',
  };

  return {
    zone,
    ...pressure,
    ...casualties,
    events: [event],
  };
}
