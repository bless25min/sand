import { describe, expect, it } from 'vitest';

import { cell, moduleInstance } from '../chain/chain-test-fixtures';
import { resolveSystemBreakerRound } from './index';
import { runWithModules, testModule } from './scheduler-test-fixtures';

describe('system breaker cooldown and damage transitions', () => {
  it('skips exactly the configured cooldown rounds before it fires again', () => {
    const cooling = testModule('cooling', { cooldown: 2, baseValue: 20 });
    let run = runWithModules(
      [cooling],
      [
        {
          ...cell(0, moduleInstance('cooling')),
          module: { ...moduleInstance('cooling'), definitionId: cooling.id },
        },
        cell(1),
        cell(2),
        cell(3),
      ],
    );

    run = resolveSystemBreakerRound(run).run;
    expect(run.board.cells[0]?.module?.cooldownRemaining).toBe(2);
    run = resolveSystemBreakerRound(run).run;
    expect(run.board.cells[0]?.module?.cooldownRemaining).toBe(1);
    run = resolveSystemBreakerRound(run).run;
    expect(run.board.cells[0]?.module?.cooldownRemaining).toBe(0);

    const ready = resolveSystemBreakerRound(run);
    expect(ready.events.some((event) => event.moduleInstanceId === 'cooling')).toBe(true);
  });

  it('records threat damage for the next round DAMAGED trigger', () => {
    const damaged = testModule('damaged', { trigger: 'DAMAGED', baseValue: 20 });
    let run = runWithModules(
      [damaged],
      [
        {
          ...cell(0, moduleInstance('damaged')),
          module: { ...moduleInstance('damaged'), definitionId: damaged.id },
        },
        cell(1),
        cell(2),
        cell(3),
      ],
    );

    run = resolveSystemBreakerRound(run).run;
    expect(run.previousRoundDamagedIntegrity).toBe(true);

    const next = resolveSystemBreakerRound(run);
    expect(next.events.some((event) => event.moduleInstanceId === 'damaged')).toBe(true);
  });
});
