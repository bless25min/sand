import type {
  EquipmentItem,
  GuildAdventurer,
  GuildProfile,
  ItemChoice,
  RewardResolution,
} from '@expedition/shared-types';

function coreActivation(item: EquipmentItem) {
  const cores = item.cores?.length
    ? item.cores
    : item.coreId
      ? [{ id: item.coreId, strength: item.coreStrength ?? 0 }]
      : [];
  return cores.length > 0
    ? ` 核心上線：${cores.map(({ id, strength }) => `${id} +${strength}`).join('、')}。`
    : '';
}

function equipItem(
  profile: GuildProfile,
  item: EquipmentItem,
  adventurerId: string,
): RewardResolution {
  let replaced: EquipmentItem | undefined;
  let found = false;
  const party = profile.party.map((member): GuildAdventurer => {
    if (member.definitionId !== adventurerId) return member;
    found = true;
    replaced = member.equipment[item.slot];
    return { ...member, equipment: { ...member.equipment, [item.slot]: item } };
  });
  if (!found) return { profile, message: '找不到指定冒險者。' };

  if (!replaced) {
    return {
      profile: { ...profile, party },
      message: `${item.name}已裝備。${coreActivation(item)}`,
    };
  }
  return {
    profile: { ...profile, party, inventory: [...profile.inventory, replaced] },
    message: `${item.name}已裝備，舊裝備已放入背包。${coreActivation(item)}`,
  };
}

export function resolveItemChoice(
  profile: GuildProfile,
  item: EquipmentItem,
  choice: ItemChoice,
  adventurerId: string,
): RewardResolution {
  if (choice === 'equip') return equipItem(profile, item, adventurerId);
  if (choice === 'sell') {
    return {
      profile: { ...profile, gold: profile.gold + item.sellValue },
      message: `${item.name}售出，獲得 ${item.sellValue} 金幣。`,
    };
  }
  return {
    profile: { ...profile, inventory: [...profile.inventory, item] },
    message: `${item.name}已放入背包。`,
  };
}
