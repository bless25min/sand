import type { VisualUnitSource } from '../contracts/visual-unit-source';
import { describe, expect, it } from 'vitest';

import { createVisualPoints } from './create-visual-points';

function source(id: string, overrides: Partial<VisualUnitSource> = {}): VisualUnitSource {
  return {
    id,
    factionId: 'player',
    troopCount: 1_000,
    position: { x: 100, y: 100 },
    targetPosition: { x: 120, y: 100 },
    direction: { x: 1, y: 0 },
    formation: 'DENSE_BLOCK',
    executionState: 'MOVING',
    shape: 'SQUARE',
    color: 0x5da9e9,
    pointScale: 1,
    ...overrides,
  };
}

describe('createVisualPoints', () => {
  it('creates exactly 2,000 stable unique points across four sources', () => {
    const sources = [
      source('heavy'),
      source('archers', { formation: 'LINE', shape: 'TRIANGLE' }),
      source('cavalry', { formation: 'WEDGE', shape: 'DIAMOND' }),
      source('wolves', {
        factionId: 'monsters',
        formation: 'LOOSE',
        shape: 'CIRCLE',
      }),
    ];
    const sourceSnapshot = structuredClone(sources);

    const first = createVisualPoints({
      sources,
      pointBudget: 2_000,
      spacing: 4,
    });
    const second = createVisualPoints({
      sources,
      pointBudget: 2_000,
      spacing: 4,
    });

    expect(first).toEqual(second);
    expect(first).toHaveLength(2_000);
    expect(new Set(first.map((point) => point.id))).toHaveLength(2_000);
    expect(
      Object.fromEntries(
        sources.map(({ id }) => [id, first.filter((point) => point.unitId === id).length]),
      ),
    ).toEqual({
      heavy: 500,
      archers: 500,
      cavalry: 500,
      wolves: 500,
    });
    expect(sources).toEqual(sourceSnapshot);
  });

  it('uses formation-relative start and target positions', () => {
    const [point] = createVisualPoints({
      sources: [source('heavy', { troopCount: 1 })],
      pointBudget: 1,
      spacing: 4,
    });

    expect(point?.position).toEqual({ x: 100, y: 100 });
    expect(point?.targetPosition).toEqual({ x: 120, y: 100 });
  });

  it('marks routing sources as routing visual points', () => {
    const [point] = createVisualPoints({
      sources: [
        source('routing', {
          troopCount: 1,
          executionState: 'ROUTING',
        }),
      ],
      pointBudget: 1,
      spacing: 4,
    });

    expect(point?.state).toBe('ROUTING');
  });
});
