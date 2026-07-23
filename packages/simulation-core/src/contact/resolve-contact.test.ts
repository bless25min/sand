import type { ContactZone } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import type { CombatSideSnapshot } from '../combat/combat-side-snapshot';
import { createSeededRandom } from '../rng/seeded-random';
import { resolveContact } from './resolve-contact';

const zone: ContactZone = {
  id: 'contact-0-player-monsters',
  cellIndices: [0],
  attackingFactionId: 'player',
  defendingFactionId: 'monsters',
  attackingUnitIds: ['heavy-1'],
  defendingUnitIds: ['wolves-1'],
  contactNormal: { x: 1, y: 0 },
  width: 1,
  attackingPressure: 0,
  defendingPressure: 0,
  contactType: 'FRONTAL',
};

const attacker: CombatSideSnapshot = {
  factionId: 'player',
  actorIds: ['heavy-1'],
  troopCount: 100,
  attack: 10,
  defense: 10,
  morale: 1,
  cohesion: 1,
  fatigue: 0,
  formation: 'DENSE_BLOCK',
};

const defender: CombatSideSnapshot = {
  ...attacker,
  factionId: 'monsters',
  actorIds: ['wolves-1'],
};

function resolve(
  overrides: Partial<{
    zone: ContactZone;
    attacker: CombatSideSnapshot;
    defender: CombatSideSnapshot;
    seed: string;
  }> = {},
) {
  return resolveContact({
    zone: overrides.zone ?? zone,
    attacker: overrides.attacker ?? attacker,
    defender: overrides.defender ?? defender,
    tick: 12,
    random: createSeededRandom(overrides.seed ?? 'greyfang'),
  });
}

describe('resolveContact', () => {
  it('keeps equivalent formations in a replayable stalemate', () => {
    const first = resolve();
    const second = resolve();

    expect(first).toEqual(second);
    expect(first.lineShift).toBe(0);
    expect(first.attackerLosses).toBe(first.defenderLosses);
  });

  it('lets a materially stronger attacker advance and inflict more losses', () => {
    const result = resolve({
      attacker: {
        ...attacker,
        troopCount: 150,
        attack: 12,
      },
    });

    expect(result.lineShift).toBeGreaterThan(0);
    expect(result.defenderLosses).toBeGreaterThan(result.attackerLosses);
  });

  it('makes a flank resolution more effective than a frontal resolution', () => {
    const frontal = resolve();
    const flank = resolve({
      zone: {
        ...zone,
        contactType: 'FLANK',
      },
    });

    expect(flank.zone.attackingPressure).toBeGreaterThan(frontal.zone.attackingPressure);
    expect(flank.defenderLosses).toBeGreaterThan(frontal.defenderLosses);
  });

  it('does not instantly annihilate either side', () => {
    const result = resolve({
      attacker: { ...attacker, troopCount: 2, attack: 1_000 },
      defender: { ...defender, troopCount: 2, defense: 1 },
    });

    expect(result.attackerLosses).toBeLessThan(2);
    expect(result.defenderLosses).toBeLessThan(2);
  });

  it('emits a complete deterministic casualty event', () => {
    const result = resolve();

    expect(result.events).toEqual([
      {
        id: 'event-12-contact-0-player-monsters-casualties',
        tick: 12,
        type: 'CASUALTIES_APPLIED',
        sourceIds: ['heavy-1'],
        targetIds: ['wolves-1'],
        causes: ['contact-0-player-monsters', 'FRONTAL'],
        effects: {
          attackerLosses: result.attackerLosses,
          defenderLosses: result.defenderLosses,
          lineShift: result.lineShift,
          exchangeIntensity: result.exchangeIntensity,
        },
        visibility: 'PLAYER',
      },
    ]);
  });
});
