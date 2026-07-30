import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { createGuildProfile } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import {
  createGuildShellModel,
  createPartyPageModel,
  createQuestPageModel,
  resolveGuildShellLayout,
} from './guild-shell';

describe('fixed-screen guild presentation', () => {
  it.each([
    [{ width: 390, height: 844 }, 'mobile-portrait', 72],
    [{ width: 1280, height: 720 }, 'desktop-landscape', 82],
  ] as const)('fits all four destinations at %j', (viewport, mode, navigationHeight) => {
    const layout = resolveGuildShellLayout(viewport);

    expect(layout.mode).toBe(mode);
    expect(layout.navigation.height).toBe(navigationHeight);
    expect(layout.viewport.height + layout.header.height + layout.navigation.height).toBe(
      layout.design.height,
    );
  });

  it('exposes four stable destinations and the active one', () => {
    const model = createGuildShellModel('skills');

    expect(model.destinations.map(({ id }) => id)).toEqual([
      'quest',
      'party',
      'skills',
      'equipment',
    ]);
    expect(model.destinations.find(({ selected }) => selected)?.id).toBe('skills');
  });

  it('maps four zones, locks, records, challenges, and ascensions without hiding quests', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const model = createQuestPageModel(profile, GUILD_GAME_CONTENT);

    expect(model.zones).toHaveLength(4);
    expect(model.zones.flatMap(({ quests }) => quests)).toHaveLength(12);
    expect(model.zones[0]?.quests[0]).toMatchObject({
      id: profile.unlockedQuestIds[0],
      unlocked: true,
      cleared: false,
    });
    expect(model.zones[3]?.quests[2]?.unlocked).toBe(false);
    expect(model.ascensions).toHaveLength(3);
    expect(model.zones[0]?.quests[0]?.challenges).toHaveLength(4);
  });

  it('shows all six party members, current order, six skill slots, and three equipment slots', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const selectedHeroId = profile.defaultOrder[2]!;
    const model = createPartyPageModel(profile, GUILD_GAME_CONTENT, selectedHeroId);

    expect(model.members).toHaveLength(6);
    expect(model.members.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(model.members.find(({ selected }) => selected)?.id).toBe(selectedHeroId);
    expect(model.members.every(({ skillCount }) => skillCount === 6)).toBe(true);
    expect(model.members.every(({ equipmentSlots }) => equipmentSlots.length === 3)).toBe(true);
  });
});
