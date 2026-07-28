import type { BattleUnit, GuildBattleEvent, GuildBattleState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { projectBattlePlayback } from './project-battle-playback';

const unit = (id: string, side: BattleUnit['side'], currentHp: number): BattleUnit => ({
  id,
  name: id,
  side,
  stats: { hp: 100, attack: 10, defense: 2, speed: 1, healing: 0 },
  currentHp,
  gauge: 0,
  threat: 0,
  guarding: false,
  isLeader: false,
  skillIds: [],
  statusLayers: { burn: 0, poison: 0, tide: 0 },
});

const battle = (units: readonly BattleUnit[], status: GuildBattleState['status'] = 'active') => ({
  questId: 'test',
  seed: 'test',
  elapsedMs: 0,
  sequence: 0,
  status,
  units,
  leaderAuto: false,
  events: [],
});

describe('projectBattlePlayback', () => {
  const before = battle([unit('hero', 'heroes', 70), unit('enemy', 'enemies', 100)]);
  const final = battle(
    [
      { ...unit('hero', 'heroes', 75), strengthened: 4 },
      {
        ...unit('enemy', 'enemies', 0),
        statusLayers: { burn: 3, poison: 0, tide: 0 },
        defenseReduction: 2,
      },
    ],
    'victory',
  );
  const events: GuildBattleEvent[] = [
    { id: 1, kind: 'skill_cast', message: 'cast', actorId: 'hero', targetId: 'enemy' },
    {
      id: 2,
      kind: 'status_applied',
      message: 'burn',
      targetId: 'enemy',
      amount: 3,
      element: 'fire',
    },
    { id: 3, kind: 'weaken', message: 'weaken', targetId: 'enemy', amount: 2 },
    { id: 4, kind: 'damage', message: 'damage', targetId: 'enemy', amount: 80 },
    { id: 5, kind: 'reaction', message: 'reaction', targetId: 'enemy', amount: 20 },
    { id: 6, kind: 'healing', message: 'heal', targetId: 'hero', amount: 5 },
    { id: 7, kind: 'strengthen', message: 'buff', targetId: 'hero', amount: 4 },
    { id: 8, kind: 'unit_defeated', message: 'defeat', targetId: 'enemy' },
    { id: 9, kind: 'victory', message: 'victory' },
  ];

  it('keeps the opening state before a state-changing event is visible', () => {
    const projected = projectBattlePlayback(before, final, events, 1);

    expect(projected.units.find(({ id }) => id === 'enemy')).toMatchObject({
      currentHp: 100,
      statusLayers: { burn: 0 },
    });
    expect(projected.status).toBe('active');
  });

  it('applies additive state changes in visible event order', () => {
    const projected = projectBattlePlayback(before, final, events, 7);

    expect(projected.units.find(({ id }) => id === 'enemy')).toMatchObject({
      currentHp: 0,
      statusLayers: { burn: 3 },
      defenseReduction: 2,
    });
    expect(projected.units.find(({ id }) => id === 'hero')).toMatchObject({
      currentHp: 75,
      strengthened: 4,
    });
    expect(projected.status).toBe('active');
  });

  it('returns the authoritative final battle on the final event', () => {
    expect(projectBattlePlayback(before, final, events, events.length)).toBe(final);
  });
});
