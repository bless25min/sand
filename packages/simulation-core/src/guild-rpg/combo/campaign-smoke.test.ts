import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { CompiledBuild, GuildBattleState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createGuildProfile } from '../profile/create-profile';
import { startGuildQuest } from '../profile/start-quest';
import { compileBuild } from './compile-build';
import { compileCommand } from './compile-command';
import { resolveCommand } from './resolve-command';
import { resolveTriggerQueue } from './resolve-trigger-queue';

function release(battle: GuildBattleState, build: CompiledBuild) {
  const command = compileCommand({ cardIds: build.cardIds }, GUILD_GAME_CONTENT.cards);
  const resolved = resolveCommand(battle, command, GUILD_GAME_CONTENT.cards);
  const rules = Object.fromEntries(
    build.ruleIds.map((ruleId) => [ruleId, GUILD_GAME_CONTENT.rules[ruleId]!]),
  );
  return resolveTriggerQueue({ battle: resolved, command, rules }).battle;
}

describe('complete campaign combat smoke', () => {
  it('authors every Build signature as a legal executable route', () => {
    for (const build of GUILD_GAME_CONTENT.builds) {
      const command = compileCommand({ cardIds: build.signatureCardIds }, GUILD_GAME_CONTENT.cards);

      expect(command.diagnostics, build.id).toEqual([]);
      expect(command.steps, build.id).toHaveLength(build.signatureCardIds.length);
    }
  });

  it.each(GUILD_GAME_CONTENT.builds.map((build) => [build.id] as const))(
    'lets the %s Build overdrive through all twelve hunts',
    (buildId) => {
      const baseProfile = createGuildProfile(GUILD_GAME_CONTENT);
      const profile = {
        ...baseProfile,
        selectedBuildId: buildId,
        unlockedQuestIds: GUILD_GAME_CONTENT.quests.map((quest) => quest.id),
        party: baseProfile.party.map((member) => ({
          ...member,
          level: 12,
        })),
      };
      const build = compileBuild(profile, GUILD_GAME_CONTENT);

      for (const quest of GUILD_GAME_CONTENT.quests) {
        const hunt = GUILD_GAME_CONTENT.hunts.find((candidate) => candidate.questId === quest.id)!;
        const executionOrder = [
          ...(hunt.guardEnemyIds ?? []),
          ...(hunt.bossEnemyId ? [hunt.bossEnemyId] : []),
          ...hunt.enemies.map((enemy) => enemy.enemyId),
        ];
        let battle: GuildBattleState = startGuildQuest(profile, quest.id, GUILD_GAME_CONTENT);
        let releaseCount = 0;
        while (battle.status === 'active' && releaseCount < 6) {
          const targetId = executionOrder.find((enemyId) =>
            battle.units.some((unit) => unit.id === enemyId && unit.currentHp > 0),
          );
          battle = release({ ...battle, selectedTargetId: targetId }, build);
          releaseCount += 1;
        }

        expect(battle.status, `${buildId}:${quest.id}`).toBe('victory');
        expect(releaseCount, `${buildId}:${quest.id}`).toBeLessThanOrEqual(6);
      }
    },
  );
});
