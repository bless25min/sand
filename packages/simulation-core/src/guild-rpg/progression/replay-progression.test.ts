import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildBattleState, HuntRewards } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { advanceComposition } from '../combo/advance-composition';
import { compileCommand } from '../combo/compile-command';
import { resolveCommand } from '../combo/resolve-command';
import { createGuildProfile } from '../profile/create-profile';
import { startGuildQuest } from '../profile/start-quest';
import { applyHuntProgression, evaluateHuntChallenges } from './replay-progression';

function completedCampaign() {
  const profile = createGuildProfile(GUILD_GAME_CONTENT);
  return {
    ...profile,
    unlockedQuestIds: GUILD_GAME_CONTENT.quests.map((quest) => quest.id),
    questRecords: Object.fromEntries(
      GUILD_GAME_CONTENT.quests.map((quest) => [quest.id, { clears: 1 }]),
    ),
  };
}

function victoriousEvidence(buildId: string) {
  const profile = { ...completedCampaign(), selectedBuildId: buildId };
  const started = startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
  const hunt = GUILD_GAME_CONTENT.hunts.find((candidate) => candidate.questId === 'border_pack')!;
  const executionEnemyId = hunt.bossEnemyId ?? hunt.enemies.at(-1)!.enemyId;
  const build = GUILD_GAME_CONTENT.builds.find((candidate) => candidate.id === buildId)!;
  const battle: GuildBattleState = {
    ...started,
    status: 'victory',
    elapsedMs: 4_200,
    units: started.units.map((unit) =>
      unit.side === 'enemies' ? { ...unit, currentHp: 0 } : unit,
    ),
    combo: {
      ...started.combo!,
      phase: 'complete',
      events: [
        ...build.signatureCardIds.map((cardId, index) => ({
          id: index,
          causalId: `signature:${cardId}`,
          kind: 'card_played' as const,
          message: `${cardId} 已釋放`,
          cardId,
        })),
        {
          id: build.signatureCardIds.length,
          causalId: 'execution:defeat',
          parentCausalId: 'execution:damage',
          kind: 'unit_defeated',
          message: '處決完成',
          targetId: executionEnemyId,
          cueId: 'boss-execution',
        },
        {
          id: build.signatureCardIds.length + 1,
          causalId: 'execution:overkill',
          parentCausalId: 'execution:damage',
          kind: 'overkill',
          message: '處決溢傷',
          targetId: executionEnemyId,
          amount: 999,
          cueId: 'overkill',
        },
      ],
      metrics: {
        ...started.combo!.metrics,
        commandCount: 1,
        bestCommandCardCount: 8,
        totalOverkill: 9_999,
      },
      activatedBossPhaseIds: hunt.bossPhases?.map((phase) => phase.id) ?? [],
    },
  };
  return { profile, battle, hunt };
}

