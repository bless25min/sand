import type { AdventurerDefinition, GuildAdventurer, GuildStats } from '@expedition/shared-types';

export function calculateAdventurerStats(
  adventurer: GuildAdventurer,
  definition: AdventurerDefinition,
): GuildStats {
  const stats: GuildStats = { ...definition.baseStats };

  const items = [
    adventurer.equipment.weapon,
    adventurer.equipment.armor,
    adventurer.equipment.accessory,
  ];
  for (const item of items) {
    if (!item) continue;
    stats[item.mainStat.stat] += item.mainStat.value;
    for (const affix of item.affixes) stats[affix.stat] += affix.value;
  }

  return stats;
}
