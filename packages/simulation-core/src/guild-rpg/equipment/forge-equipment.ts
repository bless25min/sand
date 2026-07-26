import type {
  EquipmentItem,
  GuildGameContent,
  GuildProfile,
  RewardResolution,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';

export type ForgeAction = 'upgrade' | 'infuse' | 'reroll';

export const FORGE_COSTS: Readonly<Record<ForgeAction, number>> = {
  upgrade: 30,
  infuse: 45,
  reroll: 25,
};

function findOwnedItem(profile: GuildProfile, itemId: string): EquipmentItem | undefined {
  return (
    profile.inventory.find((item) => item.id === itemId) ??
    profile.party
      .flatMap((member) => Object.values(member.equipment))
      .find((item) => item?.id === itemId)
  );
}

function replaceOwnedItem(profile: GuildProfile, nextItem: EquipmentItem): GuildProfile {
  return {
    ...profile,
    inventory: profile.inventory.map((item) => (item.id === nextItem.id ? nextItem : item)),
    party: profile.party.map((member) => ({
      ...member,
      equipment: Object.fromEntries(
        Object.entries(member.equipment).map(([slot, item]) => [
          slot,
          item?.id === nextItem.id ? nextItem : item,
        ]),
      ),
    })),
  };
}

function materialForItem(item: EquipmentItem, content: GuildGameContent) {
  const enemies = content.hunts.flatMap((hunt) => hunt.enemies);
  if (item.forgeMaterialId) {
    return enemies.find((enemy) => enemy.material.id === item.forgeMaterialId)?.material;
  }
  for (const hunt of content.hunts) {
    for (const enemy of hunt.enemies) {
      const authoredByEnemy =
        enemy.enemyId === item.sourceEnemyId ||
        enemy.equipment.some((definition) => definition.id === item.baseId);
      if (authoredByEnemy) return enemy.material;
    }
  }
  return undefined;
}

function upgradedItem(item: EquipmentItem): EquipmentItem {
  const surge = Math.max(2, Math.ceil(Math.abs(item.mainStat.value) * 0.5));
  return {
    ...item,
    forgeRank: (item.forgeRank ?? 0) + 1,
    mainStat: { ...item.mainStat, value: item.mainStat.value + surge },
    sellValue: item.sellValue + surge * 2,
  };
}

function infusedItem(item: EquipmentItem, content: GuildGameContent) {
  const current = new Set(item.ruleIds ?? []);
  const ruleId = Object.keys(content.rules).find((candidate) => !current.has(candidate));
  if (!ruleId) return undefined;
  return { item: { ...item, ruleIds: [...current, ruleId] }, ruleId };
}

function rerolledItem(item: EquipmentItem, content: GuildGameContent, random: RandomSource) {
  const currentIds = new Set(item.affixes.map((affix) => affix.sourceId).filter(Boolean));
  const candidates = content.equipmentAffixes.filter((affix) => !currentIds.has(affix.id));
  const pool = candidates.length > 0 ? candidates : content.equipmentAffixes;
  const definition = pool[random.nextInt(0, pool.length - 1)];
  if (!definition) return undefined;
  const rank = item.forgeRank ?? 0;
  const statScale = definition.stat === 'hp' ? 4 : definition.stat === 'speed' ? 0.5 : 1;
  const affix = {
    stat: definition.stat,
    value: Math.max(1, Math.round((6 + rank * 2) * statScale)),
    sourceId: definition.id,
    label: definition.name,
  };
  return {
    ...item,
    affixes: item.affixes.length > 0 ? [affix, ...item.affixes.slice(1)] : [affix],
  };
}

export interface ForgePreview {
  cost: number;
  materialId?: string;
  materialName?: string;
  resultLabel: string;
}

export function previewForgeEquipmentItem(
  profile: GuildProfile,
  itemId: string,
  action: ForgeAction,
  content: GuildGameContent,
): ForgePreview | undefined {
  const item = findOwnedItem(profile, itemId);
  if (!item) return undefined;
  const material = materialForItem(item, content);
  let resultLabel: string;
  if (action === 'upgrade') {
    const next = upgradedItem(item);
    resultLabel = `主屬性 ${item.mainStat.value} → ${next.mainStat.value} · 強化 +${next.forgeRank}`;
  } else if (action === 'infuse') {
    const ruleId = infusedItem(item, content)?.ruleId;
    resultLabel = ruleId ? `獲得規則「${content.rules[ruleId]!.name}」` : '已承載全部規則';
  } else {
    const currentIds = new Set(item.affixes.map((affix) => affix.sourceId).filter(Boolean));
    const candidateCount = content.equipmentAffixes.filter(
      (affix) => !currentIds.has(affix.id),
    ).length;
    resultLabel = `重鑄第一詞綴 · ${
      candidateCount > 0 ? candidateCount : content.equipmentAffixes.length
    } 種候選`;
  }
  return {
    cost: FORGE_COSTS[action],
    ...(material ? { materialId: material.id, materialName: material.name } : {}),
    resultLabel,
  };
}

export function forgeEquipmentItem(
  profile: GuildProfile,
  itemId: string,
  action: ForgeAction,
  content: GuildGameContent,
  random: RandomSource,
): RewardResolution {
  const item = findOwnedItem(profile, itemId);
  if (!item) return { profile, message: '找不到這件可鍛造裝備。' };
  const material = materialForItem(item, content);
  const cost = FORGE_COSTS[action];
  if (!material) {
    return { profile, message: '這件裝備沒有對應素材，請先取得新版掉落或完成存檔轉換。' };
  }
  if ((profile.materials[material.id] ?? 0) < 1) {
    return { profile, message: '需要一份對應敵人材料才能點燃鍛爐。' };
  }
  if (profile.gold < cost) {
    return { profile, message: `需要 ${cost} 金幣才能完成這次鍛造。` };
  }

  let nextItem: EquipmentItem | undefined;
  let resultLabel: string;
  let discoveredRuleId: string | undefined;
  if (action === 'upgrade') {
    nextItem = upgradedItem(item);
    resultLabel = `強化 +${nextItem.forgeRank}`;
  } else if (action === 'infuse') {
    const result = infusedItem(item, content);
    nextItem = result?.item;
    discoveredRuleId = result?.ruleId;
    resultLabel = discoveredRuleId ? `規則灌注：${content.rules[discoveredRuleId]!.name}` : '';
  } else {
    nextItem = rerolledItem(item, content, random);
    resultLabel = nextItem?.affixes[0]?.label ? `詞綴重鑄：${nextItem.affixes[0].label}` : '';
  }
  if (!nextItem || !resultLabel) {
    return { profile, message: '這件裝備已承載所有可用規則，鍛造能量完整保留。' };
  }

  const sequence = profile.forgeSequence + 1;
  const replaced = replaceOwnedItem(profile, nextItem);
  const nextMaterials = {
    ...replaced.materials,
    [material.id]: (replaced.materials[material.id] ?? 0) - 1,
  };
  const discoveredRuleIds = discoveredRuleId
    ? [...new Set([...replaced.discoveredRuleIds, discoveredRuleId])]
    : replaced.discoveredRuleIds;
  return {
    profile: {
      ...replaced,
      gold: replaced.gold - cost,
      materials: nextMaterials,
      forgeSequence: sequence,
      discoveredEquipmentIds: [...new Set([...replaced.discoveredEquipmentIds, nextItem.baseId])],
      discoveredRuleIds,
      progressionEvents: [
        ...replaced.progressionEvents,
        {
          id: `forge-${sequence}`,
          kind: 'forge' as const,
          label: `${nextItem.name} · ${resultLabel}`,
          detail: `${cost} 金幣 + 1 ${material.name}`,
        },
      ].slice(-20),
    },
    message: `${nextItem.name}鍛造完成——${resultLabel}！`,
  };
}
