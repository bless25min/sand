import type { SystemBreakerRoundPreview, SystemBreakerRun } from '@expedition/shared-types';

import { resolveSystemBreakerRound } from './resolve-system-breaker-round';

export function previewSystemBreakerRound(run: SystemBreakerRun): SystemBreakerRoundPreview {
  return resolveSystemBreakerRound(run).summary;
}
