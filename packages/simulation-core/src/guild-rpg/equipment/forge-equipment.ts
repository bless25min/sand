import type {
  EquipmentItem,
  GuildGameContent,
  GuildProfile,
  RewardResolution,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';

export type ForgeAction = 'calibrate' | 'reforge' | 'lock' | 'transplant' | 'salvage';
type ForgeLockField = 'main' | 'affix' | 'core';
export interface ForgeOptions {
  lockField?: ForgeLockField;
  sourceItemId?: string;
}

export const FORGE_COSTS: Readonly<Record<ForgeAction, number>> = {
  calibrate: 30,
  reforge: 25,
  lock: 15,
  transplant: 45,
  salvage: 0,
};

const findItem = (profile: GuildProfile, itemId: string) =>
  profile.inventory.find(({ id }) => id === itemId) ??
  profile.party
    .flatMap(({ equipment }) => Object.values(equipment))
    .find((item) => item?.id === itemId);

const replaceItem = (profile: GuildProfile, next: EquipmentItem): GuildProfile => ({
  ...profile,
  inventory: profile.inventory.map((item) => (item.id === next.id ? next : item)),
  party: profile.party.map((member) => ({
    ...member,
    equipment: Object.fromEntries(
      Object.entries(member.equipment).map(([slot, item]) => [
        slot,
        item?.id === next.id ? next : item,
      ]),
    ),
  })),
});

const removeItem = (profile: GuildProfile, itemId: string): GuildProfile => ({
  ...profile,
  inventory: profile.inventory.filter(({ id }) => id !== itemId),
  party: profile.party.map((member) => ({
    ...member,
    equipment: Object.fromEntries(
      Object.entries(member.equipment).filter(([, item]) => item?.id !== itemId),
    ),
  })),
});

const materialFor = (item: EquipmentItem, content: GuildGameContent) =>
  item.forgeMaterialId ??
  content.equipmentBases.find(({ id }) => id === item.baseId)?.forgeMaterialId;

const materialName = (materialId: string | undefined, content: GuildGameContent) =>
  content.hunts.flatMap(({ enemies }) => enemies).find(({ material }) => material.id === materialId)
    ?.material.name;

const reforgeAffix = (item: EquipmentItem, content: GuildGameContent, random: RandomSource) => {
  const current = new Set(item.affixes.map(({ sourceId }) => sourceId).filter(Boolean));
  const pool = content.equipmentAffixes.filter(({ id }) => !current.has(id));
  const definition = (pool.length ? pool : content.equipmentAffixes)[
    random.nextInt(0, (pool.length ? pool : content.equipmentAffixes).length - 1)
  ]!;
  const value = definition.stat === 'hp' ? random.nextInt(8, 16) : random.nextInt(2, 6);
  return {
    ...item,
    affixes: [
      {
        stat: definition.stat,
        value,
        sourceId: definition.id,
        label: definition.name,
      },
      ...item.affixes.slice(1),
    ],
  };
};

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
  options: ForgeOptions = {},
): ForgePreview | undefined {
  const item = findItem(profile, itemId);
  if (!item) return undefined;
  const materialId = materialFor(item, content);
  const base = content.equipmentBases.find(({ id }) => id === item.baseId);
  const source = options.sourceItemId ? findItem(profile, options.sourceItemId) : undefined;
  const core = content.equipmentCores.find(({ id }) => id === source?.coreId);
  const labels: Readonly<Record<ForgeAction, string>> = {
    calibrate: `主屬性重新校準至 ${base?.mainStatRoll.min ?? '?'}–${base?.mainStatRoll.max ?? '?'}`,
    reforge: `重鑄第一詞綴 · ${content.equipmentAffixes.length} 種候選`,
    lock: `鎖定${options.lockField ?? 'core'}欄位`,
    transplant: core ? `移植「${core.name}」` : '請選擇帶有核心的來源裝備',
    salvage: `拆解並回收 1 份${materialName(materialId, content) ?? '素材'}`,
  };
  const resolvedMaterialName = materialName(materialId, content);
  return {
    cost: FORGE_COSTS[action],
    ...(materialId ? { materialId } : {}),
    ...(resolvedMaterialName ? { materialName: resolvedMaterialName } : {}),
    resultLabel: labels[action],
  };
}

