import type {
  EquipmentItem,
  GuildBattleState,
  GuildGameContent,
  GuildItemRarity,
  GuildProfile,
  QuestRewards,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';

const RARITY_SCALE: Readonly<Record<GuildItemRarity, number>> = {
  common: 1,
  uncommon: 1.3,
  rare: 1.7,
  epic: 2.25,
  legendary: 3.1,
};

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
  const scale = RARITY_SCALE[rarity];
  const affixStart = random.nextInt(0, content.equipmentAffixes.length - 1);
  const affixes = Array.from({ length: affixCount(rarity) }, (_, index) => {
    const definition =
      content.equipmentAffixes[(affixStart + index) % content.equipmentAffixes.length]!;
    const statScale = definition.stat === 'hp' ? 5 : definition.stat === 'speed' ? 0.45 : 1;
    return {
      stat: definition.stat,
      value: Math.max(1, Math.round((2 + questLevel) * scale * statScale)),
      sourceId: definition.id,
      label: definition.name,
    };
  });
  const mainValue = Math.round((base.baseValue + questLevel * 1.5) * scale);

  return {
    id: itemId,
    baseId: base.id,
    name: `${RARITY_LABEL[rarity]}的${base.name}`,
    slot: base.slot,
    rarity,
    mainStat: { stat: base.mainStat, value: mainValue },
    affixes,
    sellValue: Math.round((mainValue + affixes.reduce((sum, affix) => sum + affix.value, 0)) * 1.6),
    forgeMaterialId: base.forgeMaterialId,
    ...(base.ruleIds ? { ruleIds: base.ruleIds } : {}),
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

  return {
    questId: quest.id,
    experience: quest.rewardExperience,
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
  };
}
