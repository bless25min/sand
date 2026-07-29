import type { GuildGameContent, GuildProfile } from '@expedition/shared-types';

import { createOwnedSkill } from '../skills/create-owned-skill';

export function createGuildProfile(content: GuildGameContent): GuildProfile {
  const firstQuest = content.quests[0];
  if (!firstQuest) throw new Error('Guild RPG content requires at least one quest');
  if (content.adventurers.length !== 6)
    throw new Error('Guild RPG release requires six adventurers');

  const preferredLeader =
    content.adventurers.find((adventurer) => adventurer.role === 'ranger') ??
    content.adventurers[0]!;
  const skillInventory = content.adventurers.flatMap((definition) =>
    definition.starterSkillIds.map((formId, index) =>
      createOwnedSkill({
        id: `starter:${definition.id}:${index + 1}`,
        formId,
        content,
      }),
    ),
  );
  const defaultOrder = content.adventurers.map(({ id }) => id);

  return {
    version: 5,
    leaderId: preferredLeader.id,
    party: content.adventurers.map((definition, adventurerIndex) => ({
      definitionId: definition.id,
      equipment: {},
      skillIds: skillInventory
        .slice(adventurerIndex * 6, adventurerIndex * 6 + 6)
        .map(({ id }) => id),
    })),
    defaultOrder,
    skillInventory,
    inventory: [],
    materials: {},
    gold: 200,
    unlockedQuestIds: [firstQuest.id],
    questRecords: {},
    nextLootSeed: 1,
    completedChallengeIds: [],
    discoveredEquipmentIds: [],
    discoveredCoreIds: [],
    forgeSequence: 0,
    forgeLocks: {},
    progressionEvents: [],
  };
}
