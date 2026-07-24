import type { GameModuleDefinition, SystemBreakerRun } from '@expedition/shared-types';

import { createRun } from '../chain/chain-test-fixtures';

export const testModule = (
  id: string,
  overrides: Partial<GameModuleDefinition> = {},
): GameModuleDefinition => ({
  id,
  name: id,
  description: id,
  role: 'PRODUCER',
  trigger: 'ROUND_START',
  effect: 'ADD_PROGRESS',
  target: 'SELF',
  baseValue: 4,
  cost: 1,
  cooldown: 0,
  ...overrides,
});

export function runWithModules(
  modules: GameModuleDefinition[],
  cells: SystemBreakerRun['board']['cells'],
): SystemBreakerRun {
  const run = createRun(cells);
  const genomeModules = [...modules];
  while (genomeModules.length < 3) genomeModules.push(testModule(`filler-${genomeModules.length}`));
  return {
    ...run,
    board: { ...run.board, size: cells.length > 4 ? 3 : 2, cells },
    genome: { ...run.genome, modules: genomeModules },
  };
}
