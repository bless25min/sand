import type { GuildGameContent, GuildProfile, RewardResolution } from '@expedition/shared-types';

import { validateBuildLoadout } from './validate-build-loadout';

export function swapBuildLoadoutCard(
  profile: GuildProfile,
  buildId: string,
  removedCardId: string,
  addedCardId: string,
  content: GuildGameContent,
): RewardResolution {
  const build = content.builds.find((candidate) => candidate.id === buildId);
  if (!build) return { profile, message: '找不到這個 Build。' };
  const current = profile.loadouts[build.id] ?? build.defaultCardIds;
  if (
    current.length !== 8 ||
    !current.includes(removedCardId) ||
    current.includes(addedCardId) ||
    !build.cardIds.includes(addedCardId)
  ) {
    return { profile, message: '牌組替換無效；仍保留目前八張主動卡。' };
  }
  const next = current.map((cardId) => (cardId === removedCardId ? addedCardId : cardId));
  const validation = validateBuildLoadout(build, next, content.cards);
  if (!validation.valid) {
    return {
      profile,
      message:
        validation.reason === 'signature'
          ? '招牌路線必須保留在八卡牌組中。'
          : '這次替換會造成卡牌斷鏈，請保留需要的起手與觸發卡。',
    };
  }
  return {
    profile: {
      ...profile,
      loadouts: { ...profile.loadouts, [build.id]: next },
    },
    message: `${content.cards[addedCardId]!.name}已裝填；${content.cards[removedCardId]!.name}返回軍械庫。`,
  };
}
