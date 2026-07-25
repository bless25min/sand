import { describe, expect, it } from 'vitest';

import { SPECTACLE_CUE_IDS, SPECTACLE_MOTIF_IDS } from './spectacle';

describe('guild spectacle vocabulary', () => {
  it('keeps the formal combat and reward vocabulary exhaustive and bounded', () => {
    expect(SPECTACLE_CUE_IDS).toEqual([
      'stack',
      'trigger',
      'block',
      'break',
      'hit',
      'heal',
      'ricochet',
      'kill',
      'overkill',
      'boss-execution',
      'annihilation',
      'loot',
      'chest',
      'legendary',
      'rule-online',
    ]);
    expect(new Set(SPECTACLE_CUE_IDS).size).toBe(SPECTACLE_CUE_IDS.length);
  });

  it('reserves a distinct motif for the fourth formal Build', () => {
    expect(SPECTACLE_MOTIF_IDS).toEqual(['ember', 'storm', 'radiance', 'command']);
  });
});
