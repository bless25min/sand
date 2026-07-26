import type { GuildGameContent, GuildProfile, RewardResolution } from '@expedition/shared-types';

export function swapBuildLoadoutCard(
  profile: GuildProfile,
  buildId: string,
  removedCardId: string,
  addedCardId: string,
  content: GuildGameContent,
): RewardResolution {
  return {
    profile,
    message: `v4 已移除 ${buildId} 八卡 Build；請在技能頁直接替換六個固定技能。${removedCardId}:${addedCardId}:${content.builds.length}`,
  };
}
