import { describe, expect, it } from 'vitest';

import { createFirstHuntCoach } from './first-hunt-coach';

function input(overrides: Record<string, unknown> = {}) {
  return {
    tutorial: 'active' as const,
    screen: 'battle' as const,
    questId: 'border_pack',
    selectedBuildId: 'retaliation',
    selectedTargetId: 'wolf_scout',
    draftCardIds: [] as readonly string[],
    previewEventCount: 0,
    rewardItemCount: 0,
    resolvedItemCount: 0,
    hasBorderRecord: false,
    replaying: false,
    previewAcknowledged: false,
    bossExecutionOpen: false,
    ...overrides,
  };
}

describe('first hunt coach', () => {
  it('guides the exact retaliation signature route and pauses only before player decisions', () => {
    expect(createFirstHuntCoach(input({ selectedTargetId: 'wolf_alpha' }))).toMatchObject({
      step: 'target',
      paused: true,
    });
    expect(createFirstHuntCoach(input())).toMatchObject({
      step: 'brace',
      paused: true,
      expectedCardId: 'brann_brace',
    });
    expect(createFirstHuntCoach(input({ draftCardIds: ['brann_brace'] }))).toMatchObject({
      step: 'riposte',
      expectedCardId: 'brann_riposte',
    });
    expect(
      createFirstHuntCoach(
        input({ draftCardIds: ['brann_brace', 'brann_riposte', 'brann_sweep'] }),
      ),
    ).toMatchObject({ step: 'preview', paused: true });
    expect(
      createFirstHuntCoach(
        input({
          draftCardIds: ['brann_brace', 'brann_riposte', 'brann_sweep', 'lyra_mark'],
          previewAcknowledged: true,
        }),
      ),
    ).toMatchObject({ step: 'release', paused: true });
    expect(createFirstHuntCoach(input({ draftCardIds: ['lyra_quickshot'] }))).toMatchObject({
      step: 'recover',
      paused: true,
    });
  });

  it('lets playback advance and then routes loot, return, and replay', () => {
    expect(createFirstHuntCoach(input({ screen: 'playback' }))).toMatchObject({
      step: 'playback',
      paused: false,
    });
    expect(
      createFirstHuntCoach(input({ screen: 'rewards', rewardItemCount: 4, resolvedItemCount: 2 })),
    ).toMatchObject({ step: 'loot', paused: false });
    expect(createFirstHuntCoach(input({ screen: 'guild', hasBorderRecord: true }))).toMatchObject({
      step: 'replay',
      paused: false,
    });
    expect(
      createFirstHuntCoach(input({ screen: 'battle', hasBorderRecord: true, replaying: true })),
    ).toMatchObject({ step: 'brace', paused: true });
  });

  it('continues from the broken guards into a five-card boss execution route', () => {
    expect(
      createFirstHuntCoach(input({ bossExecutionOpen: true, selectedTargetId: 'wolf_scout' })),
    ).toMatchObject({ step: 'target', paused: true });
    expect(
      createFirstHuntCoach(input({ bossExecutionOpen: true, selectedTargetId: 'wolf_alpha' })),
    ).toMatchObject({
      step: 'execution',
      expectedCardId: 'brann_brace',
      paused: true,
    });
    expect(
      createFirstHuntCoach(
        input({
          bossExecutionOpen: true,
          selectedTargetId: 'wolf_alpha',
          draftCardIds: ['brann_brace'],
        }),
      )?.message,
    ).toContain('盾後反擊');
    expect(
      createFirstHuntCoach(
        input({
          bossExecutionOpen: true,
          selectedTargetId: 'wolf_alpha',
          draftCardIds: [
            'brann_brace',
            'brann_riposte',
            'brann_shield_crash',
            'brann_sweep',
            'brann_fortress_breaker',
          ],
        }),
      ),
    ).toMatchObject({ step: 'preview', paused: true });
  });

  it('stays inactive for skipped guidance, other hunts, and completed guidance', () => {
    expect(createFirstHuntCoach(input({ tutorial: 'skipped' }))).toBeUndefined();
    expect(createFirstHuntCoach(input({ tutorial: 'complete' }))).toBeUndefined();
    expect(createFirstHuntCoach(input({ questId: 'abandoned_mine' }))).toBeUndefined();
  });
});
