import type {
  GuildItemRarity,
  HuntEquipmentDefinition,
  HuntEquipmentItem,
  HuntRewardInput,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';
import { QUALITY_RANK_BY_RARITY } from '../progression/quality-rank';

function affixCount(rarity: GuildItemRarity) {
  if (rarity === 'common') return 0;
  if (rarity === 'uncommon' || rarity === 'rare') return 1;
  return 2;
}

function rarityFor(roll: number, qualityScore: number, jackpot: boolean): GuildItemRarity {
  const randomScore = Math.floor(Math.max(0, Math.min(0.999, roll)) * 100);
  const performanceScore = Math.max(0, Math.trunc(qualityScore));
  const quality = randomScore + performanceScore + (jackpot ? 80 : 0);
  if (quality < 90) return 'common';
  if (quality < 180) return 'uncommon';
  if (quality < 300) return 'rare';
  if (quality < 450) return 'epic';
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
  const rarity = rarityFor(random.next(), qualityScore, jackpot);
  const qualityRank = QUALITY_RANK_BY_RARITY[rarity];
  const exactCandidates =
    input.content?.equipmentBases.filter(
      (base) => base.slot === definition.slot && base.mainStat === definition.mainStat,
    ) ?? [];
  const slotCandidates =
    input.content?.equipmentBases.filter((base) => base.slot === definition.slot) ?? [];
  const baseCandidates =
    exactCandidates.length > 0
      ? exactCandidates
      : slotCandidates.length > 0
        ? slotCandidates
        : (input.content?.equipmentBases ?? []);
  const base =
    input.content?.equipmentBases.find(({ id }) => id === definition.id) ??
    (baseCandidates.length > 0
      ? baseCandidates[random.nextInt(0, baseCandidates.length - 1)]
      : undefined);
  const mainValue = qualityRank;
  const coreId =
    base && (input.hunt.coreDropIds?.length ?? base.coreIds.length) > 0
      ? (input.hunt.coreDropIds ?? base.coreIds)[
          random.nextInt(0, (input.hunt.coreDropIds ?? base.coreIds).length - 1)
        ]
      : undefined;
  const coreStrength = base ? random.nextInt(1, qualityRank) : undefined;
  const corePool = Array.from(new Set(input.hunt.coreDropIds ?? base?.coreIds ?? []));
  const remainingCoreIds = corePool.filter((candidate) => candidate !== coreId);
  const secondCoreId =
    rarity === 'legendary' && remainingCoreIds.length > 0
      ? remainingCoreIds[random.nextInt(0, remainingCoreIds.length - 1)]
      : undefined;
  const secondCoreStrength = secondCoreId && base ? random.nextInt(1, qualityRank) : undefined;
  const cores = [
    ...(coreId && coreStrength !== undefined ? [{ id: coreId, strength: coreStrength }] : []),
    ...(secondCoreId && secondCoreStrength !== undefined
      ? [{ id: secondCoreId, strength: secondCoreStrength }]
      : []),
  ];
  const affixStart =
    input.equipmentAffixes.length > 0 ? random.nextInt(0, input.equipmentAffixes.length - 1) : 0;
  const affixes = Array.from(
    { length: input.equipmentAffixes.length > 0 ? affixCount(rarity) : 0 },
    (_, index) => {
      const affix = input.equipmentAffixes[(affixStart + index) % input.equipmentAffixes.length]!;
      return {
        stat: affix.stat,
        value: random.nextInt(1, qualityRank),
        sourceId: affix.id,
        label: affix.name,
      };
    },
  );
  return {
    id: itemId,
    baseId: base?.id ?? definition.id,
    name: definition.name,
    slot: definition.slot,
    rarity,
    qualityRank,
    mainStat: {
      stat: definition.mainStat,
      value: mainValue,
      sourceId: definition.id,
      label: definition.name,
    },
    affixes,
    sellValue: Math.round(mainValue * (jackpot ? 3 : 1.8)),
    ...(base?.forgeMaterialId ? { forgeMaterialId: base.forgeMaterialId } : {}),
    ...(coreId ? { coreId } : {}),
    ...(coreStrength !== undefined ? { coreStrength } : {}),
    ...(cores.length > 0 ? { cores } : {}),
    ...(definition.ruleIds ? { ruleIds: definition.ruleIds } : {}),
    sourceEnemyId,
    qualityScore,
    jackpot,
    recommendedBuildIds: definition.recommendedBuildIds,
  };
}