describe('meaningful replay progression', () => {
  it('completes all four authored hunt challenge kinds from causal battle evidence', () => {
    const route = GUILD_GAME_CONTENT.challenges.find(
      (challenge) => challenge.huntId === 'border-pack-hunt' && challenge.kind === 'build_route',
    )!;
    const { profile, battle, hunt } = victoriousEvidence(route.requiredBuildId!);

    const completed = evaluateHuntChallenges(profile, battle, hunt, GUILD_GAME_CONTENT);

    expect(completed.map((challenge) => challenge.kind).sort()).toEqual([
      'build_route',
      'execution',
      'one_command',
      'overkill',
    ]);
  });

  it('does not award route or execution challenges without their causal card and overkill events', () => {
    const route = GUILD_GAME_CONTENT.challenges.find(
      (challenge) => challenge.huntId === 'border-pack-hunt' && challenge.kind === 'build_route',
    )!;
    const { profile, battle, hunt } = victoriousEvidence(route.requiredBuildId!);
    const withoutRouteOrExecution = {
      ...battle,
      combo: {
        ...battle.combo!,
        events: battle.combo!.events.filter(
          (event) => event.kind !== 'card_played' && event.kind !== 'overkill',
        ),
      },
    };

    const completed = evaluateHuntChallenges(
      profile,
      withoutRouteOrExecution,
      hunt,
      GUILD_GAME_CONTENT,
    );

    expect(completed.map((challenge) => challenge.kind)).not.toContain('build_route');
    expect(completed.map((challenge) => challenge.kind)).not.toContain('execution');
  });

  it('persists challenge, chain, quality, collection, and Ascended records', () => {
    const route = GUILD_GAME_CONTENT.challenges.find(
      (challenge) => challenge.huntId === 'border-pack-hunt' && challenge.kind === 'build_route',
    )!;
    const { profile, battle } = victoriousEvidence(route.requiredBuildId!);
    const ascendedBattle = {
      ...battle,
      ascension: GUILD_GAME_CONTENT.ascensions[0]!,
    };
    const rewards: HuntRewards = {
      questId: 'border_pack',
      huntId: 'border-pack-hunt',
      successful: true,
      experience: 10,
      gold: 20,
      clearMs: 4_200,
      materials: [],
      items: [
        {
          id: 'record-drop',
          baseId: 'scout_charm',
          name: '斥候追風符',
          slot: 'accessory',
          rarity: 'legendary',
          mainStat: { stat: 'speed', value: 10 },
          affixes: [],
          sellValue: 50,
          ruleIds: ['ricochet_focus'],
          sourceEnemyId: 'wolf_scout',
          qualityScore: 777,
          jackpot: true,
          recommendedBuildIds: ['ricochet'],
        },
      ],
      axes: {
        multiKill: 3,
        chainWipe: true,
        annihilation: true,
        perfectAnnihilation: true,
        bossChest: true,
        quantityMultiplier: 3,
        individualOverkill: {},
        sharedOverflow: 100,
        totalOverkill: 9_999,
      },
    };

    const result = applyHuntProgression(profile, ascendedBattle, rewards, GUILD_GAME_CONTENT);

    expect(result.profile.completedChallengeIds).toHaveLength(4);
    expect(result.profile.questRecords.border_pack).toMatchObject({
      bestChain: 8,
      bestItemQuality: 777,
      ascendedClears: 1,
    });
    expect(result.profile.discoveredEquipmentIds).toContain('scout_charm');
    expect(result.profile.discoveredRuleIds).toContain('ricochet_focus');
    expect(result.newChallengeIds).toHaveLength(4);
  });

  it('accumulates distinct Ascended clears without erasing prior extended records', () => {
    const { profile, battle } = victoriousEvidence('retaliation');
    const rewards: HuntRewards = {
      questId: 'border_pack',
      huntId: 'border-pack-hunt',
      successful: true,
      experience: 10,
      gold: 20,
      clearMs: 4_200,
      materials: [],
      items: [],
      axes: {
        multiKill: 3,
        chainWipe: true,
        annihilation: true,
        perfectAnnihilation: true,
        bossChest: true,
        quantityMultiplier: 3,
        individualOverkill: {},
        sharedOverflow: 100,
        totalOverkill: 9_999,
      },
    };

    const afterCrimson = applyHuntProgression(
      profile,
      { ...battle, ascension: GUILD_GAME_CONTENT.ascensions[0]! },
      rewards,
      GUILD_GAME_CONTENT,
    ).profile;
    const afterSignature = applyHuntProgression(
      afterCrimson,
      { ...battle, ascension: GUILD_GAME_CONTENT.ascensions[1]! },
      rewards,
      GUILD_GAME_CONTENT,
    ).profile;
    const afterAnnihilation = applyHuntProgression(
      afterSignature,
      { ...battle, ascension: GUILD_GAME_CONTENT.ascensions[2]! },
      rewards,
      GUILD_GAME_CONTENT,
    ).profile;

    expect(afterAnnihilation.questRecords.border_pack).toMatchObject({
      clears: 4,
      bestChain: 8,
      bestOverkill: 9_999,
      ascendedClears: 3,
    });
  });

  it('unlocks three runtime-distinct Ascensions after campaign completion', () => {
    const profile = completedCampaign();
    const baseline = advanceComposition(
      startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT),
      400,
    );

    for (const ascension of GUILD_GAME_CONTENT.ascensions) {
      const battle = startGuildQuest(
        profile,
        'border_pack',
        GUILD_GAME_CONTENT,
        false,
        ascension.id,
      );
      const advanced = advanceComposition(battle, 400);
      const baseEnemyGauge = baseline.units.find((unit) => unit.side === 'enemies')!.gauge;
      const enemyGauge = advanced.units.find((unit) => unit.side === 'enemies')!.gauge;
      expect(battle.ascension, ascension.id).toMatchObject({
        id: ascension.id,
        routeLabel: ascension.routeLabel,
        cueId: ascension.cueId,
      });
      expect(battle.combo?.events[0], ascension.id).toMatchObject({
        kind: 'enemy_pressure',
        cueId: ascension.cueId,
      });
      expect(enemyGauge, ascension.id).toBeGreaterThan(baseEnemyGauge);
    }
  });

  it('makes signature and annihilation routes change causal damage and overkill output', () => {
    const profile = completedCampaign();
    const signatureCommand = compileCommand(
      { cardIds: ['brann_brace', 'brann_riposte'] },
      GUILD_GAME_CONTENT.cards,
    );
    const baseline = resolveCommand(
      startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT),
      signatureCommand,
      GUILD_GAME_CONTENT.cards,
    );
    const signature = resolveCommand(
      startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT, false, 'signature_route'),
      signatureCommand,
      GUILD_GAME_CONTENT.cards,
    );
    expect(signature.combo!.metrics.totalDamage).toBeGreaterThan(
      baseline.combo!.metrics.totalDamage,
    );

    const quickshot = compileCommand({ cardIds: ['lyra_quickshot'] }, GUILD_GAME_CONTENT.cards);
    const fragileEnemies = (ascensionId?: string) => {
      const battle = startGuildQuest(
        profile,
        'border_pack',
        GUILD_GAME_CONTENT,
        false,
        ascensionId,
      );
      return {
        ...battle,
        units: battle.units.map((unit) =>
          unit.side === 'enemies' ? { ...unit, currentHp: 1 } : unit,
        ),
      };
    };
    const baseOverkill = resolveCommand(fragileEnemies(), quickshot, GUILD_GAME_CONTENT.cards);
    const annihilation = resolveCommand(
      fragileEnemies('annihilation_weather'),
      quickshot,
      GUILD_GAME_CONTENT.cards,
    );
    expect(annihilation.combo!.metrics.totalOverkill).toBeGreaterThan(
      baseOverkill.combo!.metrics.totalOverkill,
    );
  });
});
