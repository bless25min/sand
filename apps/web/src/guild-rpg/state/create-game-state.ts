import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildProfile } from '@expedition/shared-types';
import { createGuildProfile } from '@expedition/simulation-core';

import type { GuildRpgState } from './game-reducer';
import {
  createDefaultGuildPreferences,
  loadGuildPreferences,
  type GuildPreferences,
} from '../preferences/guild-preferences';
import { loadGuildSave } from '../storage/guild-save';

export function createGuildRpgState(
  profile?: GuildProfile,
  preferences: GuildPreferences = createDefaultGuildPreferences(Boolean(profile)),
): GuildRpgState {
  const activeProfile = profile ?? createGuildProfile(GUILD_GAME_CONTENT);
  return {
    screen: 'guild',
    page: 'quest',
    profile: activeProfile,
    preferences,
    tutorialStep: preferences.tutorial === 'active' ? 'start_hunt' : 'complete',
    selectedHeroId: activeProfile.defaultOrder[0]!,
    selectedSkillSlot: 0,
    selectedFusionIds: [],
    selectedSalvageIds: [],
    recentEvents: [],
    message: profile ? '公會紀錄已載入。' : '新的遠征公會已成立。',
  };
}

export function loadGuildRpgState(
  storage: Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'setItem'>>,
): GuildRpgState {
  const profile = loadGuildSave(storage);
  return createGuildRpgState(profile, loadGuildPreferences(storage, Boolean(profile)));
}
