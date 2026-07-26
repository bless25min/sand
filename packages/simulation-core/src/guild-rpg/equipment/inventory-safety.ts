import type {
  EquipmentItem,
  GuildGameContent,
  GuildProfile,
  RewardResolution,
} from '@expedition/shared-types';

export type EquipmentItemFlag = 'locked' | 'favorite';

const materialFor = (item: EquipmentItem, content: GuildGameContent) =>
  item.forgeMaterialId ??
  content.equipmentBases.find(({ id }) => id === item.baseId)?.forgeMaterialId;

export function toggleEquipmentItemFlag(
  profile: GuildProfile,
  itemId: string,
  flag: EquipmentItemFlag,
): RewardResolution {
  const item = profile.inventory.find(({ id }) => id === itemId);
  if (!item) return { profile, message: '只能標記背包中的裝備。' };
  const enabled = !item[flag];
  return {
    profile: {
      ...profile,
      inventory: profile.inventory.map((candidate) =>
        candidate.id === itemId ? { ...candidate, [flag]: enabled } : candidate,
      ),
    },
    message: `${item.name}已${enabled ? '加入' : '移除'}${flag === 'locked' ? '鎖定' : '收藏'}。`,
  };
}

export function salvageSelectedEquipment(
  profile: GuildProfile,
  itemIds: readonly string[],
  content: GuildGameContent,
): RewardResolution {
  const selected = new Set(itemIds);
  const candidates = profile.inventory.filter(({ id }) => selected.has(id));
  const safe = candidates.filter(({ locked, favorite }) => !locked && !favorite);
  const safeIds = new Set(safe.map(({ id }) => id));
  const materials = { ...profile.materials };
  for (const item of safe) {
    const materialId = materialFor(item, content);
    if (materialId) materials[materialId] = (materials[materialId] ?? 0) + 1;
  }
  const skipped = candidates.length - safe.length;
  return {
    profile: {
      ...profile,
      inventory: profile.inventory.filter(({ id }) => !safeIds.has(id)),
      materials,
    },
    message: `已分解 ${safe.length} 件裝備${skipped > 0 ? `；略過 ${skipped} 件鎖定或收藏品` : ''}。`,
  };
}
