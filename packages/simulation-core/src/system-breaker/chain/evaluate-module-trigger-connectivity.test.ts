import { describe, expect, it } from 'vitest';

import { evaluateModuleTrigger } from './evaluate-module-trigger';
import { cell, createRun, definition, moduleInstance } from './chain-test-fixtures';

describe('evaluateModuleTrigger connectivity and cooldown', () => {
  it('requires an available module in each relational target set', () => {
    const cases = [
      ['ADJACENT', 0],
      ['LEFT', 1],
      ['RIGHT', 0],
      ['ROW', 0],
      ['ALL', 0],
    ] as const;

    for (const [target, sourceIndex] of cases) {
      const source = cell(sourceIndex, moduleInstance('source'));
      const otherIndex = sourceIndex === 0 ? 1 : 0;
      const connected = createRun([
        source,
        cell(otherIndex, moduleInstance('target')),
        cell(2),
        cell(3),
      ]);
      const locked = createRun([
        source,
        { ...cell(otherIndex, moduleInstance('target')), locked: true },
        cell(2),
        cell(3),
      ]);

      expect(
        evaluateModuleTrigger({
          run: connected,
          cell: source,
          definition: definition({ target }),
          stage: 'ROUND_START',
        }),
      ).toBe(true);
      expect(
        evaluateModuleTrigger({
          run: locked,
          cell: source,
          definition: definition({ target }),
          stage: 'ROUND_START',
        }),
      ).toBe(false);
    }
  });

  it('treats a blocked relational target as unavailable while self remains connected', () => {
    const source = cell(0, moduleInstance('source'));
    const blockedTarget = { ...cell(1, moduleInstance('target')), blocked: true };
    const run = createRun([source, blockedTarget, cell(2), cell(3)]);
    const blockedSelf = { ...cell(0, moduleInstance('self')), blocked: true };

    expect(
      evaluateModuleTrigger({
        run,
        cell: source,
        definition: definition({ target: 'RIGHT' }),
        stage: 'ROUND_START',
      }),
    ).toBe(false);
    expect(
      evaluateModuleTrigger({
        run: createRun([blockedSelf, cell(1), cell(2), cell(3)]),
        cell: blockedSelf,
        definition: definition(),
        stage: 'ROUND_START',
      }),
    ).toBe(true);
  });

  it('does not ready a module while its canonical cooldown remains positive', () => {
    const cooling = cell(0, moduleInstance('source', 1));
    const ready = cell(0, moduleInstance('source'));

    expect(
      evaluateModuleTrigger({
        run: createRun([cooling, cell(1), cell(2), cell(3)]),
        cell: cooling,
        definition: definition(),
        stage: 'ROUND_START',
      }),
    ).toBe(false);
    expect(
      evaluateModuleTrigger({
        run: createRun([ready, cell(1), cell(2), cell(3)]),
        cell: ready,
        definition: definition(),
        stage: 'ROUND_START',
      }),
    ).toBe(true);
  });
});
