import type {
  ChainEvent,
  ChainEventResourceChange,
  RoundResult,
  SystemBreakerRoundPreview,
  SystemBreakerRun,
  SystemFragment,
} from '@expedition/shared-types';
import { CORE_RESOURCE_IDS } from '@expedition/shared-types';

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

function createSummary(
  run: SystemBreakerRun,
  events: ChainEvent[],
  resources: SystemBreakerRun['resources'],
  success: boolean,
): SystemBreakerRoundPreview {
  const triggeredCount = events.filter((event) => event.type === 'MODULE_TRIGGERED').length;
  const moduleCount = run.board.cells.filter((cell) => cell.module).length;
  return {
    projectedProgress: resources.PROGRESS,
    targetProgress: run.genome.threats[run.round - 1]?.targetProgress ?? 0,
    success,
    integrity: resources.INTEGRITY,
    instability: resources.INSTABILITY,
    credits: resources.CREDITS,
    triggeredCount,
    blockedCount: Math.max(0, moduleCount - triggeredCount),
  };
}

function append(events: ChainEvent[], event: Omit<ChainEvent, 'sequence'>): ChainEvent[] {
  if (events.length >= 32 || events.some((entry) => entry.type === 'CHAIN_LIMIT_REACHED'))
    return events;
  return [...events, { ...event, sequence: events.length + 1 } as ChainEvent];
}

export function resolveSystemBreakerRound(run: SystemBreakerRun): RoundResult {
  if (run.status !== 'PREPARE') {
    return {
      run,
      events: run.chainLog,
      success: false,
      summary: createSummary(run, run.chainLog, run.resources, false),
    };
  }
  const threat = run.genome.threats[run.round - 1]!;
  const chain = resolveChain(run);
  const resources = { ...chain.resources };
  const resourcesBeforeThreat = { ...resources };
  const success = resources.PROGRESS >= threat.targetProgress;
  const integrityDamage = success ? 0 : Math.max(0, threat.integrityDamage - chain.protection);
  if (!success) {
    resources.INTEGRITY = Math.max(0, resources.INTEGRITY - integrityDamage);
    resources.INSTABILITY = Math.min(100, resources.INSTABILITY + threat.instabilityGain);
  }
  const revived = resources.INTEGRITY <= 0 && chain.reviveAvailable;
  if (revived) resources.INTEGRITY = 1;
  const creditReward = success ? 8 : 3;
  resources.CREDITS = Math.min(999, resources.CREDITS + creditReward);

  let events = append(chain.events, {
    type: success ? 'THREAT_DEFEATED' : 'THREAT_HIT',
    message: success ? `${threat.name} 已擊穿。` : `${threat.name} 反擊。`,
  });
  const resourceChanges: ChainEventResourceChange[] = CORE_RESOURCE_IDS.flatMap((resource) => {
    const delta = resources[resource] - resourcesBeforeThreat[resource];
    return delta === 0 ? [] : [{ resource, delta }];
  });
  if (resourceChanges.length > 0)
    events = append(events, {
      type: 'RESOURCE_CHANGED',
      message: success ? '威脅獎勵已入帳。' : '威脅後果已套用。',
      resourceChanges: resourceChanges as [ChainEventResourceChange, ...ChainEventResourceChange[]],
    });
  if (revived)
    events = append(events, { type: 'MODULE_REVIVED', message: '重啟種子保留了 1 點完整度。' });

  const summary = createSummary(run, events, resources, success);
  const score = run.score + (success ? 100 + summary.triggeredCount * 5 : summary.triggeredCount);
  const terminalDefeat =
    resources.INTEGRITY <= 0 || resources.INSTABILITY >= 100 || (run.round === 7 && !success);
  const terminalVictory = run.round === 7 && success;
  const resolved: SystemBreakerRun = {
    ...run,
    board: chain.board,
    resources,
    status: terminalVictory ? 'VICTORY' : terminalDefeat ? 'DEFEAT' : 'PREPARE',
    completedThreats: run.completedThreats + (success ? 1 : 0),
    score,
    bestChain: Math.max(run.bestChain, summary.triggeredCount),
    chainLog: events,
    previousRoundDamagedIntegrity: integrityDamage > 0,
  };
  if (terminalVictory || terminalDefeat) {
    return {
      run: { ...resolved, fragment: createFragment(resolved) },
      events,
      success,
      summary,
    };
  }
  return {
    run: prepareSystemBreakerRound(resolved, run.round + 1),
    events,
    success,
    summary,
  };
}