export function forgeEquipmentItem(
  profile: GuildProfile,
  itemId: string,
  action: ForgeAction,
  content: GuildGameContent,
  random: RandomSource,
  options: ForgeOptions = {},
): RewardResolution {
  const item = findItem(profile, itemId);
  if (!item) return { profile, message: '找不到這件可鍛造裝備。' };
  const materialId = materialFor(item, content);
  if (!materialId) return { profile, message: '這件裝備沒有對應素材。' };

  if (action === 'salvage') {
    if (item.locked || item.favorite) {
      return { profile, message: `${item.name}已鎖定或收藏，未進行分解。` };
    }
    const removed = removeItem(profile, itemId);
    return {
      profile: {
        ...removed,
        materials: { ...removed.materials, [materialId]: (removed.materials[materialId] ?? 0) + 1 },
      },
      message: `${item.name}已拆解，沒有自動處理其他裝備。`,
    };
  }
  const cost = FORGE_COSTS[action];
  if ((profile.materials[materialId] ?? 0) < 1 || profile.gold < cost) {
    return {
      profile,
      message: `需要 1 份${materialName(materialId, content) ?? '素材'}與 ${cost} 金幣。`,
    };
  }

  let nextProfile = profile;
  let nextItem = item;
  let label: string;
  if (action === 'calibrate') {
    const base = content.equipmentBases.find(({ id }) => id === item.baseId);
    if (!base) return { profile, message: '找不到裝備的校準範圍。' };
    nextItem = {
      ...item,
      mainStat: {
        ...item.mainStat,
        value: random.nextInt(base.mainStatRoll.min, base.mainStatRoll.max),
      },
    };
    label = '主屬性校準';
  } else if (action === 'reforge') {
    nextItem = reforgeAffix(item, content, random);
    label = '詞綴重鑄';
  } else if (action === 'lock') {
    const field = options.lockField ?? 'core';
    nextProfile = {
      ...profile,
      forgeLocks: {
        ...profile.forgeLocks,
        [item.id]: [...new Set([...(profile.forgeLocks[item.id] ?? []), field])],
      },
    };
    label = `鎖定${field}`;
  } else {
    const source = options.sourceItemId ? findItem(profile, options.sourceItemId) : undefined;
    if (!source?.coreId) return { profile, message: '來源裝備沒有可移植核心。' };
    nextItem = { ...item, coreId: source.coreId, coreStrength: source.coreStrength };
    nextProfile = removeItem(profile, source.id);
    label = `移植${content.equipmentCores.find(({ id }) => id === source.coreId)?.name ?? source.coreId}`;
  }
  nextProfile = replaceItem(nextProfile, nextItem);
  const sequence = profile.forgeSequence + 1;
  const coreIds = nextItem.coreId
    ? [...new Set([...profile.discoveredCoreIds, nextItem.coreId])]
    : profile.discoveredCoreIds;
  return {
    profile: {
      ...nextProfile,
      gold: nextProfile.gold - cost,
      materials: {
        ...nextProfile.materials,
        [materialId]: (nextProfile.materials[materialId] ?? 0) - 1,
      },
      discoveredCoreIds: coreIds,
      forgeSequence: sequence,
      progressionEvents: [
        ...nextProfile.progressionEvents,
        {
          id: `forge-${sequence}`,
          kind: 'forge' as const,
          label: `${nextItem.name} · ${label}`,
          detail: `${cost} 金幣 + 1 素材`,
        },
      ].slice(-20),
    },
    message: `${nextItem.name}完成${label}。`,
  };
}
