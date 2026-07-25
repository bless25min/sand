import type {
  AdventurerDefinition,
  GuildAdventurer,
  GuildStatKey,
  GuildStats,
} from '@expedition/shared-types';

const LEVEL_GROWTH: GuildStats = {
  hp: 18,
  attack: 3,
  defense: 2,
  speed: 0.4,
  healing: 3,
};

export function calculateAdventurerStats(
  adventurer: GuildAdventurer,
  definition: AdventurerDefinition,
): GuildStats {
  const levelOffset = adventurer.level - 1;
  const stats = Object.fromEntries(
    (Object.keys(definition.baseStats) as GuildStatKey[]).map((stat) => [
      stat,
      definition.baseStats[stat] + LEVEL_GROWTH[stat] * levelOffset,
    ]),
  ) as unknown as GuildStats;

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
