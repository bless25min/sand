import type {
  EquipmentItem,
  GuildAdventurer,
  GuildProfile,
  ItemChoice,
  RuleCatalog,
  RewardResolution,
} from '@expedition/shared-types';

const INVENTORY_CAPACITY = 20;

function ruleActivation(item: EquipmentItem, rules: RuleCatalog) {
  const names = item.ruleIds?.map((ruleId) => rules[ruleId]?.name ?? ruleId) ?? [];
  return names.length > 0 ? ` 規則上線：${names.join('、')}。` : '';
}

function equipItem(
  profile: GuildProfile,
  item: EquipmentItem,
  adventurerId: string,
  rules: RuleCatalog,
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
      message: `${item.name}已裝備。${ruleActivation(item, rules)}`,
    };
  }
  if (profile.inventory.length < INVENTORY_CAPACITY) {
    return {
      profile: { ...profile, party, inventory: [...profile.inventory, replaced] },
      message: `${item.name}已裝備，舊裝備已放入背包。${ruleActivation(item, rules)}`,
    };
  }

  return {
    profile: { ...profile, party, gold: profile.gold + replaced.sellValue },
    message: `${item.name}已裝備；背包已滿，舊裝備自動售出。${ruleActivation(item, rules)}`,
  };
}

export function resolveItemChoice(
  profile: GuildProfile,
  item: EquipmentItem,
  choice: ItemChoice,
  adventurerId: string,
  rules: RuleCatalog = {},
): RewardResolution {
  if (choice === 'equip') return equipItem(profile, item, adventurerId, rules);
  if (choice === 'sell') {
    return {
      profile: { ...profile, gold: profile.gold + item.sellValue },
      message: `${item.name}售出，獲得 ${item.sellValue} 金幣。`,
    };
  }
  if (profile.inventory.length >= INVENTORY_CAPACITY) {
    return { profile, message: '背包已滿（20/20），請改為裝備或出售。' };
  }
  return {
    profile: { ...profile, inventory: [...profile.inventory, item] },
    message: `${item.name}已放入背包。`,
  };
}
