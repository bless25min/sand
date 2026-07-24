import { describe, expect, it } from 'vitest';

import { cell, moduleInstance } from '../chain/chain-test-fixtures';
import { previewSystemBreakerRound, resolveSystemBreakerRound } from './index';
import { runWithModules, testModule } from './scheduler-test-fixtures';

describe('previewSystemBreakerRound', () => {
  it('uses the exact resolution summary without mutating input', () => {
    const converter = testModule('converter', { effect: 'CONVERT' });
    const run = runWithModules(
      [converter],
      [
        {
          ...cell(0, moduleInstance('converter')),
          module: { ...moduleInstance('converter'), definitionId: converter.id },
        },
        cell(1),
        cell(2),
        cell(3),
      ],
    );
    const input = { ...run, resources: { ...run.resources, INSTABILITY: 10 } };
    const before = structuredClone(input);

    const preview = previewSystemBreakerRound(input);
    const execution = resolveSystemBreakerRound(input);

    expect(input).toEqual(before);
    expect(preview).toEqual(execution.summary);
    expect(preview).toMatchObject({
      projectedProgress: 4,
      targetProgress: input.genome.threats[input.round - 1]?.targetProgress,
      success: false,
      integrity: execution.summary.integrity,
      instability: execution.summary.instability,
      credits: execution.summary.credits,
      triggeredCount: 1,
      blockedCount: 0,
    });
    expect(
      execution.events.find((event) => event.type === 'RESOURCE_CHANGED')?.resourceChanges,
    ).toEqual([
      { resource: 'PROGRESS', delta: 4 },
      { resource: 'INSTABILITY', delta: -2 },
    ]);
  });
});
