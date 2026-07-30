import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildProfile } from '@expedition/shared-types';
import { createGuildProfile } from '@expedition/simulation-core';

import type { GuildRpgState } from './reducer';
import {
  createDefaultGuildPreferences,
  loadGuildPreferences,
  type GuildPreferences,
} from './preferences';
import { loadGuildSave, type GuildSavePort } from './save';
import { GUILD_SESSION_KEY, parseGuildSessionSnapshot } from './session-snapshot';

export function createGuildSession(
  profile?: GuildProfile,
  preferences: GuildPreferences = createDefaultGuildPreferences(Boolean(profile)),
): GuildRpgState {
  const activeProfile = profile ?? createGuildProfile(GUILD_GAME_CONTENT);
  return {
    screen: 'guild',
    page: 'quest',
    skillWorkspace: 'loadout',
    profile: activeProfile,
    preferences,
    tutorialStep: preferences.tutorial === 'active' ? 'start_hunt' : 'complete',
    selectedHeroId: activeProfile.defaultOrder[0]!,
    selectedSkillSlot: 0,
    selectedFusionIds: [],
    selectedSalvageIds: [],
    recentEvents: [],
    newChallengeIds: [],
    recordHighlights: [],
    message: profile ? '公會紀錄已載入。' : '新的遠征公會已成立。',
  };
}

export function loadGuildSession(storage: GuildSavePort): GuildRpgState {
  const profile = loadGuildSave(storage);
  const session = createGuildSession(profile, loadGuildPreferences(storage, Boolean(profile)));
  const snapshot = parseGuildSessionSnapshot(storage.getItem(GUILD_SESSION_KEY), session.profile);
  return snapshot ? { ...session, ...snapshot } : session;
}
