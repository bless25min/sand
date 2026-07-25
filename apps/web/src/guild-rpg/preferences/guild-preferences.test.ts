import { describe, expect, it } from 'vitest';

import {
  createDefaultGuildPreferences,
  loadGuildPreferences,
  parseGuildPreferences,
  storeGuildPreferences,
} from './guild-preferences';

describe('guild preferences', () => {
  it('guides fresh players but does not force existing profiles through onboarding', () => {
    expect(createDefaultGuildPreferences(false)).toEqual({
      version: 1,
      tutorial: 'active',
      masterVolume: 0.45,
      musicEnabled: true,
      hapticsEnabled: true,
      motion: 'system',
    });
    expect(createDefaultGuildPreferences(true).tutorial).toBe('skipped');
  });

  it('restores defaults for malformed values and clamps otherwise valid volume', () => {
    expect(parseGuildPreferences('{', false)).toEqual(createDefaultGuildPreferences(false));
    expect(parseGuildPreferences(JSON.stringify({ version: 2 }), true)).toEqual(
      createDefaultGuildPreferences(true),
    );
    expect(
      parseGuildPreferences(
        JSON.stringify({
          version: 1,
          tutorial: 'complete',
          masterVolume: 4,
          musicEnabled: false,
          hapticsEnabled: false,
          motion: 'reduced',
        }),
        false,
      ),
    ).toMatchObject({ tutorial: 'complete', masterVolume: 1, motion: 'reduced' });
  });

  it('loads and stores a versioned record through the storage boundary', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const preferences = { ...createDefaultGuildPreferences(false), tutorial: 'complete' as const };

    storeGuildPreferences(storage, preferences);

    expect(loadGuildPreferences(storage, false)).toEqual(preferences);
  });
});
