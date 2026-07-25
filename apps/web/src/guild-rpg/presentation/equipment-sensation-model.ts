import type {
  EquipmentItem,
  GuildGameContent,
  GuildProfile,
  GuildStatKey,
  HuntEquipmentItem,
} from '@expedition/shared-types';
import { equipmentPower, equipmentStatTotals } from '@expedition/simulation-core';

const STAT_KEYS: readonly GuildStatKey[] = ['hp', 'attack', 'defense', 'speed', 'healing'];
const ROLE_STATS = {
  vanguard: new Set<GuildStatKey>(['hp', 'defense']),
  ranger: new Set<GuildStatKey>(['attack', 'speed']),
  cleric: new Set<GuildStatKey>(['healing', 'hp']),
} as const;

function isHuntEquipment(item: EquipmentItem): item is HuntEquipmentItem {
  return 'qualityScore' in item && 'sourceEnemyId' in item;
}

export function createEquipmentSensationModel(
  item: EquipmentItem,
  profile: GuildProfile,
  content: GuildGameContent,
) {
  const itemTotals = equipmentStatTotals(item);
  const comparisons = profile.party.map((member) => {
    const hero = content.adventurers.find((definition) => definition.id === member.definitionId)!;
    const equipped = member.equipment[item.slot];
    const equippedTotals = equipmentStatTotals(equipped);
    const roleFit = ROLE_STATS[hero.role].has(item.mainStat.stat);
    return {
      adventurerId: hero.id,
      adventurerName: hero.name,
      powerDifference: equipmentPower(item) - equipmentPower(equipped),
      roleFit,
      statDiff: Object.fromEntries(
        STAT_KEYS.map((stat) => [stat, (itemTotals[stat] ?? 0) - (equippedTotals[stat] ?? 0)]),
      ) as Readonly<Record<GuildStatKey, number>>,
    };
  });
  const best = [...comparisons].sort(
    (left, right) =>
      Number(right.roleFit) - Number(left.roleFit) || right.powerDifference - left.powerDifference,
  )[0]!;
  const huntItem = isHuntEquipment(item) ? item : undefined;
  const sourceEnemyName = huntItem
    ? content.quests
        .flatMap((quest) => quest.enemies)
        .find((enemy) => enemy.id === huntItem.sourceEnemyId)?.name
    : undefined;
  const recommendedBuildIds =
    huntItem && Array.isArray(huntItem.recommendedBuildIds) ? huntItem.recommendedBuildIds : [];

  return {
    sourceEnemyName,
    recommendedBuildNames:
      recommendedBuildIds.flatMap((buildId) => {
        const build = content.builds.find((candidate) => candidate.id === buildId);
        return build ? [build.name] : [];
      }) ?? [],
    rules:
      item.ruleIds?.flatMap((ruleId) => {
        const rule = content.rules[ruleId];
        return rule ? [{ id: rule.id, name: rule.name, description: rule.description }] : [];
      }) ?? [],
    comparisons,
    bestAdventurer: {
      id: best.adventurerId,
      name: best.adventurerName,
      reason: best.roleFit ? `${item.mainStat.stat} 與職責直接連動` : '本欄位提升最高',
    },
  };
}
