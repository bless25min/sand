import {
  CORE_RESOURCE_IDS,
  type ChainEvent,
  type ChainEventInput,
  type ChainEventResourceChange,
  type GameModuleDefinition,
  type SystemBreakerRun,
} from '@expedition/shared-types';

import { applyEffect, type EffectState } from './apply-effect';

const EVENT_LIMIT = 32;

export interface ChainResolution extends EffectState {
  events: ChainEvent[];
}

function resourceChanges(
  before: SystemBreakerRun['resources'],
  after: SystemBreakerRun['resources'],
): ChainEventResourceChange[] {
  return CORE_RESOURCE_IDS.flatMap((resource) => {
    const delta = after[resource] - before[resource];
    return delta === 0 ? [] : [{ resource, delta }];
  });
}

function ruleMultiplier(run: SystemBreakerRun, cellIndex: number, triggerCount: number): number {
  let multiplier = 1;
  if (run.genome.rules.includes('HIGH_INSTABILITY_BONUS') && run.resources.INSTABILITY >= 50)
    multiplier += 0.3;
  if (run.genome.rules.includes('LOW_INTEGRITY_BONUS') && run.resources.INTEGRITY <= 40)
    multiplier += 0.25;
  if (run.genome.rules.includes('CHAIN_MOMENTUM')) multiplier += triggerCount * 0.03;
  const row = Math.floor(cellIndex / run.board.size);
  const column = cellIndex % run.board.size;
  const adjacent = run.board.cells.some((cell) => {
    if (!cell.module) return false;
    const otherRow = Math.floor(cell.index / run.board.size);
    const otherColumn = cell.index % run.board.size;
    return Math.abs(row - otherRow) + Math.abs(column - otherColumn) === 1;
  });
  if (adjacent && run.genome.rules.includes('ADJACENCY_SURGE')) multiplier += 0.25;
  return multiplier;
}

export function resolveChain(run: SystemBreakerRun): ChainResolution {
  let state: EffectState = {
    resources: { ...run.resources },
    amplifier: 1,
    protection: 0,
    reviveAvailable: false,
  };
  const events: ChainEvent[] = [];
  let limited = false;
  const append = (event: ChainEventInput): boolean => {
    if (events.length >= EVENT_LIMIT - 1) {
      events.push({
        sequence: events.length + 1,
        type: 'CHAIN_LIMIT_REACHED',
        message: '連鎖達到 32 事件上限，後續效果已截斷。',
      });
      limited = true;
      return false;
    }
    events.push({ ...event, sequence: events.length + 1 });
    return true;
  };

  if (run.round === 7) append({ type: 'BOSS_PHASE_TWO', message: 'Boss 第二階段規則已載入。' });
  let cells = [...run.board.cells].filter((cell) => cell.module);
  if (run.round === 7 && run.genome.threats[6]?.phaseTwoModifier === 'REVERSE_HORIZONTAL')
    cells = cells.reverse();

  for (const cell of cells) {
    if (limited) break;
    const instance = cell.module!;
    const definition = run.genome.modules.find(
      (module) => module.id === instance.definitionId,
    ) as GameModuleDefinition;
    if (cell.locked) {
      append({
        type: 'MODULE_LOCKED',
        message: `${definition.name} 被威脅封鎖。`,
        moduleInstanceId: instance.instanceId,
      });
      continue;
    }
    const repetitions = definition.repeatOnce ? 2 : 1;
    for (let repeat = 0; repeat < repetitions && !limited; repeat += 1) {
      append({
        type: 'MODULE_TRIGGERED',
        message: `${definition.name} 觸發${repeat ? '第二次' : ''}。`,
        moduleInstanceId: instance.instanceId,
        role: definition.role,
        effect: definition.effect,
      });
      let value =
        definition.baseValue * instance.level * ruleMultiplier(run, cell.index, events.length);
      if (run.activeCounter?.role === definition.role) value *= run.activeCounter.outputMultiplier;
      if (run.savedFragment?.moduleId === definition.id) value += run.savedFragment.bonus;
      const priorResources = state.resources;
      state = applyEffect(state, definition, value);
      if (run.activeModifier === 'OVERLOAD') state.resources.INSTABILITY += 2;
      if (
        repeat > 0 &&
        run.round === 7 &&
        run.genome.threats[6]?.phaseTwoModifier === 'PUNISH_REPEAT'
      )
        state.resources.INSTABILITY += 5;
      const changes = resourceChanges(priorResources, state.resources);
      if (changes.length > 0) {
        append({
          type: 'RESOURCE_CHANGED',
          message: `${definition.name} 改寫資源。`,
          moduleInstanceId: instance.instanceId,
          value: Math.round(value),
          resourceChanges: changes as [ChainEventResourceChange, ...ChainEventResourceChange[]],
        });
      }
    }
  }
  return { ...state, events };
}
