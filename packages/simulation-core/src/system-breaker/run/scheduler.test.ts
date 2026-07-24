import { describe, expect, it } from 'vitest';

import { cell, moduleInstance } from '../chain/chain-test-fixtures';
import { resolveSystemBreakerRound } from './index';
import { runWithModules, testModule } from './scheduler-test-fixtures';

describe('system breaker scheduler', () => {
  it('resolves staged triggers before ascending reactive passes', () => {
    const start = testModule('start');
    const fixed = testModule('fixed', { trigger: 'FIXED_TIME' });
    const firstReactive = testModule('first-reactive', { trigger: 'ADJACENT_TRIGGER' });
    const secondReactive = testModule('second-reactive', { trigger: 'ADJACENT_TRIGGER' });
    const run = runWithModules(
      [start, fixed, firstReactive, secondReactive],
      [
        {
          ...cell(1, moduleInstance('first-reactive')),
          module: { ...moduleInstance('first-reactive'), definitionId: firstReactive.id },
        },
        {
          ...cell(2, moduleInstance('second-reactive')),
          module: { ...moduleInstance('second-reactive'), definitionId: secondReactive.id },
        },
        cell(0),
        cell(3),
        cell(4),
        {
          ...cell(5, moduleInstance('start')),
          module: { ...moduleInstance('start'), definitionId: start.id },
        },
        cell(6),
        cell(7),
        {
          ...cell(8, moduleInstance('fixed')),
          module: { ...moduleInstance('fixed'), definitionId: fixed.id },
        },
      ],
    );

    const result = resolveSystemBreakerRound(run);

    expect(
      result.events
        .filter((event) => event.type === 'MODULE_TRIGGERED')
        .map((event) => event.moduleInstanceId),
    ).toEqual(['start', 'fixed', 'second-reactive', 'first-reactive']);
  });

  it('applies repeatOnce twice as one activation', () => {
    const repeating = testModule('repeating', { repeatOnce: true });
    const run = runWithModules(
      [repeating],
      [
        {
          ...cell(0, moduleInstance('repeating')),
          module: { ...moduleInstance('repeating'), definitionId: repeating.id },
        },
        cell(1),
        cell(2),
        cell(3),
      ],
    );

    const result = resolveSystemBreakerRound(run);

    expect(result.events.filter((event) => event.type === 'MODULE_TRIGGERED')).toHaveLength(1);
    expect(result.events.filter((event) => event.type === 'RESOURCE_CHANGED')).toHaveLength(3);
    expect(result.summary.projectedProgress).toBe(8);
  });

  it('blocks an unconnected relational target', () => {
    const relational = testModule('relational', { target: 'RIGHT' });
    const run = runWithModules(
      [relational],
      [
        {
          ...cell(0, moduleInstance('relational')),
          module: { ...moduleInstance('relational'), definitionId: relational.id },
        },
        cell(1),
        cell(2),
        cell(3),
      ],
    );

    const result = resolveSystemBreakerRound(run);

    expect(result.summary).toMatchObject({ triggeredCount: 0, blockedCount: 1 });
  });

  it('keeps a player-readable lock event while suppressing non-disabled modules', () => {
    const locked = testModule('locked');
    const run = runWithModules(
      [locked],
      [
        {
          ...cell(0, moduleInstance('locked')),
          locked: true,
          module: { ...moduleInstance('locked'), definitionId: locked.id },
        },
        cell(1),
        cell(2),
        cell(3),
      ],
    );

    const result = resolveSystemBreakerRound(run);

    expect(result.events.some((event) => event.type === 'MODULE_LOCKED')).toBe(true);
    expect(result.summary).toMatchObject({ triggeredCount: 0, blockedCount: 1 });
  });
});
