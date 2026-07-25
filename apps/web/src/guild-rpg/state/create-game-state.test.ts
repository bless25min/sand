import { describe, expect, it } from 'vitest';

import {
  createDefaultGuildPreferences,
  storeGuildPreferences,
} from '../preferences/guild-preferences';
import { storeGuildSave } from '../storage/guild-save';
import { createGuildRpgState, loadGuildRpgState } from './create-game-state';

describe('guild RPG initial state', () => {
  it('hydrates the profile and separate presentation preferences together', () => {
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
      paused: false,
      settingsOpen: false,
    });
  });
});
