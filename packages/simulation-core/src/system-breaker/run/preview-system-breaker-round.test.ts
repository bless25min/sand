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

  it('projects clamped threat impacts with exact signed resource deltas', () => {
    const run = runWithModules([], [cell(0), cell(1), cell(2), cell(3)]);
    const threats = [...run.genome.threats] as typeof run.genome.threats;
    threats[0] = {
      ...threats[0]!,
      targetProgress: 1,
      integrityDamage: 10,
      instabilityGain: 10,
    };
    const input = {
      ...run,
      genome: { ...run.genome, threats },
      resources: { PROGRESS: 0, INTEGRITY: 3, INSTABILITY: 99, CREDITS: 998 },
    };

    const preview = previewSystemBreakerRound(input);
    const execution = resolveSystemBreakerRound(input);

    expect(preview).toEqual(execution.summary);
    expect(preview).toMatchObject({ integrity: 0, instability: 100, credits: 999 });
    expect(
      execution.events.find((event) => event.type === 'RESOURCE_CHANGED')?.resourceChanges,
    ).toEqual([
      { resource: 'INTEGRITY', delta: -3 },
      { resource: 'INSTABILITY', delta: 1 },
      { resource: 'CREDITS', delta: 1 },
    ]);
  });
});
