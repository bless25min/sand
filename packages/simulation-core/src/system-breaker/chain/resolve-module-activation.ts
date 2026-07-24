import {
  CORE_RESOURCE_IDS,
  type BoardCell,
  type ChainEventInput,
  type ChainEventResourceChange,
  type GameModuleDefinition,
  type ModuleInstance,
  type SystemBreakerRun,
} from '@expedition/shared-types';

import { applyEffect, type EffectState } from './apply-effect';

function resourceChanges(
  before: SystemBreakerRun['resources'],
  after: SystemBreakerRun['resources'],
): ChainEventResourceChange[] {
  return CORE_RESOURCE_IDS.flatMap((resource) => {
    const delta = after[resource] - before[resource];
    return delta === 0 ? [] : [{ resource, delta }];
  });
}

function ruleMultiplier(
  run: SystemBreakerRun,
  roundStartResources: SystemBreakerRun['resources'],
  cellIndex: number,
  legacyEventCount: number,
): number {
  let multiplier = 1;
  if (run.genome.rules.includes('HIGH_INSTABILITY_BONUS') && roundStartResources.INSTABILITY >= 50)
    multiplier += 0.3;
  if (run.genome.rules.includes('LOW_INTEGRITY_BONUS') && roundStartResources.INTEGRITY <= 40)
    multiplier += 0.25;
  if (run.genome.rules.includes('CHAIN_MOMENTUM')) multiplier += legacyEventCount * 0.03;
  const row = Math.floor(cellIndex / run.board.size);
  const column = cellIndex % run.board.size;
  if (
    run.genome.rules.includes('ADJACENCY_SURGE') &&
    run.board.cells.some((cell) => {
      if (!cell.module) return false;
      const otherRow = Math.floor(cell.index / run.board.size);
      const otherColumn = cell.index % run.board.size;
      return Math.abs(row - otherRow) + Math.abs(column - otherColumn) === 1;
    })
  )
    multiplier += 0.25;
  return multiplier;
}

export interface ModuleActivation {
  events: ChainEventInput[];
  module: ModuleInstance;
  state: EffectState;
}

export function resolveModuleActivation(input: {
  run: SystemBreakerRun;
  state: EffectState;
  cell: BoardCell;
  definition: GameModuleDefinition;
  legacyEventCount: number;
  roundStartResources: SystemBreakerRun['resources'];
}): ModuleActivation {
  const instance = input.cell.module!;
  const events: ChainEventInput[] = [
    {
      type: 'MODULE_TRIGGERED',
      message: `${input.definition.name} 觸發。`,
      moduleInstanceId: instance.instanceId,
      role: input.definition.role,
      effect: input.definition.effect,
    },
  ];
  let state = input.state;
  let legacyEventCount = input.legacyEventCount;
  const repetitions = input.definition.repeatOnce ? 2 : 1;
  for (let repeat = 0; repeat < repetitions; repeat += 1) {
    legacyEventCount += 1;
    const multiplier = ruleMultiplier(
      input.run,
      input.roundStartResources,
      input.cell.index,
      legacyEventCount,
    );
    const value = input.definition.baseValue * instance.level * multiplier;
    const counterValue =
      input.run.activeCounter?.role === input.definition.role
        ? value * input.run.activeCounter.outputMultiplier
        : value;
    const finalValue =
      input.run.savedFragment?.moduleId === input.definition.id
        ? counterValue + input.run.savedFragment.bonus
        : counterValue;
    const before = state.resources;
    state = applyEffect(state, input.definition, finalValue);
    if (input.run.activeModifier === 'OVERLOAD')
      state = {
        ...state,
        resources: {
          ...state.resources,
          INSTABILITY: Math.min(100, state.resources.INSTABILITY + 2),
        },
      };
    if (
      repeat > 0 &&
      input.run.round === 7 &&
      input.run.genome.threats[6]?.phaseTwoModifier === 'PUNISH_REPEAT'
    )
      state = {
        ...state,
        resources: {
          ...state.resources,
          INSTABILITY: Math.min(100, state.resources.INSTABILITY + 5),
        },
      };
    const changes = resourceChanges(before, state.resources);
    if (changes.length > 0) {
      events.push({
        type: 'RESOURCE_CHANGED',
        message: `${input.definition.name} 改寫資源。`,
        moduleInstanceId: instance.instanceId,
        resourceChanges: changes as [ChainEventResourceChange, ...ChainEventResourceChange[]],
      });
      legacyEventCount += 1;
    }
  }
  return {
    events,
    module: {
      ...instance,
      cooldownRemaining: input.definition.cooldown === 0 ? 0 : input.definition.cooldown + 1,
    },
    state,
  };
}
