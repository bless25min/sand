import { describe, expect, it } from 'vitest';

import {
  createDefaultGuildPreferences,
  storeGuildPreferences,
} from '../preferences/guild-preferences';
import { storeGuildSave } from '../storage/guild-save';
import { createGuildRpgState, loadGuildRpgState } from './create-game-state';

describe('guild RPG initial state', () => {
  it('starts a fresh six-hero profile on the real-action onboarding path', () => {
    const state = createGuildRpgState();

    expect(state.profile.version).toBe(5);
    expect(state.profile.party).toHaveLength(6);
    expect(state.profile.party.every(({ skillIds }) => skillIds.length === 6)).toBe(true);
    expect(state.profile.skillInventory).toHaveLength(36);
    expect(state.page).toBe('quest');
    expect(state.tutorialStep).toBe('start_hunt');
  });

  it('hydrates v4 progression and presentation preferences together', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const profile = createGuildRpgState().profile;
    const preferences = {
      ...createDefaultGuildPreferences(true),
      tutorial: 'complete' as const,
      masterVolume: 0.8,
    };
    storeGuildSave(storage, profile);
    storeGuildPreferences(storage, preferences);

    expect(loadGuildRpgState(storage)).toMatchObject({
      profile,
      preferences,
      screen: 'guild',
      page: 'quest',
      tutorialStep: 'complete',
    });
  });
});
