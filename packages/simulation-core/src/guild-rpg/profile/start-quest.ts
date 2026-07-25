import type { GuildGameContent, GuildProfile } from '@expedition/shared-types';

import { createGuildBattle } from '../battle/create-battle';
import { compileBuild } from '../combo/compile-build';

export function startGuildQuest(
  profile: GuildProfile,
  questId: string,
  content: GuildGameContent,
  leaderAuto = false,
) {
  if (!profile.unlockedQuestIds.includes(questId)) throw new Error(`Quest is locked: ${questId}`);
  const quest = content.quests.find((candidate) => candidate.id === questId);
  if (!quest) throw new Error(`Unknown quest: ${questId}`);

  const battle = createGuildBattle({
    adventurers: content.adventurers,
    quest,
    party: [...profile.party],
    leaderId: profile.leaderId,
    seed: `${questId}-${profile.nextLootSeed}`,
    leaderAuto,
  });
  const build = compileBuild(profile, content);
  return {
    ...battle,
    combo: {
      phase: 'composing' as const,
      draft: { cardIds: [] },
      availableCardIds: build.cardIds,
      events: [],
      metrics: {
        comboCount: 0,
        totalDamage: 0,
        totalOverkill: 0,
        defeatedEnemyIds: [],
        annihilationOverflow: 0,
      },
    },
  };
}
