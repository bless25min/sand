import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { createGuildProfile } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import {
  createEquipmentPageModel,
  createFusionPageModel,
  createSkillPageModel,
} from './guild-collections';

describe('guild skill and equipment collections', () => {
  it('shows hero, six slots, six library entries, and deterministic pagination', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const heroId = profile.defaultOrder[0]!;
    const model = createSkillPageModel(profile, GUILD_GAME_CONTENT, {
      heroId,
      slotIndex: 2,
      page: 0,
    });

    expect(model.heroes).toHaveLength(6);
    expect(model.selectedHero.id).toBe(heroId);
    expect(model.slots).toHaveLength(6);
    expect(model.slots[2]?.selected).toBe(true);
    expect(model.skills.length).toBeLessThanOrEqual(6);
    expect(model.pageCount).toBeGreaterThan(0);
  });

  it('separates unequipped one-star fusion candidates from reversible fused skills', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const model = createFusionPageModel(profile, []);

    expect(model.candidates.every(({ stars, equipped }) => stars === 1 && !equipped)).toBe(true);
    expect(model.selectedCount).toBe(0);
    expect(model.canFuse).toBe(false);
    expect(model.fused.every(({ stars }) => stars > 1)).toBe(true);
  });

  it('shows three equipped slots and pages backpack items six at a time with comparison', () => {
    const initial = createGuildProfile(GUILD_GAME_CONTENT);
    const heroId = initial.defaultOrder[0]!;
    const stored = initial.party[0]?.equipment.weapon;
    const profile = stored
      ? { ...initial, inventory: [...initial.inventory, { ...stored, id: 'comparison-copy' }] }
      : initial;
    const model = createEquipmentPageModel(profile, GUILD_GAME_CONTENT, {
      heroId,
      page: 0,
      selectedSalvageIds: [],
    });

    expect(model.heroes).toHaveLength(6);
    expect(model.slots.map(({ slot }) => slot)).toEqual(['weapon', 'armor', 'accessory']);
    expect(model.items.length).toBeLessThanOrEqual(6);
    expect(model.items.every(({ comparison }) => typeof comparison === 'string')).toBe(true);
  });
});
