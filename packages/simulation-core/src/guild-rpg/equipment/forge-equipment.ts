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

const statName = (stat: EquipmentItem['mainStat']['stat']) =>
  ({ hp: '生命', attack: '攻擊', defense: '防禦', speed: '速度', healing: '治療' })[stat];

const coreRolls = (item: EquipmentItem) =>
  item.cores?.length
    ? item.cores
    : item.coreId
      ? [{ id: item.coreId, strength: item.coreStrength ?? 0 }]
      : [];

const primaryCore = (item?: EquipmentItem) => (item ? coreRolls(item)[0] : undefined);

const coreName = (id: string | undefined, content: GuildGameContent) =>
  content.equipmentCores.find((entry) => entry.id === id)?.name.replace(/核心$/, '') ??
  id ??
  '無核心';

const fieldName = (field: ForgeLockField) =>
  ({ main: '主屬性', affix: '詞綴', core: '核心' })[field];

const isFieldLocked = (profile: GuildProfile, itemId: string, field: ForgeLockField) =>
  profile.forgeLocks[itemId]?.includes(field) ?? false;

const toggleForgeLock = (
  profile: GuildProfile,
  itemId: string,
  field: ForgeLockField,
): GuildProfile => {
  const current = profile.forgeLocks[itemId] ?? [];
  const next = current.includes(field)
    ? current.filter((entry) => entry !== field)
    : [...current, field];
  const forgeLocks = { ...profile.forgeLocks };
  if (next.length > 0) forgeLocks[itemId] = next;
  else delete forgeLocks[itemId];
  return { ...profile, forgeLocks };
};

const withPrimaryCore = (
  item: EquipmentItem,
  roll: { id: string; strength: number },
): EquipmentItem => ({
  ...item,
  coreId: roll.id,
  coreStrength: roll.strength,
  ...(item.cores?.length ? { cores: [roll, ...item.cores.slice(1)] } : {}),
});

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
  const sourceCore = primaryCore(source);
  const core = content.equipmentCores.find(({ id }) => id === sourceCore?.id);
  const lockField = options.lockField ?? 'core';
  const unlocking = action === 'lock' && isFieldLocked(profile, item.id, lockField);
  const labels: Readonly<Record<ForgeAction, string>> = {
    calibrate: `${statName(item.mainStat.stat)} ${item.mainStat.value} → ${base?.mainStatRoll.min ?? '?'}–${base?.mainStatRoll.max ?? '?'}`,
    reforge: `重鑄第一詞綴 · ${content.equipmentAffixes.length} 種結果`,
    lock: unlocking ? `解除${fieldName(lockField)}保護` : `保護${fieldName(lockField)}`,
    transplant: core ? `移植「${core.name}」` : '請選擇帶有核心的來源裝備',
    salvage: `拆解並回收 1 份${materialName(materialId, content) ?? '素材'}`,
  };
  const resolvedMaterialName = materialName(materialId, content);
  return {
    cost: unlocking ? 0 : FORGE_COSTS[action],
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
  const lockField = options.lockField ?? 'core';
  if (action === 'lock' && isFieldLocked(profile, item.id, lockField)) {
    const unlocked = toggleForgeLock(profile, item.id, lockField);
    const sequence = profile.forgeSequence + 1;
    return {
      profile: {
        ...unlocked,
        forgeSequence: sequence,
        progressionEvents: [
          ...unlocked.progressionEvents,
          {
            id: `forge-${sequence}`,
            kind: 'forge' as const,
            label: `${item.name} · 解除${fieldName(lockField)}保護`,
            detail: '未消耗素材或金幣',
          },
        ].slice(-20),
      },
      message: `${item.name}已解除${fieldName(lockField)}保護；未消耗素材或金幣。`,
    };
  }

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
  const affectedField =
    action === 'calibrate'
      ? ('main' as const)
      : action === 'reforge'
        ? ('affix' as const)
        : action === 'transplant'
          ? ('core' as const)
          : undefined;
  if (affectedField && isFieldLocked(profile, item.id, affectedField)) {
    return {
      profile,
      message: `${item.name}的${fieldName(affectedField)}已鎖定；先解除保護才能變更。`,
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
  let resultDetail: string;
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
    resultDetail = `${statName(item.mainStat.stat)} ${item.mainStat.value} → ${nextItem.mainStat.value}`;
  } else if (action === 'reforge') {
    nextItem = reforgeAffix(item, content, random);
    label = '詞綴重鑄';
    const before = item.affixes[0];
    const after = nextItem.affixes[0];
    resultDetail = `${before?.label ?? '無詞綴'} ${before?.value ?? 0} → ${after?.label ?? '無詞綴'} ${after?.value ?? 0}`;
  } else if (action === 'lock') {
    nextProfile = toggleForgeLock(profile, item.id, lockField);
    label = `${fieldName(lockField)}保護`;
    resultDetail = `${fieldName(lockField)}已保護`;
  } else {
    const source = options.sourceItemId ? findItem(profile, options.sourceItemId) : undefined;
    const sourceCore = primaryCore(source);
    if (!source || !sourceCore) return { profile, message: '來源裝備沒有可移植核心。' };
    const beforeCore = primaryCore(item);
    nextItem = withPrimaryCore(item, sourceCore);
    nextProfile = removeItem(profile, source.id);
    label = `移植${coreName(sourceCore.id, content)}`;
    resultDetail = `${coreName(beforeCore?.id, content)} → ${coreName(sourceCore.id, content)}`;
  }
  nextProfile = replaceItem(nextProfile, nextItem);
  const sequence = profile.forgeSequence + 1;
  const coreIds = Array.from(
    new Set([...profile.discoveredCoreIds, ...coreRolls(nextItem).map(({ id }) => id)]),
  );
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
          detail: `${resultDetail} · ${cost} 金幣 + 1 素材`,
        },
      ].slice(-20),
    },
    message: `${nextItem.name}：${resultDetail}。`,
  };
}
