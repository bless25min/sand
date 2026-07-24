import {
  type ChainEvent,
  type ChainEventInput,
  type GameModuleDefinition,
  type SystemBoard,
  type SystemBreakerRun,
} from '@expedition/shared-types';

import { type EffectState } from './apply-effect';
import { evaluateModuleTrigger, type ModuleTriggerStage } from './evaluate-module-trigger';
import { resolveModuleActivation } from './resolve-module-activation';

const EVENT_LIMIT = 32;

export interface ChainResolution extends EffectState {
  board: SystemBoard;
  events: ChainEvent[];
}

function copyBoard(board: SystemBoard): SystemBoard {
  return {
    ...board,
    cells: board.cells.map((cell) => ({
      ...cell,
      ...(cell.module ? { module: { ...cell.module } } : {}),
    })),
  };
}

export function resolveChain(run: SystemBreakerRun): ChainResolution {
  let state: EffectState = {
    resources: { ...run.resources },
    amplifier: 1,
    protection: 0,
    reviveAvailable: false,
  };
  const board = copyBoard(run.board);
  const events: ChainEvent[] = [];
  const firedModuleInstanceIds = new Set<string>();
  const definitions = new Map(run.genome.modules.map((definition) => [definition.id, definition]));
  let limited = false;

  const append = (event: ChainEventInput): void => {
    events.push({ ...event, sequence: events.length + 1 });
  };
  const reachLimit = (): void => {
    if (limited) return;
    limited = true;
    if (events.length < EVENT_LIMIT)
      append({ type: 'CHAIN_LIMIT_REACHED', message: '連鎖達到 32 事件上限，後續效果已截斷。' });
  };
  const currentRun = (): SystemBreakerRun => ({ ...run, resources: state.resources, board });

  if (run.round === 7) append({ type: 'BOSS_PHASE_TWO', message: 'Boss 第二階段規則已載入。' });

  const activate = (cellIndex: number, definition: GameModuleDefinition): boolean => {
    const cell = board.cells.find((candidate) => candidate.index === cellIndex);
    const instance = cell?.module;
    if (!cell || !instance || firedModuleInstanceIds.has(instance.instanceId)) return false;
    const activation = resolveModuleActivation({
      run: currentRun(),
      state,
      cell,
      definition,
      legacyEventCount: events.length,
      roundStartResources: run.resources,
    });
    if (events.length + activation.events.length > EVENT_LIMIT - 1) {
      reachLimit();
      return false;
    }
    activation.events.forEach(append);
    state = activation.state;
    cell.module = activation.module;
    firedModuleInstanceIds.add(instance.instanceId);
    return true;
  };

  const resolveStage = (stage: ModuleTriggerStage, cells: readonly number[]): boolean => {
    let activated = false;
    for (const cellIndex of cells) {
      if (limited) break;
      const cell = board.cells.find((candidate) => candidate.index === cellIndex);
      const instance = cell?.module;
      const definition = instance ? definitions.get(instance.definitionId) : undefined;
      if (!cell || !instance || !definition || firedModuleInstanceIds.has(instance.instanceId))
        continue;
      if (
        evaluateModuleTrigger({
          run: currentRun(),
          cell,
          definition,
          stage,
          firedModuleInstanceIds: [...firedModuleInstanceIds],
        })
      )
        activated = activate(cell.index, definition) || activated;
    }
    return activated;
  };

  const ascending = board.cells
    .filter((cell) => cell.module)
    .map((cell) => cell.index)
    .sort((left, right) => left - right);
  const staged =
    run.round === 7 && run.genome.threats[6]?.phaseTwoModifier === 'REVERSE_HORIZONTAL'
      ? [...ascending].reverse()
      : ascending;
  for (const cellIndex of ascending) {
    if (limited) break;
    const cell = board.cells.find((candidate) => candidate.index === cellIndex);
    const definition = cell?.module ? definitions.get(cell.module.definitionId) : undefined;
    if (!cell?.locked || !cell.module || !definition) continue;
    if (events.length >= EVENT_LIMIT - 1) {
      reachLimit();
      break;
    }
    append({
      type: 'MODULE_LOCKED',
      message: `${definition.name} 被威脅封鎖。`,
      moduleInstanceId: cell.module.instanceId,
    });
  }
  resolveStage('ROUND_START', staged);
  if (!limited) resolveStage('FIXED_TIME', staged);
  while (!limited && resolveStage('REACTIVE', ascending)) {
    // Later cells can unlock earlier adjacent cells, so repeat in ascending board order.
  }

  return { ...state, board, events };
}
