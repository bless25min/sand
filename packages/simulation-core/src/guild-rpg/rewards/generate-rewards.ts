import type {
  EquipmentItem,
  GuildBattleState,
  GuildGameContent,
  GuildItemRarity,
  GuildProfile,
  QuestRewards,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';
import { generateSkillDrop } from '../progression/generate-skill-drop';

const RARITY_LABEL: Readonly<Record<GuildItemRarity, string>> = {
  common: '樸素',
  uncommon: '精良',
  rare: '稀有',
  epic: '史詩',
  legendary: '傳說',
};

function rarityForRoll(roll: number): GuildItemRarity {
  if (roll < 0.62) return 'common';
  if (roll < 0.84) return 'uncommon';
  if (roll < 0.95) return 'rare';
  if (roll < 0.995) return 'epic';
  return 'legendary';
}

function affixCount(rarity: GuildItemRarity) {
  if (rarity === 'common') return 0;
  if (rarity === 'uncommon' || rarity === 'rare') return 1;
  return 2;
}

export function generateEquipmentItem(
  content: GuildGameContent,
  questLevel: number,
  itemId: string,
  random: RandomSource,
): EquipmentItem {
  const base = content.equipmentBases[random.nextInt(0, content.equipmentBases.length - 1)];
  if (!base) throw new Error('Equipment base content is empty');
  const rarity = rarityForRoll(random.next());
  const affixStart = random.nextInt(0, content.equipmentAffixes.length - 1);
  const affixes = Array.from({ length: affixCount(rarity) }, (_, index) => {
    const definition =
      content.equipmentAffixes[(affixStart + index) % content.equipmentAffixes.length]!;
    const statBase = definition.stat === 'hp' ? 10 : definition.stat === 'speed' ? 1 : 3;
    return {
      stat: definition.stat,
      value: statBase + random.nextInt(0, Math.max(1, questLevel)),
      sourceId: definition.id,
      label: definition.name,
    };
  });
  const mainValue = random.nextInt(base.mainStatRoll.min, base.mainStatRoll.max);
  const coreId = base.coreIds[random.nextInt(0, base.coreIds.length - 1)]!;
  const coreStrength = random.nextInt(base.coreStrengthRoll.min, base.coreStrengthRoll.max);
  const remainingCoreIds = base.coreIds.filter((candidate) => candidate !== coreId);
  const secondCoreId =
    rarity === 'legendary' && remainingCoreIds.length > 0
      ? remainingCoreIds[random.nextInt(0, remainingCoreIds.length - 1)]
      : undefined;
  const secondCoreStrength = secondCoreId
    ? random.nextInt(base.coreStrengthRoll.min, base.coreStrengthRoll.max)
    : undefined;

  return {
    id: itemId,
    baseId: base.id,
    name: `${RARITY_LABEL[rarity]}的${base.name}`,
    slot: base.slot,
    rarity,
    mainStat: { stat: base.mainStat, value: mainValue },
    affixes,
    sellValue: 10 + mainValue + affixes.reduce((sum, affix) => sum + affix.value, 0),
    forgeMaterialId: base.forgeMaterialId,
    coreId,
    coreStrength,
    cores: [
      { id: coreId, strength: coreStrength },
      ...(secondCoreId && secondCoreStrength !== undefined
        ? [{ id: secondCoreId, strength: secondCoreStrength }]
        : []),
    ],
  };
}

export function generateQuestRewards(
  profile: GuildProfile,
  battle: GuildBattleState,
  content: GuildGameContent,
  random: RandomSource,
): QuestRewards | undefined {
  if (battle.status !== 'victory') return undefined;
  const quest = content.quests.find((candidate) => candidate.id === battle.questId);
  if (!quest) throw new Error(`Unknown quest: ${battle.questId}`);
  const hunt = content.hunts.find((candidate) => candidate.questId === quest.id);
  const pool = hunt?.skillDropPool ?? {
    id: hunt?.id ?? quest.id,
    elements: content.elements.map(({ id }) => id),
    specializationIds: content.skillSpecializations.map(({ id }) => id),
    triggerIds: content.triggerConditions.map(({ id }) => id),
  };

  return {
    questId: quest.id,
    gold: quest.rewardGold,
    clearMs: battle.elapsedMs,
    items: [0, 1].map((index) =>
      generateEquipmentItem(
        content,
        quest.recommendedLevel,
        `${quest.id}-${profile.nextLootSeed}-${index}`,
        random,
      ),
    ),
    skillDrops: [generateSkillDrop(pool, profile.nextLootSeed * 10, content, random)],
  };
}
