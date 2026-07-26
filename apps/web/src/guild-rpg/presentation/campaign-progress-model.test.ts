import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { createCampaignProgressModel } from './campaign-progress-model';

describe('campaign progress model', () => {
  it('marks only the opening zone active for a fresh expedition', () => {
    const model = createCampaignProgressModel({
      content: GUILD_GAME_CONTENT,
      unlockedQuestIds: ['border_pack'],
      questRecords: {},
    });

    expect(model.clearedQuestCount).toBe(0);
    expect(model.totalQuestCount).toBe(12);
    expect(model.complete).toBe(false);
    expect(model.zones.map((zone) => zone.status)).toEqual([
      'active',
      'locked',
      'locked',
      'locked',
    ]);
    expect(model.zones[0]).toMatchObject({
      clearedQuestCount: 0,
      totalQuestCount: 3,
      currentQuestId: 'border_pack',
    });
    expect(model.currentQuestId).toBe('border_pack');
    expect(model.transitionLabel).toBeUndefined();
  });

  it('opens the next warfront and exposes the completed zone transition', () => {
    const firstZoneQuestIds = GUILD_GAME_CONTENT.zones[0]!.questIds;
    const model = createCampaignProgressModel({
      content: GUILD_GAME_CONTENT,
      unlockedQuestIds: [...firstZoneQuestIds, 'abandoned_mine'],
      questRecords: Object.fromEntries(
        firstZoneQuestIds.map((questId) => [questId, { clears: 1 }]),
      ),
    });

    expect(model.zones.map((zone) => zone.status)).toEqual([
      'cleared',
      'active',
      'locked',
      'locked',
    ]);
    expect(model.zones[1]?.currentQuestId).toBe('abandoned_mine');
    expect(model.currentQuestId).toBe('abandoned_mine');
    expect(model.transitionLabel).toBe(GUILD_GAME_CONTENT.zones[0]?.transitionLabel);
  });

  it('turns a fully cleared campaign into unrestricted replay', () => {
    const questRecords = Object.fromEntries(
      GUILD_GAME_CONTENT.quests.map((quest) => [quest.id, { clears: 1 }]),
    );
    const model = createCampaignProgressModel({
      content: GUILD_GAME_CONTENT,
      unlockedQuestIds: GUILD_GAME_CONTENT.quests.map((quest) => quest.id),
      questRecords,
    });

    expect(model.complete).toBe(true);
    expect(model.clearedQuestCount).toBe(12);
    expect(model.zones.every((zone) => zone.status === 'cleared')).toBe(true);
    expect(model.transitionLabel).toBe(GUILD_GAME_CONTENT.zones[3]?.transitionLabel);
    expect(model.headline).toBe('全戰役完破 · 12 場無限重刷');
    expect(model.currentQuestId).toBeUndefined();
  });
});
