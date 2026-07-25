import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { BattleUnit, GuildAdventurer, GuildBattleState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../../rng/seeded-random';
import { advanceGuildBattle } from './advance-battle';
import { chooseAutoAction } from './choose-auto-action';
import { createGuildBattle } from './create-battle';
import { submitLeaderAction } from './resolve-action';

const party: GuildAdventurer[] = GUILD_GAME_CONTENT.adventurers.map((definition) => ({
  definitionId: definition.id,
  level: 1,
  experience: 0,
  equipment: {},
}));

function createBattle(leaderId = 'lyra', leaderAuto = false) {
  return createGuildBattle({
    adventurers: GUILD_GAME_CONTENT.adventurers,
    quest: GUILD_GAME_CONTENT.quests[0]!,
    party,
    leaderId,
    seed: 'battle-test',
    leaderAuto,
  });
}

function actionRandom(battle: GuildBattleState) {
  return createSeededRandom(`${battle.seed}:${battle.sequence}`);
}

function advanceToLeader(battle = createBattle()) {
  let next = battle;

  for (let index = 0; index < 100 && !next.pendingLeaderId; index += 1) {
    next = advanceGuildBattle(next, 100, GUILD_GAME_CONTENT.skills, actionRandom(next));
  }

  return next;
}

describe('guild RPG battle', () => {
  it('fills independent speed gauges and waits for the manual leader', () => {
    const battle = advanceToLeader();
    const ranger = battle.units.find((unit) => unit.id === 'lyra');
    const vanguard = battle.units.find((unit) => unit.id === 'brann');

    expect(battle.pendingLeaderId).toBe('lyra');
    expect(ranger?.gauge).toBe(100);
    expect(vanguard?.gauge).toBeLessThan(ranger?.gauge ?? 0);

    const paused = advanceGuildBattle(
      battle,
      1_000,
      GUILD_GAME_CONTENT.skills,
      actionRandom(battle),
    );
    expect(paused).toEqual(battle);
  });

  it.each([
    ['lyra', 'focused_shot', 'damage'],
    ['brann', 'shield_wall', 'guard'],
    ['elin', 'healing_prayer', 'healing'],
  ] as const)('records a traceable %s signature skill', (leaderId, skillId, eventKind) => {
    let battle = advanceToLeader(createBattle(leaderId));
    const targetId =
      skillId === 'healing_prayer'
        ? battle.units.find((unit) => unit.side === 'heroes' && unit.id !== leaderId)!.id
        : skillId === 'shield_wall'
          ? leaderId
          : battle.units.find((unit) => unit.side === 'enemies')!.id;

    if (skillId === 'healing_prayer') {
      battle = {
        ...battle,
        units: battle.units.map((unit) =>
          unit.id === targetId ? { ...unit, currentHp: unit.currentHp - 30 } : unit,
        ),
      };
    }

    const resolved = submitLeaderAction(
      battle,
      { actorId: leaderId, skillId, targetId },
      GUILD_GAME_CONTENT.skills,
      actionRandom(battle),
    );

    expect(resolved.pendingLeaderId).toBeUndefined();
    expect(resolved.events.at(-1)?.kind).toBe(eventKind);
    expect(resolved.events.at(-1)?.actorId).toBe(leaderId);
  });

  it('makes enemies attack the highest-threat living hero with stable ties', () => {
    const battle = createBattle();
    const units = battle.units.map((unit): BattleUnit => {
      if (unit.id === 'brann' || unit.id === 'lyra') return { ...unit, threat: 80 };
      return unit;
    });
    const enemy = units.find((unit) => unit.side === 'enemies')!;

    const action = chooseAutoAction({ ...battle, units }, enemy.id, GUILD_GAME_CONTENT.skills);

    expect(action).toEqual({
      actorId: enemy.id,
      skillId: 'basic_attack',
      targetId: 'brann',
    });
  });

  it('replays identically from the same seed and auto policies', () => {
    const finish = () => {
      let battle = createBattle('lyra', true);
      for (let index = 0; index < 2_000 && battle.status === 'active'; index += 1) {
        battle = advanceGuildBattle(battle, 100, GUILD_GAME_CONTENT.skills, actionRandom(battle));
      }
      return battle;
    };

    const first = finish();
    const second = finish();

    expect(first.status).not.toBe('active');
    expect(second).toEqual(first);
    expect(
      first.units.every((unit) => unit.currentHp >= 0 && unit.currentHp <= unit.stats.hp),
    ).toBe(true);
    expect(first.units.every((unit) => unit.gauge >= 0 && unit.gauge <= 100)).toBe(true);
  });
});
