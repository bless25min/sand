import type { BoardCell, GameModuleDefinition, SystemBreakerRun } from '@expedition/shared-types';

export const definition = (
  overrides: Partial<GameModuleDefinition> = {},
): GameModuleDefinition => ({
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

export const moduleInstance = (instanceId: string, cooldownRemaining = 0) => ({
  instanceId,
  definitionId: 'module',
  level: 1 as const,
  cooldownRemaining,
});

export function cell(index: number, instance?: ReturnType<typeof moduleInstance>): BoardCell {
  return { index, blocked: false, locked: false, ...(instance ? { module: instance } : {}) };
}

export function createRun(
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
