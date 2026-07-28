import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import {
  createGuildProfile,
  previewSkillOutcome,
  startGuildQuest,
} from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { createBattleScene } from './battle-scene';

describe('battle scene projection', () => {
  it('lays out all six heroes and every enemy inside a stable widescreen stage', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const battle = startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
    const scene = createBattleScene(battle, {
      relay: 1,
      layout: 'landscape',
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

  it('uses a portrait-native formation instead of squeezing the widescreen stage', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const battle = startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
    const scene = createBattleScene(battle, { relay: 1, layout: 'portrait' });

    expect(scene).toMatchObject({ width: 600, height: 900, layout: 'portrait' });
    expect(
      scene.units.filter(({ side }) => side === 'heroes').map(({ x, y }) => ({ x, y })),
    ).toEqual([
      { x: 100, y: 650 },
      { x: 300, y: 650 },
      { x: 500, y: 650 },
      { x: 100, y: 805 },
      { x: 300, y: 805 },
      { x: 500, y: 805 },
    ]);
    expect(
      scene.units.filter(({ side }) => side === 'enemies').map(({ x, y }) => ({ x, y })),
    ).toEqual([
      { x: 110, y: 360 },
      { x: 300, y: 330 },
      { x: 490, y: 360 },
    ]);
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

  it('projects exact numeric stats and armed-skill outcomes into the battlefield HUD', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const battle = startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
    const actorId = battle.roundOrder!.activeAdventurerId!;
    const targetId = battle.selectedTargetId!;
    const skillId = profile.party.find(({ definitionId }) => definitionId === actorId)!
      .skillIds[0]!;
    const preview = previewSkillOutcome({
      battle,
      actorId,
      targetId,
      skillId,
      content: createSkillEngineContent(profile),
    });
    const scene = createBattleScene(battle, { relay: 1, preview });
    const target = scene.units.find(({ id }) => id === targetId);

    expect(target).toMatchObject({
      currentHp: expect.any(Number),
      maxHp: expect.any(Number),
      attack: expect.any(Number),
      defense: expect.any(Number),
      preview: {
        afterHp: expect.any(Number),
        damage: expect.any(Number),
      },
    });
    expect(scene.preview).toMatchObject({
      actorId,
      totalDamage: preview.totalDamage,
    });
    expect(scene.preview?.targetIds).toContain(targetId);
  });
});
