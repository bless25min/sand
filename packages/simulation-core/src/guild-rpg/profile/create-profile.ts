import type { GuildGameContent, GuildProfile } from '@expedition/shared-types';

export function createGuildProfile(content: GuildGameContent): GuildProfile {
  const firstQuest = content.quests[0];
  const firstBuild = content.builds[0];
  if (!firstQuest) throw new Error('Guild RPG content requires at least one quest');
  if (!firstBuild) throw new Error('Guild RPG content requires at least one combo build');
  if (content.adventurers.length !== 3) throw new Error('Guild RPG MVP requires three adventurers');

  const preferredLeader =
    content.adventurers.find((adventurer) => adventurer.role === 'ranger') ??
    content.adventurers[0]!;

  return {
    version: 3,
    leaderId: preferredLeader.id,
    party: content.adventurers.map((definition) => ({
      definitionId: definition.id,
      level: 1,
      experience: 0,
      equipment: {},
    })),
    inventory: [],
    materials: {},
    gold: 200,
    unlockedQuestIds: [firstQuest.id],
    questRecords: {},
    nextLootSeed: 1,
    selectedBuildId: firstBuild.id,
    loadouts: Object.fromEntries(
      content.builds.map((build) => [build.id, [...build.defaultCardIds]]),
    ),
    completedChallengeIds: [],
    discoveredEquipmentIds: [],
    discoveredRuleIds: [...firstBuild.ruleIds],
    forgeSequence: 0,
    progressionEvents: [],
  };
}
