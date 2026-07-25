import { describe, expect, it } from 'vitest';

import { pageSlice, wrapThumbIndex } from './thumb-deck-model';

describe('thumb deck model', () => {
  it('wraps selection in either direction and stays safe for an empty list', () => {
    expect(wrapThumbIndex(0, 3, 1)).toBe(1);
    expect(wrapThumbIndex(2, 3, 1)).toBe(0);
    expect(wrapThumbIndex(0, 3, -1)).toBe(2);
    expect(wrapThumbIndex(8, 0, 1)).toBe(0);
  });

  it('returns one bounded inventory page without mutating the source', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];

    expect(pageSlice(items, 0, 2)).toEqual(['a', 'b']);
    expect(pageSlice(items, 2, 2)).toEqual(['e']);
    expect(pageSlice(items, 8, 2)).toEqual([]);
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
