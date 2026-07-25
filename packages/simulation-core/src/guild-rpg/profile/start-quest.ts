import type { GuildGameContent, GuildProfile } from '@expedition/shared-types';

import { createGuildBattle } from '../battle/create-battle';

export function startGuildQuest(
  profile: GuildProfile,
  questId: string,
  content: GuildGameContent,
  leaderAuto = false,
) {
  if (!profile.unlockedQuestIds.includes(questId)) throw new Error(`Quest is locked: ${questId}`);
  const quest = content.quests.find((candidate) => candidate.id === questId);
  if (!quest) throw new Error(`Unknown quest: ${questId}`);

  return createGuildBattle({
    adventurers: content.adventurers,
    quest,
    party: [...profile.party],
    leaderId: profile.leaderId,
    seed: `${questId}-${profile.nextLootSeed}`,
    leaderAuto,
  });
}
