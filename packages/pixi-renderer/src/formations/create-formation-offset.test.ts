import type { FormationType, Vec2 } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createFormationOffset } from './create-formation-offset';

function offsets(formation: FormationType, count = 36): Vec2[] {
  return Array.from({ length: count }, (_, index) =>
    createFormationOffset({
      pointIndex: index,
      pointCount: count,
      formation,
      spacing: 4,
      animationSeed: index * 17,
    }),
  );
}

function extent(values: readonly Vec2[], axis: 'x' | 'y'): number {
  const coordinates = values.map((value) => value[axis]);
  return Math.max(...coordinates) - Math.min(...coordinates);
}

function averageRadius(values: readonly Vec2[]): number {
  return values.reduce((sum, value) => sum + Math.hypot(value.x, value.y), 0) / values.length;
}

describe('createFormationOffset', () => {
  it('is deterministic for loose formations without Math.random', () => {
    expect(offsets('LOOSE')).toEqual(offsets('LOOSE'));
  });

  it('makes Line wider than Column and Column deeper than Line', () => {
    const line = offsets('LINE');
    const column = offsets('COLUMN');

    expect(extent(line, 'x')).toBeGreaterThan(extent(column, 'x'));
    expect(extent(column, 'y')).toBeGreaterThan(extent(line, 'y'));
  });

  it('keeps Dense Block more compact than Loose', () => {
    expect(averageRadius(offsets('DENSE_BLOCK'))).toBeLessThan(averageRadius(offsets('LOOSE')));
  });

  it('gives Square and Wedge visibly different layouts', () => {
    expect(offsets('SQUARE')).not.toEqual(offsets('WEDGE'));
  });

  it('rejects indices outside the point collection', () => {
    expect(() =>
      createFormationOffset({
        pointIndex: 2,
        pointCount: 2,
        formation: 'LINE',
        spacing: 4,
        animationSeed: 1,
      }),
    ).toThrow('pointIndex must be within pointCount');
  });
});
