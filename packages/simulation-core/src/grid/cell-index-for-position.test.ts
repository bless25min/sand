import { describe, expect, it } from 'vitest';

import { cellIndexForPosition } from './cell-index-for-position';

describe('cellIndexForPosition', () => {
  it('floors positions and maps them to row-major indices', () => {
    expect(cellIndexForPosition({ x: 2.9, y: 1.2 }, 4, 3)).toBe(6);
  });

  it('clamps positions to the nearest boundary cell', () => {
    expect(cellIndexForPosition({ x: -100, y: -1 }, 4, 3)).toBe(0);
    expect(cellIndexForPosition({ x: 99, y: 99 }, 4, 3)).toBe(11);
  });

  it('rejects invalid coordinates and dimensions', () => {
    expect(() => cellIndexForPosition({ x: Number.NaN, y: 0 }, 4, 3)).toThrow(
      'position must contain finite coordinates',
    );
    expect(() => cellIndexForPosition({ x: 0, y: 0 }, 0, 3)).toThrow(
      'width must be a positive integer',
    );
  });
});
