import { describe, expect, it } from 'vitest';

import { evaluateModuleTrigger } from './evaluate-module-trigger';
import { cell, createRun, definition, moduleInstance } from './chain-test-fixtures';

describe('evaluateModuleTrigger stages', () => {
  it('gates ROUND_START and FIXED_TIME to their deterministic stages', () => {
    const source = cell(0, moduleInstance('source'));
    const run = createRun([source, cell(1), cell(2), cell(3)]);

    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'ROUND_START' }),
        stage: 'ROUND_START',
      }),
    ).toBe(true);
    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'ROUND_START' }),
        stage: 'FIXED_TIME',
      }),
    ).toBe(false);
    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'FIXED_TIME' }),
        stage: 'FIXED_TIME',
      }),
    ).toBe(true);
  });

  it('gates DAMAGED and DISABLED to prior damage and disabled cells', () => {
    const source = cell(0, moduleInstance('source'));
    const run = createRun([source, cell(1), cell(2), cell(3)]);
    const locked = { ...source, locked: true };

    expect(
      evaluateModuleTrigger({
        run: { ...run, previousRoundDamagedIntegrity: true },
        cell: source,
        definition: definition({ trigger: 'DAMAGED' }),
        stage: 'REACTIVE',
      }),
    ).toBe(true);
    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'DAMAGED' }),
        stage: 'REACTIVE',
      }),
    ).toBe(false);
    expect(
      evaluateModuleTrigger({
        run,
        cell: locked,
        definition: definition({ trigger: 'DISABLED' }),
        stage: 'REACTIVE',
      }),
    ).toBe(true);
    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'DISABLED' }),
        stage: 'REACTIVE',
      }),
    ).toBe(false);
  });

  it('gates reactive triggers to adjacent fires and resource thresholds', () => {
    const source = cell(0, moduleInstance('source'));
    const adjacent = cell(1, moduleInstance('adjacent'));
    const run = createRun([source, adjacent, cell(2), cell(3)]);

    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'ADJACENT_TRIGGER' }),
        stage: 'REACTIVE',
        firedModuleInstanceIds: ['adjacent'],
      }),
    ).toBe(true);
    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'ADJACENT_TRIGGER' }),
        stage: 'REACTIVE',
      }),
    ).toBe(false);
    expect(
      evaluateModuleTrigger({
        run: { ...run, resources: { ...run.resources, PROGRESS: 10 } },
        cell: source,
        definition: definition({ trigger: 'RESOURCE_THRESHOLD' }),
        stage: 'REACTIVE',
      }),
    ).toBe(true);
    expect(
      evaluateModuleTrigger({
        run: { ...run, resources: { ...run.resources, INSTABILITY: 50 } },
        cell: source,
        definition: definition({ trigger: 'RESOURCE_THRESHOLD' }),
        stage: 'REACTIVE',
      }),
    ).toBe(true);
    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ trigger: 'RESOURCE_THRESHOLD' }),
        stage: 'REACTIVE',
      }),
    ).toBe(false);
  });
});
