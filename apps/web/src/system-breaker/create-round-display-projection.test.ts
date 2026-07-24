import {
  createFallbackGameGenome,
  createSystemBreakerRun,
  previewSystemBreakerRound,
} from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { createRoundDisplayProjection } from './create-round-display-projection';

describe('createRoundDisplayProjection', () => {
  it('uses the canonical preview and the latest visible module event', () => {
    const run = createSystemBreakerRun(
      createFallbackGameGenome({ prompt: '投影測試', seed: 'round-display' }),
    );
    const events = [
      {
        sequence: 1,
        type: 'MODULE_TRIGGERED' as const,
        message: '模組啟動',
        moduleInstanceId: 'module-1',
        role: 'PRODUCER' as const,
        effect: 'ADD_PROGRESS' as const,
      },
    ];

    const projection = createRoundDisplayProjection(run, events, 1);

    expect(projection.preview).toEqual(previewSystemBreakerRound(run));
    expect(projection.activeInstanceId).toBe('module-1');
  });

  it('does not project an event that is not visible yet', () => {
    const run = createSystemBreakerRun(
      createFallbackGameGenome({ prompt: '投影測試', seed: 'hidden-event' }),
    );

    const projection = createRoundDisplayProjection(
      run,
      [
        {
          sequence: 1,
          type: 'MODULE_TRIGGERED',
          message: '模組啟動',
          moduleInstanceId: 'module-1',
          role: 'PRODUCER',
          effect: 'ADD_PROGRESS',
        },
      ],
      0,
    );

    expect(projection.activeInstanceId).toBeNull();
  });
});
