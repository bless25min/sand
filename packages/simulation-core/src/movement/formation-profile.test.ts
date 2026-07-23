import type { FormationType } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { getFormationProfile } from './formation-profile';

const formations: readonly FormationType[] = [
  'DENSE_BLOCK',
  'LINE',
  'COLUMN',
  'LOOSE',
  'SQUARE',
  'WEDGE',
];

describe('getFormationProfile', () => {
  it('defines a positive profile for every formation', () => {
    for (const formation of formations) {
      const profile = getFormationProfile(formation);

      expect(profile.speedMultiplier).toBeGreaterThan(0);
      expect(profile.frontageMultiplier).toBeGreaterThan(0);
      expect(profile.depthMultiplier).toBeGreaterThan(0);
      expect(profile.fatigueMultiplier).toBeGreaterThan(0);
    }
  });

  it('models Dense Block as slower and deeper than Line', () => {
    const denseBlock = getFormationProfile('DENSE_BLOCK');
    const line = getFormationProfile('LINE');

    expect(denseBlock.speedMultiplier).toBeLessThan(line.speedMultiplier);
    expect(denseBlock.depthMultiplier).toBeGreaterThan(line.depthMultiplier);
  });

  it('models Column as faster than Dense Block', () => {
    expect(getFormationProfile('COLUMN').speedMultiplier).toBeGreaterThan(
      getFormationProfile('DENSE_BLOCK').speedMultiplier,
    );
  });
});
