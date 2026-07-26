import type {
  GuildProfile,
  HuntRewards,
  QuestDefinition,
  QuestRecord,
  QuestRewards,
} from '@expedition/shared-types';

function performanceRecord(rewards: QuestRewards, previous: QuestRecord | undefined) {
  if (!('axes' in rewards)) return {};
  const huntRewards = rewards as HuntRewards;
  const bestItemQuality = Math.max(0, ...huntRewards.items.map((item) => item.qualityScore));
  return {
    bestOverkill: Math.max(previous?.bestOverkill ?? 0, huntRewards.axes.totalOverkill),
    bestLootMultiplier: Math.max(
      previous?.bestLootMultiplier ?? 1,
      huntRewards.axes.quantityMultiplier,
    ),
    bestItemQuality: Math.max(previous?.bestItemQuality ?? 0, bestItemQuality),
  };
}

export function applyQuestRewards(
  profile: GuildProfile,
  rewards: QuestRewards,
  quests: readonly QuestDefinition[],
): GuildProfile {
  const questIndex = quests.findIndex((quest) => quest.id === rewards.questId);
  if (questIndex < 0) throw new Error(`Unknown quest reward: ${rewards.questId}`);
  const materials = { ...profile.materials };
  for (const material of rewards.materials ?? []) {
    materials[material.id] = (materials[material.id] ?? 0) + material.quantity;
  }
  if (rewards.successful === false) {
    return {
      ...profile,
      materials,
      nextLootSeed: profile.nextLootSeed + 1,
    };
  }
  const previous = profile.questRecords[rewards.questId];
  const nextQuest = quests[questIndex + 1];
  const unlocked = new Set(profile.unlockedQuestIds);
  if (nextQuest) unlocked.add(nextQuest.id);

  return {
    ...profile,
    materials,
    inventory: [...profile.inventory, ...rewards.items],
    skillInventory: [...profile.skillInventory, ...rewards.skillDrops],
    gold: profile.gold + rewards.gold,
    unlockedQuestIds: quests.filter((quest) => unlocked.has(quest.id)).map((quest) => quest.id),
    questRecords: {
      ...profile.questRecords,
      [rewards.questId]: {
        ...previous,
        clears: (previous?.clears ?? 0) + 1,
        bestClearMs:
          previous?.bestClearMs === undefined
            ? rewards.clearMs
            : Math.min(previous.bestClearMs, rewards.clearMs),
        ...performanceRecord(rewards, previous),
      },
    },
    nextLootSeed: profile.nextLootSeed + 1,
  };
}
