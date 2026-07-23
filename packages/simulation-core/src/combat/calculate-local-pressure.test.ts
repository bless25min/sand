import type { ContactZone } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import type { CombatSideSnapshot } from './combat-side-snapshot';
import { calculateLocalPressure } from './calculate-local-pressure';

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

describe('calculateLocalPressure', () => {
  it('keeps equivalent Dense Blocks in a stalemate', () => {
    const result = calculateLocalPressure({ zone, attacker, defender });

    expect(result.attackingPressure).toBe(result.defendingPressure);
    expect(result.lineShift).toBe(0);
  });

  it('moves the line toward the materially weaker defender', () => {
    const result = calculateLocalPressure({
      zone,
      attacker: {
        ...attacker,
        troopCount: 150,
        attack: 12,
      },
      defender,
    });

    expect(result.attackingPressure).toBeGreaterThan(result.defendingPressure);
    expect(result.lineShift).toBeGreaterThan(0);
    expect(result.lineShift).toBeLessThanOrEqual(1);
  });

  it('makes a flank attack more effective than a frontal attack', () => {
    const frontal = calculateLocalPressure({ zone, attacker, defender });
    const flank = calculateLocalPressure({
      zone: { ...zone, contactType: 'FLANK' },
      attacker,
      defender,
    });

    expect(flank.attackingPressure).toBeGreaterThan(frontal.attackingPressure);
  });

  it('returns finite pressure for an empty side', () => {
    const result = calculateLocalPressure({
      zone,
      attacker: { ...attacker, troopCount: 0 },
      defender,
    });

    expect(result.attackingPressure).toBe(0);
    expect(Number.isFinite(result.defendingPressure)).toBe(true);
    expect(Number.isFinite(result.lineShift)).toBe(true);
  });
});
