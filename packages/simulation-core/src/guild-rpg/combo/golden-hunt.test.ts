import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type {
  CompiledBuild,
  GuildBattleState,
  GuildProfile,
  HuntRewards,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../../rng/seeded-random';
import { resolveItemChoice } from '../equipment/resolve-item-choice';
import { createGuildProfile } from '../profile/create-profile';
import { startGuildQuest } from '../profile/start-quest';
import { applyQuestRewards } from '../rewards/apply-rewards';
import { calculateHuntRewards } from '../rewards/calculate-hunt-rewards';
import { advanceComposition } from './advance-composition';
import { compileBuild } from './compile-build';
import { compileCommand } from './compile-command';
import { resolveCommand } from './resolve-command';
import { resolveTriggerQueue } from './resolve-trigger-queue';

function release(battle: GuildBattleState, build: CompiledBuild, cardIds: readonly string[]) {
  const command = compileCommand({ cardIds }, GUILD_GAME_CONTENT.cards);
  const prepared: GuildBattleState = {
    ...battle,
    combo: {
      ...battle.combo!,
      lastCommandEventStartIndex: battle.combo!.events.length,
      lastCommandEnemyStartHpRatios: Object.fromEntries(
        battle.units
          .filter((unit) => unit.side === 'enemies' && unit.currentHp > 0)
          .map((unit) => [unit.id, unit.currentHp / unit.stats.hp]),
      ),
    },
  };
  const resolved = resolveCommand(prepared, command, GUILD_GAME_CONTENT.cards);
  const rules = Object.fromEntries(
    build.ruleIds.map((ruleId) => [ruleId, GUILD_GAME_CONTENT.rules[ruleId]!]),
  );
  return resolveTriggerQueue({ battle: resolved, command, rules }).battle;
}

function start(profile: GuildProfile) {
  return startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
}

function huntRewards(profile: GuildProfile, battle: GuildBattleState): HuntRewards {
  return calculateHuntRewards(
    {
      profile,
      battle,
      hunt: GUILD_GAME_CONTENT.hunts[0]!,
      equipmentAffixes: GUILD_GAME_CONTENT.equipmentAffixes,
    },
    createSeededRandom(`${battle.seed}:hunt-loot`),
  );
}

describe('golden strong-hunt flow', () => {
  it.each([
    ['retaliation', '格擋反震'],
    ['ricochet', '彈射分岔'],
    ['healing_overflow', '溢療裁決'],
  ])(
    'full-wipes the boss and guards with the %s engine and leaves its causal trace',
    (buildId, ruleName) => {
      const profile = { ...createGuildProfile(GUILD_GAME_CONTENT), selectedBuildId: buildId };
      const build = compileBuild(profile, GUILD_GAME_CONTENT);
      const battle = release(start(profile), build, build.cardIds);

      expect(battle.status).toBe('victory');
      expect(battle.combo?.events).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: 'rule_triggered' })]),
      );
      expect(battle.combo?.events.some((event) => event.message.includes(ruleName))).toBe(true);
      expect(huntRewards(profile, battle).axes).toMatchObject({
        annihilation: true,
        perfectAnnihilation: true,
        bossChest: true,
      });
    },
  );

  it('publishes boss and guard counter traits that affect pressure and guarded damage', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const initial = start(profile);
    const boss = initial.units.find((unit) => unit.id === 'wolf_alpha')!;

    expect(boss.huntTraits?.map((trait) => trait.id)).toContain('pack_bulwark');
    expect(
      initial.units.flatMap((unit) => unit.huntTraits ?? []).map((trait) => trait.counterBuildIds),
    ).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['retaliation']),
        expect.arrayContaining(['ricochet']),
        expect.arrayContaining(['healing_overflow']),
      ]),
    );

    const selectedBoss = { ...initial, selectedTargetId: boss.id };
    const markedShot = release(selectedBoss, compileBuild(profile, GUILD_GAME_CONTENT), [
      'lyra_mark',
      'lyra_piercing_shot',
    ]);
    expect(markedShot.units.find((unit) => unit.id === boss.id)?.currentHp).toBeGreaterThan(
      boss.currentHp - 90,
    );

    const hunter = initial.units.find((unit) => unit.id === 'wolf_hunter')!;
    const countered = release(
      { ...initial, selectedTargetId: hunter.id },
      compileBuild(profile, GUILD_GAME_CONTENT),
      ['brann_brace'],
    );
    expect(countered.units.find((unit) => unit.id === hunter.id)?.currentHp).toBe(
      hunter.currentHp - 68,
    );

    const pressured = advanceComposition(initial, 30_000);
    expect(pressured.combo?.events.filter((event) => event.kind === 'enemy_pressure').length).toBe(
      3,
    );
    expect(pressured.units.find((unit) => unit.side === 'heroes')!.currentHp).toBeLessThan(
      initial.units.find((unit) => unit.side === 'heroes')!.currentHp,
    );
  });

  it('supports an early safe release, then an equipment rebuild that improves replay overflow', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const build = compileBuild(profile, GUILD_GAME_CONTENT);
    const early = release(start(profile), build, ['brann_brace', 'brann_riposte']);

    expect(early.status).toBe('active');
    expect(early.combo?.draft.cardIds).toEqual([]);
    expect(early.units.some((unit) => unit.side === 'heroes' && unit.currentHp > 0)).toBe(true);

    const firstBattle = release(start(profile), build, build.cardIds);
    const firstRewards = huntRewards(profile, firstBattle);
    const rewarded = applyQuestRewards(profile, firstRewards, GUILD_GAME_CONTENT.quests);
    const exclusive = firstRewards.items.find((item) => item.baseId === 'scout_charm')!;
    const equipped = resolveItemChoice(rewarded, exclusive, 'equip', 'lyra').profile;
    const rebuilt = compileBuild(equipped, GUILD_GAME_CONTENT);
    const replayBattle = release(start(equipped), rebuilt, rebuilt.cardIds);
    const replayRewards = huntRewards(equipped, replayBattle);
    const replayed = applyQuestRewards(equipped, replayRewards, GUILD_GAME_CONTENT.quests);

    expect(rebuilt.ruleIds).toContain('ricochet_focus');
    expect(replayBattle.combo!.metrics.totalOverkill).toBeGreaterThan(
      firstBattle.combo!.metrics.totalOverkill,
    );
    expect(replayed.questRecords.border_pack).toMatchObject({
      bestOverkill: replayBattle.combo!.metrics.totalOverkill,
      bestLootMultiplier: replayRewards.axes.quantityMultiplier,
    });
  });
});
