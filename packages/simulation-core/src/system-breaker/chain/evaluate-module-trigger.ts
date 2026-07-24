import type { BoardCell, GameModuleDefinition, SystemBreakerRun } from '@expedition/shared-types';

import { resolveModuleTargets } from './resolve-module-targets';

export type ModuleTriggerStage = 'ROUND_START' | 'FIXED_TIME' | 'REACTIVE';

export interface EvaluateModuleTriggerInput {
  run: SystemBreakerRun;
  cell: BoardCell;
  definition: GameModuleDefinition;
  stage: ModuleTriggerStage;
  firedModuleInstanceIds?: readonly string[];
}

function hasAvailableTarget(input: EvaluateModuleTriggerInput): boolean {
  if (input.definition.target === 'SELF') return true;
  return resolveModuleTargets(input.run.board, input.cell.index, input.definition.target).some(
    (cell) => cell.module && !cell.blocked && !cell.locked,
  );
}

function hasTriggeredAdjacentModule(input: EvaluateModuleTriggerInput): boolean {
  const fired = new Set(input.firedModuleInstanceIds);
  return resolveModuleTargets(input.run.board, input.cell.index, 'ADJACENT').some(
    (cell) => cell.module && fired.has(cell.module.instanceId),
  );
}

export function evaluateModuleTrigger(input: EvaluateModuleTriggerInput): boolean {
  const instance = input.cell.module;
  if (!instance || instance.cooldownRemaining > 0) return false;
  if (input.cell.locked && input.definition.trigger !== 'DISABLED') return false;
  if (!hasAvailableTarget(input)) return false;

  switch (input.definition.trigger) {
    case 'ROUND_START':
      return input.stage === 'ROUND_START';
    case 'FIXED_TIME':
      return input.stage === 'FIXED_TIME';
    case 'DAMAGED':
      return input.stage === 'REACTIVE' && input.run.previousRoundDamagedIntegrity;
    case 'DISABLED':
      return input.stage === 'REACTIVE' && (input.cell.blocked || input.cell.locked);
    case 'ADJACENT_TRIGGER':
      return input.stage === 'REACTIVE' && hasTriggeredAdjacentModule(input);
    case 'RESOURCE_THRESHOLD': {
      const target = input.run.genome.threats[input.run.round - 1]?.targetProgress ?? 0;
      return (
        input.stage === 'REACTIVE' &&
        (input.run.resources.PROGRESS >= target / 2 || input.run.resources.INSTABILITY >= 50)
      );
    }
  }
}
