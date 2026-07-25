import type {
  GuildAdventurer,
  GuildProfile,
  HuntRewards,
  QuestDefinition,
  QuestRecord,
  QuestRewards,
} from '@expedition/shared-types';

function awardExperience(member: GuildAdventurer, amount: number): GuildAdventurer {
  let level = member.level;
  let experience = member.experience + amount;
  while (experience >= level * 80) {
    experience -= level * 80;
    level += 1;
  }
  return { ...member, level, experience };
}

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
    party: profile.party.map((member) => awardExperience(member, rewards.experience)),
    gold: profile.gold + rewards.gold,
    unlockedQuestIds: quests.filter((quest) => unlocked.has(quest.id)).map((quest) => quest.id),
    questRecords: {
      ...profile.questRecords,
      [rewards.questId]: {
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
