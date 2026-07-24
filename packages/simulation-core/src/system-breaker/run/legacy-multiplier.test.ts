import { describe, expect, it } from 'vitest';

import { cell, moduleInstance } from '../chain/chain-test-fixtures';
import { resolveSystemBreakerRound } from './index';
import { runWithModules, testModule } from './scheduler-test-fixtures';

function withLegacyMomentumRules(run: ReturnType<typeof runWithModules>) {
  return {
    ...run,
    genome: {
      ...run.genome,
      rules: ['CHAIN_MOMENTUM', 'BALANCED_GRID'] as ['CHAIN_MOMENTUM', 'BALANCED_GRID'],
    },
  };
}

describe('legacy module multiplier context', () => {
  it('keeps CHAIN_MOMENTUM on the legacy event positions for two 20-value effects', () => {
    const first = testModule('first', { baseValue: 20 });
    const second = testModule('second', { baseValue: 20 });
    const run = withLegacyMomentumRules(
      runWithModules(
        [first, second],
        [
          {
            ...cell(0, moduleInstance('first')),
            module: { ...moduleInstance('first'), definitionId: first.id },
          },
          {
            ...cell(1, moduleInstance('second')),
            module: { ...moduleInstance('second'), definitionId: second.id },
          },
          cell(2),
          cell(3),
        ],
      ),
    );

    expect(resolveSystemBreakerRound(run).summary.projectedProgress).toBe(43);
  });

  it('keeps repeatOnce effect steps on their legacy event positions', () => {
    const repeating = testModule('repeating', { baseValue: 20, repeatOnce: true });
    const run = withLegacyMomentumRules(
      runWithModules(
        [repeating],
        [
          {
            ...cell(0, moduleInstance('repeating')),
            module: { ...moduleInstance('repeating'), definitionId: repeating.id },
          },
          cell(1),
          cell(2),
          cell(3),
        ],
      ),
    );

    const result = resolveSystemBreakerRound(run);

    expect(result.events.filter((event) => event.type === 'MODULE_TRIGGERED')).toHaveLength(1);
    expect(result.summary.projectedProgress).toBe(43);
  });
});
