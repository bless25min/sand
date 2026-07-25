import type { GuildAdventurer, GuildProfile, RewardResolution } from '@expedition/shared-types';

export function equipStoredItem(
  profile: GuildProfile,
  itemId: string,
  adventurerId: string,
): RewardResolution {
  const item = profile.inventory.find((candidate) => candidate.id === itemId);
  if (!item) return { profile, message: '背包中找不到這件裝備。' };

  let found = false;
  let replaced = item;
  const party = profile.party.map((member): GuildAdventurer => {
    if (member.definitionId !== adventurerId) return member;
    found = true;
    replaced = member.equipment[item.slot] ?? item;
    return { ...member, equipment: { ...member.equipment, [item.slot]: item } };
  });
  if (!found) return { profile, message: '找不到指定冒險者。' };

  return {
    profile: {
      ...profile,
      party,
      inventory: profile.inventory
        .filter((candidate) => candidate.id !== item.id)
        .concat(replaced.id === item.id ? [] : [replaced]),
    },
    message:
      replaced.id === item.id ? `${item.name}已裝備。` : `${item.name}已裝備，原裝備已放回背包。`,
  };
}
