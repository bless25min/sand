import { describe, expect, it } from 'vitest';

import { createFirstHuntCoach } from './first-hunt-coach';

function input(overrides: Record<string, unknown> = {}) {
  return {
    tutorial: 'active' as const,
    screen: 'battle' as const,
    questId: 'border_pack',
    selectedBuildId: 'retaliation',
    selectedTargetId: 'wolf_scout',
    acknowledgedTargetId: 'wolf_scout',
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
  it('turns the fresh mobile guild into two focused, readable actions', () => {
    expect(
      createFirstHuntCoach(
        input({
          screen: 'guild',
          selectedTargetId: undefined,
          mobilePage: 'build',
        }),
      ),
    ).toMatchObject({
      step: 'quest',
      phaseLabel: '新手引導',
      stepNumber: 1,
      stepTotal: 2,
      title: '前往第一個任務',
      focusId: 'tab:quest',
    });
    expect(
      createFirstHuntCoach(
        input({
          screen: 'guild',
          selectedTargetId: undefined,
          mobilePage: 'quest',
        }),
      ),
    ).toMatchObject({
      step: 'start',
      phaseLabel: '新手引導',
      stepNumber: 2,
      stepTotal: 2,
      title: '出發邊境狼群',
      focusId: 'action:start-quest',
    });
  });

  it('guides the exact retaliation signature route and pauses only before player decisions', () => {
    expect(createFirstHuntCoach(input({ acknowledgedTargetId: undefined }))).toMatchObject({
      step: 'target',
      paused: true,
      focusId: 'action:wolf_scout',
    });
    expect(createFirstHuntCoach(input({ selectedTargetId: 'wolf_alpha' }))).toMatchObject({
      step: 'target',
      paused: true,
    });
    expect(createFirstHuntCoach(input())).toMatchObject({
      step: 'brace',
      paused: true,
      expectedCardId: 'brann_brace',
      phaseLabel: '軍令引導',
      stepNumber: 2,
      stepTotal: 6,
      title: '打出架盾',
      focusId: 'action:brann_brace',
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
      title: '撤銷錯誤卡',
      focusId: 'action:undo',
    });
  });

  it('lets playback advance and then routes loot, return, and replay', () => {
    expect(createFirstHuntCoach(input({ screen: 'playback' }))).toMatchObject({
      step: 'playback',
      paused: false,
    });
    expect(
      createFirstHuntCoach(input({ screen: 'rewards', rewardItemCount: 4, resolvedItemCount: 2 })),
    ).toMatchObject({
      step: 'loot',
      paused: false,
      phaseLabel: '戰利品引導',
      stepNumber: 3,
      stepTotal: 5,
      title: '處理第 3 件戰利品',
      focusId: 'action:equip',
    });
    expect(
      createFirstHuntCoach(input({ screen: 'rewards', rewardItemCount: 4, resolvedItemCount: 4 })),
    ).toMatchObject({
      step: 'return',
      stepNumber: 5,
      stepTotal: 5,
      title: '返回公會',
      focusId: 'action:return-guild',
    });
    expect(
      createFirstHuntCoach(input({ screen: 'guild', hasBorderRecord: true, replaying: true })),
    ).toMatchObject({ step: 'replay', paused: false });
    expect(
      createFirstHuntCoach(input({ screen: 'battle', hasBorderRecord: true, replaying: true })),
    ).toMatchObject({ step: 'brace', paused: true });
  });

  it('bridges a fresh first victory through ricochet, forge, and the next hunt', () => {
    expect(
      createFirstHuntCoach(
        input({
          screen: 'guild',
          hasBorderRecord: true,
          mobilePage: 'build',
          focusedBuildId: 'retaliation',
          forgeSequence: 0,
        }),
      ),
    ).toMatchObject({
      step: 'power-build',
      title: '找到殲滅彈射',
      focusId: 'action:next-build',
    });
    expect(
      createFirstHuntCoach(
        input({
          screen: 'guild',
          hasBorderRecord: true,
          mobilePage: 'build',
          focusedBuildId: 'ricochet',
          forgeSequence: 0,
        }),
      ),
    ).toMatchObject({
      step: 'power-build',
      title: '啟動殲滅彈射',
      focusId: 'action:activate-build',
    });
    expect(
      createFirstHuntCoach(
        input({
          screen: 'guild',
          hasBorderRecord: true,
          selectedBuildId: 'ricochet',
          mobilePage: 'inventory',
          focusedBuildId: 'ricochet',
          forgeSequence: 0,
        }),
      ),
    ).toMatchObject({
      step: 'forge',
      title: '點燃第一次鍛造',
      focusId: 'action:open-forge',
    });
    expect(
      createFirstHuntCoach(
        input({
          screen: 'guild',
          hasBorderRecord: true,
          selectedBuildId: 'ricochet',
          mobilePage: 'quest',
          focusedBuildId: 'ricochet',
          forgeSequence: 1,
        }),
      ),
    ).toMatchObject({
      step: 'next-hunt',
      title: '帶新引擎出發',
      focusId: 'action:start-quest',
    });
  });

  it('continues from the broken guards into a five-card boss execution route', () => {
    expect(
      createFirstHuntCoach(input({ bossExecutionOpen: true, selectedTargetId: 'wolf_scout' })),
    ).toMatchObject({ step: 'target', paused: true });
    expect(
      createFirstHuntCoach(
        input({
          bossExecutionOpen: true,
          selectedTargetId: 'wolf_alpha',
          acknowledgedTargetId: 'wolf_alpha',
        }),
      ),
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
          acknowledgedTargetId: 'wolf_alpha',
          draftCardIds: ['brann_brace'],
        }),
      )?.message,
    ).toContain('盾後反擊');
    expect(
      createFirstHuntCoach(
        input({
          bossExecutionOpen: true,
          selectedTargetId: 'wolf_alpha',
          acknowledgedTargetId: 'wolf_alpha',
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
