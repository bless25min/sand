import type { ChainEvent, SystemBreakerRun } from '@expedition/shared-types';
import { previewSystemBreakerRound } from '@expedition/simulation-core';

export function createRoundDisplayProjection(
  run: SystemBreakerRun,
  events: readonly ChainEvent[],
  visibleEventCount: number,
) {
  return {
    preview: previewSystemBreakerRound(run),
    activeInstanceId: events[visibleEventCount - 1]?.moduleInstanceId ?? null,
  };
}
