import { SPECTACLE_CUE_IDS, SPECTACLE_MOTIF_IDS, type HuntRewards } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import {
  cueForComboEvent,
  rewardSpectacleCues,
  SPECTACLE_CUE_REGISTRY,
  SPECTACLE_MOTIFS,
} from './spectacle-registry';

describe('spectacle registry', () => {
  it('defines a bounded visual identity for every stable cue and build motif', () => {
    expect(Object.keys(SPECTACLE_CUE_REGISTRY)).toEqual([...SPECTACLE_CUE_IDS]);
    expect(Object.keys(SPECTACLE_MOTIFS)).toEqual([...SPECTACLE_MOTIF_IDS]);

    for (const cue of Object.values(SPECTACLE_CUE_REGISTRY)) {
      expect(cue.intensity).toBeGreaterThanOrEqual(1);
      expect(cue.intensity).toBeLessThanOrEqual(5);
      expect(cue.hitStopMs).toBeLessThanOrEqual(180);
      expect(cue.shakePx).toBeLessThanOrEqual(18);
    }
  });

  it('prefers authored event cues and keeps deterministic kind fallbacks', () => {
    expect(
      cueForComboEvent({
        id: 0,
        causalId: 'ricochet',
        kind: 'damage',
        message: 'bounce',
        cueId: 'ricochet',
      }),
    ).toBe('ricochet');
    expect(
      cueForComboEvent({
        id: 1,
        causalId: 'heal',
        kind: 'healing',
        message: 'restore',
      }),
    ).toBe('heal');
    expect(
      cueForComboEvent({
        id: 2,
        causalId: 'legacy',
        kind: 'damage',
        message: 'impact',
        cueId: 'legacy-unknown-cue',
      }),
    ).toBe('hit');
    expect(
      cueForComboEvent({
        id: 3,
        causalId: 'overflow-rule-damage',
        kind: 'damage',
        message: 'overflow damage',
        cueId: 'heal',
      }),
    ).toBe('hit');
    expect(
      cueForComboEvent({
        id: 4,
        causalId: 'authored-heal',
        kind: 'healing',
        message: 'restore',
        cueId: 'hit',
      }),
    ).toBe('heal');
  });

  it('projects loot, chest, and legendary reveals from completed rewards', () => {
    expect(
      rewardSpectacleCues({
        questId: 'border_pack',
        huntId: 'greyfang_border',
        successful: true,
        experience: 100,
        gold: 200,
        clearMs: 500,
        materials: [],
        axes: {
          multiKill: 3,
          chainWipe: true,
          annihilation: true,
          perfectAnnihilation: true,
          bossChest: true,
          quantityMultiplier: 3,
          individualOverkill: {},
          sharedOverflow: 99,
          totalOverkill: 99,
        },
        items: [
          {
            id: 'legend',
            baseId: 'legend-base',
            name: 'Legend',
            slot: 'weapon',
            rarity: 'legendary',
            mainStat: { stat: 'attack', value: 99 },
            affixes: [],
            sellValue: 99,
            sourceEnemyId: 'alpha',
            qualityScore: 999,
            jackpot: true,
            recommendedBuildIds: [],
          },
        ],
      } as HuntRewards),
    ).toEqual(['loot', 'chest', 'legendary']);
  });
});
