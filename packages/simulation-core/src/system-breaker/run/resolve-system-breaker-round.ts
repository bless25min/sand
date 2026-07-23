import type {
  ChainEvent,
  RoundResult,
  SystemBreakerRun,
  SystemFragment,
} from '@expedition/shared-types';

import { resolveChain } from '../chain/resolve-chain';
import { prepareSystemBreakerRound } from './prepare-system-breaker-round';

function createFragment(run: SystemBreakerRun): SystemFragment {
  const ranked = [...run.board.cells]
    .filter((cell) => cell.module)
    .sort((left, right) => (right.module?.level ?? 0) - (left.module?.level ?? 0));
  const moduleId = ranked[0]?.module?.definitionId ?? run.genome.modules[0]!.id;
  const definition = run.genome.modules.find((module) => module.id === moduleId)!;
  return { version: 1, moduleId, name: definition.name, bonus: 1 };
}

export function resolveSystemBreakerRound(run: SystemBreakerRun): RoundResult {
  if (run.status !== 'PREPARE') return { run, events: run.chainLog, success: false };
  const threat = run.genome.threats[run.round - 1]!;
  const chain = resolveChain(run);
  const resources = { ...chain.resources };
  const success = resources.PROGRESS >= threat.targetProgress;
  let events: ChainEvent[] = chain.events;
  const canAppend = () => !events.some((event) => event.type === 'CHAIN_LIMIT_REACHED');
  if (canAppend()) {
    events = [
      ...events,
      {
        sequence: events.length + 1,
        type: success ? 'THREAT_DEFEATED' : 'THREAT_HIT',
        message: success ? `${threat.name} 已擊穿。` : `${threat.name} 反擊。`,
      },
    ];
  }

  if (!success) {
    resources.INTEGRITY = Math.max(
      0,
      resources.INTEGRITY - Math.max(0, threat.integrityDamage - chain.protection),
    );
    resources.INSTABILITY = Math.min(100, resources.INSTABILITY + threat.instabilityGain);
  }
  if (resources.INTEGRITY <= 0 && chain.reviveAvailable) {
    resources.INTEGRITY = 1;
    if (canAppend())
      events.push({
        sequence: events.length + 1,
        type: 'MODULE_REVIVED',
        message: '重啟種子保留了 1 點完整度。',
      });
  }

  const triggered = events.filter((event) => event.type === 'MODULE_TRIGGERED').length;
  const score = run.score + (success ? 100 + triggered * 5 : triggered);
  const terminalDefeat =
    resources.INTEGRITY <= 0 || resources.INSTABILITY >= 100 || (run.round === 7 && !success);
  const terminalVictory = run.round === 7 && success;
  const resolved: SystemBreakerRun = {
    ...run,
    resources: {
      ...resources,
      CREDITS: Math.min(999, resources.CREDITS + (success ? 8 : 3)),
    },
    status: terminalVictory ? 'VICTORY' : terminalDefeat ? 'DEFEAT' : 'PREPARE',
    completedThreats: run.completedThreats + (success ? 1 : 0),
    score,
    bestChain: Math.max(run.bestChain, triggered),
    chainLog: events,
  };
  if (terminalVictory || terminalDefeat) {
    return { run: { ...resolved, fragment: createFragment(resolved) }, events, success };
  }
  return {
    run: prepareSystemBreakerRound(resolved, run.round + 1),
    events,
    success,
  };
}
