import type { BoardCell, GameModuleDefinition, SystemBreakerRun } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { evaluateModuleTrigger } from './evaluate-module-trigger';
import { resolveModuleTargets } from './resolve-module-targets';

const definition = (overrides: Partial<GameModuleDefinition> = {}): GameModuleDefinition => ({
  id: 'module',
  name: 'Module',
  description: 'Test module',
  role: 'PRODUCER',
  trigger: 'ROUND_START',
  effect: 'ADD_PROGRESS',
  target: 'SELF',
  baseValue: 4,
  cost: 4,
  cooldown: 0,
  ...overrides,
});

const module = (instanceId: string, cooldownRemaining = 0) => ({
  instanceId,
  definitionId: 'module',
  level: 1 as const,
  cooldownRemaining,
});

function cell(index: number, instance?: ReturnType<typeof module>): BoardCell {
  return { index, blocked: false, locked: false, ...(instance ? { module: instance } : {}) };
}

function createRun(
  cells: BoardCell[],
  resources?: Partial<SystemBreakerRun['resources']>,
): SystemBreakerRun {
  return {
    genome: {
      version: 1,
      seed: 'trigger-contract',
      title: 'Trigger contract',
      premise: 'Test only',
      aliases: {
        PROGRESS: 'Progress',
        INTEGRITY: 'Integrity',
        INSTABILITY: 'Instability',
        CREDITS: 'Credits',
      },
      winDescription: 'Win',
      failDescription: 'Fail',
      rules: ['BALANCED_GRID', 'EDGE_CREDIT'],
      modules: [definition()],
      threats: Array.from({ length: 7 }, (_, index) => ({
        id: `threat-${index + 1}`,
        round: index + 1,
        name: 'Threat',
        telegraph: 'Test',
        kind: 'NORMAL' as const,
        targetProgress: 20,
        integrityDamage: 1,
        instabilityGain: 1,
        modifier: 'NONE' as const,
      })),
      counters: [
        { id: 'counter-a', role: 'PRODUCER', label: 'A', outputMultiplier: 1 },
        { id: 'counter-b', role: 'AMPLIFIER', label: 'B', outputMultiplier: 1 },
        { id: 'counter-c', role: 'STABILIZER', label: 'C', outputMultiplier: 1 },
      ],
      endings: {
        victory: { title: 'Win', description: 'Win' },
        defeat: { title: 'Fail', description: 'Fail' },
      },
    },
    seed: 'trigger-contract',
    round: 1,
    status: 'PREPARE',
    resources: { PROGRESS: 0, INTEGRITY: 100, INSTABILITY: 0, CREDITS: 0, ...resources },
    board: { size: 2, cells },
    inventory: [],
    shop: { offers: [], refreshesRemaining: 0 },
    activeModifier: 'NONE',
    activeCounter: null,
    completedThreats: 0,
    score: 0,
    bestChain: 0,
    nextInstanceId: 3,
    chainLog: [],
    previousRoundDamagedIntegrity: false,
  };
}

describe('module target and trigger contracts', () => {
  it('resolves target cells in stable board order and excludes the source from relational targets', () => {
    const cells = [
      cell(0, module('source')),
      cell(1, module('right')),
      cell(2, module('down')),
      cell(3),
    ];

    expect(
      resolveModuleTargets({ size: 2, cells }, 0, 'SELF').map((target) => target.index),
    ).toEqual([0]);
    expect(
      resolveModuleTargets({ size: 2, cells }, 0, 'ADJACENT').map((target) => target.index),
    ).toEqual([1, 2]);
    expect(
      resolveModuleTargets({ size: 2, cells }, 1, 'LEFT').map((target) => target.index),
    ).toEqual([0]);
    expect(
      resolveModuleTargets({ size: 2, cells }, 0, 'RIGHT').map((target) => target.index),
    ).toEqual([1]);
    expect(
      resolveModuleTargets({ size: 2, cells }, 0, 'ROW').map((target) => target.index),
    ).toEqual([1]);
    expect(
      resolveModuleTargets({ size: 2, cells }, 0, 'ALL').map((target) => target.index),
    ).toEqual([1, 2, 3]);
  });

  it('requires an available module in each relational target set while self remains connected', () => {
    const cases = [
      ['ADJACENT', 0],
      ['LEFT', 1],
      ['RIGHT', 0],
      ['ROW', 0],
      ['ALL', 0],
    ] as const;

    for (const [target, sourceIndex] of cases) {
      const source = cell(sourceIndex, module('source'));
      const otherIndex = sourceIndex === 0 ? 1 : 0;
      const connected = createRun([source, cell(otherIndex, module('target')), cell(2), cell(3)]);
      const unavailable = createRun([
        source,
        { ...cell(otherIndex, module('target')), locked: true },
        cell(2),
        cell(3),
      ]);

      expect(
        evaluateModuleTrigger({
          run: connected,
          cell: source,
          definition: definition({ target }),
          stage: 'ROUND_START',
        }),
      ).toBe(true);
      expect(
        evaluateModuleTrigger({
          run: unavailable,
          cell: source,
          definition: definition({ target }),
          stage: 'ROUND_START',
        }),
      ).toBe(false);
    }

    const blockedSelf = { ...cell(0, module('self')), blocked: true };
    expect(
      evaluateModuleTrigger({
        run: createRun([blockedSelf, cell(1), cell(2), cell(3)]),
        cell: blockedSelf,
        definition: definition(),
        stage: 'ROUND_START',
      }),
    ).toBe(true);
  });

  it('evaluates every trigger only in its deterministic condition', () => {
    const source = cell(0, module('source'));
    const adjacent = cell(1, module('adjacent'));
    const run = createRun([source, adjacent, cell(2), cell(3)]);

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
        cell: { ...source, blocked: true },
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

  it('does not ready a module while its canonical cooldown remains positive', () => {
    const cooling = cell(0, module('source', 1));
    const ready = cell(0, module('source'));
    const run = createRun([cooling, cell(1), cell(2), cell(3)]);

    expect(
      evaluateModuleTrigger({ run, cell: cooling, definition: definition(), stage: 'ROUND_START' }),
    ).toBe(false);
    expect(
      evaluateModuleTrigger({
        run: createRun([ready, cell(1), cell(2), cell(3)]),
        cell: ready,
        definition: definition(),
        stage: 'ROUND_START',
      }),
    ).toBe(true);
  });
});
