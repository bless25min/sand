import type { GuildGameContent, GuildProfile } from '@expedition/shared-types';

import { createGuildBattle } from '../battle/create-battle';
import { compileBuild } from '../combo/compile-build';

export function startGuildQuest(
  profile: GuildProfile,
  questId: string,
  content: GuildGameContent,
  leaderAuto = false,
  ascensionId?: string,
) {
  if (!profile.unlockedQuestIds.includes(questId)) throw new Error(`Quest is locked: ${questId}`);
  const quest = content.quests.find((candidate) => candidate.id === questId);
  if (!quest) throw new Error(`Unknown quest: ${questId}`);
  const ascension = ascensionId
    ? content.ascensions.find((candidate) => candidate.id === ascensionId)
    : undefined;
  if (ascensionId && !ascension) throw new Error(`Unknown Ascension: ${ascensionId}`);
  if (
    ascension &&
    !content.quests.every((candidate) => (profile.questRecords[candidate.id]?.clears ?? 0) > 0)
  ) {
    throw new Error('Ascension requires campaign completion');
  }

  const battle = createGuildBattle({
    adventurers: content.adventurers,
    quest,
    party: [...profile.party],
    leaderId: profile.leaderId,
    seed: `${questId}-${profile.nextLootSeed}`,
    leaderAuto,
  });
  const build = compileBuild(profile, content);
  const buildDefinition = content.builds.find((candidate) => candidate.id === build.buildId)!;
  const hunt = content.hunts.find((candidate) => candidate.questId === questId);
  return {
    ...battle,
    ...(ascension ? { ascension } : {}),
    units: battle.units.map((unit) => {
      if (unit.side !== 'enemies') return unit;
      const traits = hunt?.enemies.find((enemy) => enemy.enemyId === unit.id)?.traits;
      return traits ? { ...unit, huntTraits: traits } : unit;
    }),
    combo: {
      phase: 'composing' as const,
      draft: { cardIds: [] },
      availableCardIds: build.cardIds,
      signatureCardIds: buildDefinition.signatureCardIds,
      events: ascension
        ? [
            {
              id: 0,
              causalId: `ascension:${ascension.id}`,
              kind: 'enemy_pressure' as const,
              message: `${ascension.name}覆寫戰場：${ascension.routeLabel}。`,
              cueId: ascension.cueId,
            },
          ]
        : [],
      metrics: {
        comboCount: 0,
        totalDamage: 0,
        totalOverkill: 0,
        defeatedEnemyIds: [],
        annihilationOverflow: 0,
        commandCount: 0,
        bestCommandCardCount: 0,
      },
    },
  };
}
