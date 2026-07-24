import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome } from '../genome';
import { createSystemBreakerRun } from '../run';
import { resolveChain } from './resolve-chain';

describe('resolveChain event cap', () => {
  it('stops before applying the effect that would exceed the 32-event limit', () => {
    const initial = createSystemBreakerRun(
      createFallbackGameGenome({ prompt: 'event cap', seed: 'event-cap' }),
    );
    const repeating = {
      ...initial.genome.modules[0]!,
      id: 'repeat-progress',
      target: 'SELF' as const,
      effect: 'ADD_PROGRESS' as const,
      baseValue: 1,
      cooldown: 0,
      repeatOnce: true,
    };
    const run = {
      ...initial,
      round: 7,
      genome: {
        ...initial.genome,
        rules: ['BALANCED_GRID', 'EDGE_CREDIT'] as ['BALANCED_GRID', 'EDGE_CREDIT'],
        modules: [repeating],
      },
      board: {
        size: 3 as const,
        cells: Array.from({ length: 18 }, (_, index) => ({
          index,
          blocked: false,
          locked: false,
          module: {
            instanceId: `repeat-${index}`,
            definitionId: repeating.id,
            level: 1 as const,
            cooldownRemaining: 0,
          },
        })),
      },
    };

    const result = resolveChain(run);

    expect(result.events).toHaveLength(32);
    expect(result.events.filter((event) => event.type === 'CHAIN_LIMIT_REACHED')).toHaveLength(1);
    expect(result.events.at(-1)?.type).toBe('CHAIN_LIMIT_REACHED');
    expect(result.resources.PROGRESS).toBe(20);
  });
});
