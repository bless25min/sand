import { createSeededRandom } from '../rng/seeded-random';
import type { LocalPressureResult } from '../combat/calculate-local-pressure';
import { describe, expect, it } from 'vitest';

import { calculateCasualties } from './calculate-casualties';

const equalPressure: LocalPressureResult = {
  attackingPressure: 1_000,
  defendingPressure: 1_000,
  lineShift: 0,
};

describe('calculateCasualties', () => {
  it('returns identical losses for identical seeds and inputs', () => {
    const first = calculateCasualties({
      pressure: equalPressure,
      attackingTroopCount: 100,
      defendingTroopCount: 100,
      random: createSeededRandom('greyfang'),
    });
    const second = calculateCasualties({
      pressure: equalPressure,
      attackingTroopCount: 100,
      defendingTroopCount: 100,
      random: createSeededRandom('greyfang'),
    });

    expect(first).toEqual(second);
  });

  it('makes the weaker side take more losses', () => {
    const result = calculateCasualties({
      pressure: {
        attackingPressure: 2_000,
        defendingPressure: 1_000,
        lineShift: 1 / 3,
      },
      attackingTroopCount: 100,
      defendingTroopCount: 100,
      random: createSeededRandom('advantage'),
    });

    expect(result.defenderLosses).toBeGreaterThan(result.attackerLosses);
  });

  it('never removes the last troop in one resolution', () => {
    const result = calculateCasualties({
      pressure: {
        attackingPressure: 1_000_000,
        defendingPressure: 1,
        lineShift: 0.99,
      },
      attackingTroopCount: 2,
      defendingTroopCount: 2,
      random: createSeededRandom('bounded'),
    });

    expect(result.attackerLosses).toBeLessThan(2);
    expect(result.defenderLosses).toBeLessThan(2);
  });

  it('returns no losses when neither side has pressure', () => {
    expect(
      calculateCasualties({
        pressure: {
          attackingPressure: 0,
          defendingPressure: 0,
          lineShift: 0,
        },
        attackingTroopCount: 100,
        defendingTroopCount: 100,
        random: createSeededRandom('no-contact'),
      }),
    ).toEqual({
      attackerLosses: 0,
      defenderLosses: 0,
      exchangeIntensity: 0,
    });
  });
});
