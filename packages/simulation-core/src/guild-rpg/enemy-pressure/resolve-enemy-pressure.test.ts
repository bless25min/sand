import type { BattleUnit, GuildBattleState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { previewEnemyPressure, resolveEnemyPressure } from './resolve-enemy-pressure';

const unit = (
  id: string,
  side: BattleUnit['side'],
  overrides: Partial<BattleUnit> = {},
): BattleUnit => ({
  id,
  name: id,
  side,
  stats: { hp: 10, attack: 1, defense: 1, speed: 1, healing: 1 },
  currentHp: 10,
  gauge: 0,
  threat: side === 'heroes' && id === 'tank' ? 12 : 0,
  guarding: false,
  isLeader: id === 'tank',
  skillIds: [],
  ...overrides,
});

const battle = (units: readonly BattleUnit[]): GuildBattleState => ({
  questId: 'pressure-test',
  seed: 'pressure-test',
  elapsedMs: 0,
  sequence: 1,
  status: 'active',
  units,
  selectedTargetId: units.find(({ side }) => side === 'enemies')?.id,
  leaderAuto: false,
  events: [],
  roundIndex: 1,
});

describe('deterministic enemy pressure', () => {
  it('previews the next living enemy against the highest-threat hero with additive damage', () => {
    const state = battle([
      unit('tank', 'heroes', { stats: { hp: 10, attack: 1, defense: 1, speed: 1, healing: 1 } }),
      unit('ally', 'heroes'),
      unit('raider', 'enemies', {
        stats: { hp: 10, attack: 3, defense: 1, speed: 2, healing: 0 },
      }),
      unit('archer', 'enemies', {
        stats: { hp: 10, attack: 4, defense: 1, speed: 1, healing: 0 },
      }),
    ]);

    expect(previewEnemyPressure(state)).toEqual({
      enemyId: 'raider',
      targetId: 'tank',
      outcome: 'damage',
      amount: 2,
    });

    const resolved = resolveEnemyPressure(state);
    expect(resolved.intent).toEqual(previewEnemyPressure(state));
    expect(resolved.battle.units.find(({ id }) => id === 'tank')?.currentHp).toBe(8);
    expect(resolved.events).toEqual([
      expect.objectContaining({
        kind: 'enemy_attack',
        actorId: 'raider',
        targetId: 'tank',
        amount: 2,
      }),
    ]);
    expect(previewEnemyPressure(resolved.battle)?.enemyId).toBe('archer');
  });

  it('consumes guard on a blocked hit and lets higher speed produce a true dodge', () => {
    const guarded = battle([
      unit('tank', 'heroes', {
        guarding: true,
        stats: { hp: 10, attack: 1, defense: 2, speed: 1, healing: 1 },
      }),
      unit('raider', 'enemies', {
        stats: { hp: 10, attack: 3, defense: 1, speed: 2, healing: 0 },
      }),
    ]);
    expect(previewEnemyPressure(guarded)).toMatchObject({ outcome: 'guard', amount: 0 });
    const blocked = resolveEnemyPressure(guarded);
    expect(blocked.battle.units[0]).toMatchObject({ currentHp: 10, guarding: false });
    expect(blocked.events[0]).toMatchObject({ kind: 'guard', amount: 0 });

    const fast = battle([
      unit('tank', 'heroes', {
        stats: { hp: 10, attack: 1, defense: 1, speed: 4, healing: 1 },
      }),
      unit('raider', 'enemies', {
        stats: { hp: 10, attack: 5, defense: 1, speed: 2, healing: 0 },
      }),
    ]);
    expect(previewEnemyPressure(fast)).toMatchObject({ outcome: 'dodge', amount: 0 });
    expect(resolveEnemyPressure(fast).events[0]).toMatchObject({ kind: 'dodge', amount: 0 });
  });

  it('skips defeated enemies and reaches defeat only when the last hero falls', () => {
    const state = battle([
      unit('tank', 'heroes', {
        currentHp: 1,
        stats: { hp: 10, attack: 1, defense: 1, speed: 1, healing: 1 },
      }),
      unit('fallen', 'heroes', { currentHp: 0 }),
      unit('dead-raider', 'enemies', { currentHp: 0 }),
      unit('executioner', 'enemies', {
        stats: { hp: 10, attack: 5, defense: 1, speed: 5, healing: 0 },
      }),
    ]);

    expect(previewEnemyPressure(state)?.enemyId).toBe('executioner');
    const resolved = resolveEnemyPressure(state);
    expect(resolved.battle.status).toBe('defeat');
    expect(resolved.events.map(({ kind }) => kind)).toEqual([
      'enemy_attack',
      'unit_defeated',
      'defeat',
    ]);
  });
});
