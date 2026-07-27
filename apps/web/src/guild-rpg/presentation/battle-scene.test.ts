import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { createGuildProfile, startGuildQuest } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { createBattleScene } from './battle-scene';

describe('battle scene projection', () => {
  it('lays out all six heroes and every enemy inside a stable widescreen stage', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const battle = startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
    const scene = createBattleScene(battle, {
      relay: 1,
      actingActorId: 'brann',
      nextActorId: 'lyra',
    });

    expect(scene.width).toBe(1_000);
    expect(scene.height).toBe(560);
    expect(scene.units.filter(({ side }) => side === 'heroes')).toHaveLength(6);
    expect(scene.units.filter(({ side }) => side === 'enemies')).toHaveLength(3);
    expect(scene.units.every(({ x, y }) => x >= 0 && x <= 1_000 && y >= 0 && y <= 560)).toBe(true);
    expect(scene.units.find(({ id }) => id === 'brann')).toMatchObject({
      state: 'acting',
      side: 'heroes',
    });
    expect(scene.units.find(({ id }) => id === 'lyra')).toMatchObject({
      state: 'next',
      side: 'heroes',
    });
    expect(scene.zone.id).toBe('greyfang_frontier');
  });

  it('preserves selected targets, status layers and defeated state for the renderer', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const original = startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
    const enemy = original.units.find(({ side }) => side === 'enemies')!;
    const battle = {
      ...original,
      selectedTargetId: enemy.id,
      units: original.units.map((unit) =>
        unit.id === enemy.id
          ? {
              ...unit,
              currentHp: 0,
              statusLayers: { burn: 8, poison: 5, tide: 2 },
            }
          : unit,
      ),
    };
    const scene = createBattleScene(battle, { relay: 6 });

    expect(scene.units.find(({ id }) => id === enemy.id)).toMatchObject({
      selected: true,
      state: 'defeated',
      statusLayers: { burn: 8, poison: 5, tide: 2 },
    });
    expect(scene.relay).toBe(6);
  });
});
