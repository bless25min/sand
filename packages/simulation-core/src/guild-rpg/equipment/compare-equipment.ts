import type { EquipmentItem, GuildStatKey } from '@expedition/shared-types';

export function equipmentStatTotals(item?: EquipmentItem): Partial<Record<GuildStatKey, number>> {
  if (!item) return {};
  const totals: Partial<Record<GuildStatKey, number>> = {
    [item.mainStat.stat]: item.mainStat.value,
  };
  for (const affix of item.affixes) totals[affix.stat] = (totals[affix.stat] ?? 0) + affix.value;
  return totals;
}

export function equipmentPower(item?: EquipmentItem) {
  if (!item) return 0;
  const weights: Readonly<Record<GuildStatKey, number>> = {
    hp: 0.2,
    attack: 1,
    defense: 1.15,
    speed: 3,
    healing: 1,
  };
  return Math.round(
    Object.entries(equipmentStatTotals(item)).reduce(
      (sum, [stat, value]) => sum + (value ?? 0) * weights[stat as GuildStatKey],
      0,
    ),
  );
}
