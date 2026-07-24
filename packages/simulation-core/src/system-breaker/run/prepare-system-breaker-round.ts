import type { ModuleRoleId, SystemBreakerRun } from '@expedition/shared-types';

import { resizeBoard } from '../board/create-board-state';
import { createRoundOffers } from './create-round-offer';

function mainRole(run: SystemBreakerRun): ModuleRoleId {
  const totals = new Map<ModuleRoleId, number>();
  run.board.cells.forEach((cell) => {
    if (!cell.module) return;
    const definition = run.genome.modules.find(
      (module) => module.id === cell.module?.definitionId,
    )!;
    totals.set(definition.role, (totals.get(definition.role) ?? 0) + definition.baseValue);
  });
  return [...totals.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'PRODUCER';
}

export function prepareSystemBreakerRound(
  input: SystemBreakerRun,
  round: number,
): SystemBreakerRun {
  const board = resizeBoard(input.board, round >= 3 ? 3 : 2);
  board.cells = board.cells.map((cell) => ({
    ...cell,
    blocked: false,
    locked: false,
    ...(cell.module
      ? {
          module: {
            ...cell.module,
            cooldownRemaining: Math.max(0, cell.module.cooldownRemaining - 1),
          },
        }
      : {}),
  }));
  if (round === 4) board.cells.at(-1)!.blocked = true;
  if (round === 7) {
    const ranked = board.cells
      .filter((cell) => cell.module)
      .sort((left, right) => {
        const value = (cell: typeof left) => {
          const definition = input.genome.modules.find(
            (module) => module.id === cell.module?.definitionId,
          )!;
          return definition.baseValue * (cell.module?.level ?? 1);
        };
        return value(right) - value(left);
      });
    (ranked[0] ?? board.cells[0])!.locked = true;
  }
  const activeCounter =
    round === 6
      ? (input.genome.counters.find((counter) => counter.role === mainRole(input)) ??
        input.genome.counters[0])
      : null;
  const run = {
    ...input,
    round,
    board,
    activeModifier: input.genome.threats[round - 1]!.modifier,
    activeCounter,
    resources: { ...input.resources, PROGRESS: 0 },
  };
  return {
    ...run,
    shop: {
      offers: createRoundOffers({
        genome: run.genome,
        round,
        refresh: 0,
        board,
        inventory: run.inventory,
      }),
      refreshesRemaining: 1,
    },
  };
}
