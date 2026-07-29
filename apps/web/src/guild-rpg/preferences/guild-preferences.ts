export type TutorialState = 'active' | 'complete' | 'skipped';
export type MotionPreference = 'system' | 'reduced';

export interface GuildPreferences {
  version: 1;
  tutorial: TutorialState;
  masterVolume: number;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  motion: MotionPreference;
}

const PREFERENCES_KEY = 'expedition:guild-rpg:preferences:v1';
const TUTORIAL_STATES = new Set<TutorialState>(['active', 'complete', 'skipped']);
const MOTION_PREFERENCES = new Set<MotionPreference>(['system', 'reduced']);

export function createDefaultGuildPreferences(hasProfile: boolean): GuildPreferences {
  return {
    version: 1,
    tutorial: hasProfile ? 'skipped' : 'active',
    masterVolume: 0.45,
    musicEnabled: true,
    hapticsEnabled: true,
    motion: 'system',
  };
}

export function parseGuildPreferences(
  serialized: string | null,
  hasProfile: boolean,
): GuildPreferences {
  const defaults = createDefaultGuildPreferences(hasProfile);
  if (!serialized) return defaults;
  try {
    const value: unknown = JSON.parse(serialized);
    if (typeof value !== 'object' || value === null) return defaults;
    const record = value as Record<string, unknown>;
    if (
      record.version !== 1 ||
      typeof record.tutorial !== 'string' ||
      !TUTORIAL_STATES.has(record.tutorial as TutorialState) ||
      typeof record.masterVolume !== 'number' ||
      !Number.isFinite(record.masterVolume) ||
      typeof record.musicEnabled !== 'boolean' ||
      typeof record.hapticsEnabled !== 'boolean' ||
      typeof record.motion !== 'string' ||
      !MOTION_PREFERENCES.has(record.motion as MotionPreference)
    ) {
      return defaults;
    }
    return {
      version: 1,
      tutorial: record.tutorial as TutorialState,
      masterVolume: Math.max(0, Math.min(1, record.masterVolume)),
      musicEnabled: record.musicEnabled,
      hapticsEnabled: record.hapticsEnabled,
      motion: record.motion as MotionPreference,
    };
  } catch {
    return defaults;
  }
}

export function loadGuildPreferences(
  storage: Pick<Storage, 'getItem'>,
  hasProfile: boolean,
): GuildPreferences {
  return parseGuildPreferences(storage.getItem(PREFERENCES_KEY), hasProfile);
}

export function storeGuildPreferences(
  storage: Pick<Storage, 'setItem'>,
  preferences: GuildPreferences,
) {
  storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}
