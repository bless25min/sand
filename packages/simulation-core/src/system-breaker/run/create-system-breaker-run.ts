import type { GameGenome, SystemBreakerRun, SystemFragment } from '@expedition/shared-types';

import { createBoardState } from '../board/create-board-state';
import { prepareSystemBreakerRound } from './prepare-system-breaker-round';

export function createSystemBreakerRun(
  genome: GameGenome,
  fragment?: SystemFragment,
): SystemBreakerRun {
  const initial: SystemBreakerRun = {
    genome,
    seed: genome.seed,
    round: 1,
    status: 'PREPARE',
    resources: { PROGRESS: 0, INTEGRITY: 100, INSTABILITY: 0, CREDITS: 18 },
    board: createBoardState(2),
    inventory: [],
    shop: { offers: [], refreshesRemaining: 1 },
    activeModifier: 'NONE',
    activeCounter: null,
    ...(fragment ? { savedFragment: fragment } : {}),
    completedThreats: 0,
    score: 0,
    bestChain: 0,
    nextInstanceId: 1,
    chainLog: [],
    previousRoundDamagedIntegrity: false,
  };
  return prepareSystemBreakerRound(initial, 1);
}
