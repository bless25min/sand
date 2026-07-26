import type { GuildGameContent, GuildProfile, RewardResolution } from '@expedition/shared-types';

export function equipAdventurerSkill(
  profile: GuildProfile,
  adventurerId: string,
  slotIndex: number,
  skillId: string,
  content?: Pick<GuildGameContent, 'adventurers'>,
): RewardResolution {
  const member = profile.party.find(({ definitionId }) => definitionId === adventurerId);
  const skill = profile.skillInventory.find(({ id }) => id === skillId);
  if (!member || !skill || slotIndex < 0 || slotIndex >= 6) {
    return { profile, message: '技能裝備位置或技能不存在。' };
  }
  const skillIds = [...member.skillIds];
  skillIds[slotIndex] = skill.id;
  const definition = content?.adventurers.find(({ id }) => id === adventurerId);
  const fallbackName = adventurerId === 'brann' ? '布蘭' : adventurerId;
  return {
    profile: {
      ...profile,
      party: profile.party.map((candidate) =>
        candidate.definitionId === adventurerId ? { ...candidate, skillIds } : candidate,
      ),
    },
    message: `${definition?.name ?? fallbackName}已在第 ${slotIndex + 1} 格裝備「${skill.name}」。`,
  };
}
