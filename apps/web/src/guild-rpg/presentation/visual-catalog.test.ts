import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import {
  ENEMY_VISUALS,
  HERO_VISUALS,
  ZONE_VISUALS,
  enemyVisual,
  heroVisual,
  zoneVisualForQuest,
} from './visual-catalog';

describe('formal release visual catalog', () => {
  it('covers every authored hero and enemy with a distinct readable identity', () => {
    const heroIds = GUILD_GAME_CONTENT.adventurers.map(({ id }) => id);
    const enemyIds = [
      ...new Set(GUILD_GAME_CONTENT.quests.flatMap(({ enemies }) => enemies.map(({ id }) => id))),
    ];

    expect(Object.keys(HERO_VISUALS).sort()).toEqual([...heroIds].sort());
    expect(Object.keys(ENEMY_VISUALS).sort()).toEqual([...enemyIds].sort());
    expect(new Set(heroIds.map((id) => heroVisual(id).sigil)).size).toBe(6);
    expect(enemyIds.map((id) => enemyVisual(id)).every(({ family }) => family.length > 0)).toBe(
      true,
    );
  });

  it('gives all four zones distinct atmosphere, ground and weather treatments', () => {
    const zones = GUILD_GAME_CONTENT.zones.map(({ id }) => id);
    expect(Object.keys(ZONE_VISUALS).sort()).toEqual([...zones].sort());
    expect(new Set(zones.map((id) => ZONE_VISUALS[id]!.atmosphere)).size).toBe(4);
    expect(new Set(zones.map((id) => ZONE_VISUALS[id]!.weather)).size).toBe(4);

    for (const quest of GUILD_GAME_CONTENT.quests) {
      expect(zoneVisualForQuest(quest.id).id).toBe(quest.zoneId);
    }
  });
});
