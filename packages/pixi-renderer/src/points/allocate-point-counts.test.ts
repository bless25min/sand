import { describe, expect, it } from 'vitest';

import { allocatePointCounts } from './allocate-point-counts';

describe('allocatePointCounts', () => {
  it('allocates exactly 2,000 points when troop count allows', () => {
    const allocations = allocatePointCounts([1_000, 800, 600, 400], 2_000);

    expect(allocations).toHaveLength(4);
    expect(allocations.reduce((sum, value) => sum + value, 0)).toBe(2_000);
  });

  it('never allocates more points than total troops', () => {
    expect(allocatePointCounts([10, 5, 0], 2_000)).toEqual([10, 5, 0]);
  });

  it('uses stable source order to resolve equal remainders', () => {
    expect(allocatePointCounts([1, 1, 1], 2)).toEqual([1, 1, 0]);
  });

  it('rejects invalid troop counts and budgets', () => {
    expect(() => allocatePointCounts([1, -1], 2_000)).toThrow(
      'troop counts must be non-negative integers',
    );
    expect(() => allocatePointCounts([1], 1.5)).toThrow(
      'point budget must be a non-negative integer',
    );
  });
});
