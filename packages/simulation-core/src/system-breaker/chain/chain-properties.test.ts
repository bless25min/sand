import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome } from '../genome';
import { createSystemBreakerRun, resolveSystemBreakerRound } from '../run';

function createCrowdedRun(seed: string) {
  const initial = createSystemBreakerRun(createFallbackGameGenome({ prompt: '連鎖壓力場', seed }));
  const repeating = initial.genome.modules.find((module) => module.repeatOnce)!;
  return {
    ...initial,
    board: {
      size: 3 as const,
      cells: Array.from({ length: 18 }, (_, index) => ({
        index,
        blocked: false,
        locked: false,
        module: {
          instanceId: `repeat-${index}`,
          definitionId: repeating.id,
          level: 2 as const,
          cooldownRemaining: 0,
        },
      })),
    },
  };
}

describe('system breaker chain properties', () => {
  it('is deterministic, finite, and capped at 32 events', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 24 }), (seed) => {
        const run = createCrowdedRun(seed);
        const first = resolveSystemBreakerRound(structuredClone(run));
        const second = resolveSystemBreakerRound(structuredClone(run));
        const values = Object.values(first.run.resources);

        expect(first).toEqual(second);
        expect(first.events.length).toBeLessThanOrEqual(32);
        expect(first.events.at(-1)?.type).toBe('CHAIN_LIMIT_REACHED');
        expect(values.every(Number.isFinite)).toBe(true);
      }),
      { numRuns: 40 },
    );
  });
});
