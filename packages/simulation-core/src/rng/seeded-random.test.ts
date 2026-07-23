import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from './seeded-random';

function take(seed: string, count: number): number[] {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () => random.next());
}

describe('createSeededRandom', () => {
  it('returns the same 100 values for the same seed', () => {
    expect(take('greyfang', 100)).toEqual(take('greyfang', 100));
  });

  it('returns a different sequence for known different seeds', () => {
    expect(take('greyfang', 10)).not.toEqual(take('hornback', 10));
  });

  it('keeps next values inside the half-open unit interval', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 1, max: 200 }), (seed, count) => {
        const values = take(seed, count);
        expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
      }),
    );
  });

  it('keeps nextInt values inside the inclusive integer range', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (seed, minimum, width) => {
          const maximum = minimum + width;
          const random = createSeededRandom(seed);

          for (let index = 0; index < 50; index += 1) {
            const value = random.nextInt(minimum, maximum);
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(minimum);
            expect(value).toBeLessThanOrEqual(maximum);
          }
        },
      ),
    );
  });

  it('rejects invalid nextInt bounds', () => {
    const random = createSeededRandom('invalid-range');

    expect(() => random.nextInt(3, 2)).toThrow('minimum must be less than or equal to maximum');
    expect(() => random.nextInt(0.5, 2)).toThrow('bounds must be integers');
  });
});
