import type {
  GuildItemRarity,
  HuntEquipmentDefinition,
  HuntEquipmentItem,
  HuntRewardInput,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';

const RARITY_SCALE: Readonly<Record<GuildItemRarity, number>> = {
  common: 1,
  uncommon: 1.25,
  rare: 1.6,
  epic: 2.1,
  legendary: 2.8,
};

function affixCount(rarity: GuildItemRarity) {
  if (rarity === 'common') return 0;
  if (rarity === 'uncommon' || rarity === 'rare') return 1;
  return 2;
}

function rarityFor(roll: number, qualityScore: number): GuildItemRarity {
  const adjusted = Math.min(0.999, roll + Math.min(0.28, qualityScore / 2_000));
  if (adjusted < 0.58) return 'common';
  if (adjusted < 0.8) return 'uncommon';
  if (adjusted < 0.93) return 'rare';
  if (adjusted < 0.985) return 'epic';
  return 'legendary';
}

export function createHuntEquipmentItem(
  input: HuntRewardInput,
  definition: HuntEquipmentDefinition,
  sourceEnemyId: string,
  itemId: string,
  qualityScore: number,
  jackpot: boolean,
  random: RandomSource,
): HuntEquipmentItem {
  const rarity = rarityFor(random.next(), qualityScore);
  const mainValue = Math.max(
    1,
    Math.round(definition.baseValue * RARITY_SCALE[rarity] + qualityScore / 40),
  );
  const affixStart =
    input.equipmentAffixes.length > 0 ? random.nextInt(0, input.equipmentAffixes.length - 1) : 0;
  const affixes = Array.from(
    { length: input.equipmentAffixes.length > 0 ? affixCount(rarity) : 0 },
    (_, index) => {
      const affix = input.equipmentAffixes[(affixStart + index) % input.equipmentAffixes.length]!;
      const statScale = affix.stat === 'hp' ? 4 : affix.stat === 'speed' ? 0.5 : 1;
      return {
        stat: affix.stat,
        value: Math.max(
          1,
          Math.round(
            (2 + definition.baseValue * 0.35 + qualityScore / 60) *
              RARITY_SCALE[rarity] *
              statScale,
          ),
        ),
        sourceId: affix.id,
        label: affix.name,
      };
    },
  );
  return {
    id: itemId,
    baseId: definition.id,
    name: definition.name,
    slot: definition.slot,
    rarity,
    mainStat: {
      stat: definition.mainStat,
      value: mainValue,
      sourceId: definition.id,
      label: definition.name,
    },
    affixes,
    sellValue: Math.round(mainValue * (jackpot ? 3 : 1.8)),
    ...(definition.ruleIds ? { ruleIds: definition.ruleIds } : {}),
    sourceEnemyId,
    qualityScore,
    jackpot,
    recommendedBuildIds: definition.recommendedBuildIds,
  };
}
