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
  return {
    screen: 'guild',
    profile: profile ?? createGuildProfile(GUILD_GAME_CONTENT),
    preferences,
    paused: false,
    settingsOpen: false,
    speed: 1,
    resolvedItemIds: [],
    activatedRuleIds: [],
    message: profile ? '公會紀錄已載入。' : '新的遠征公會已成立。',
  };
}

export function loadGuildRpgState(storage: Pick<Storage, 'getItem'>): GuildRpgState {
  const profile = loadGuildSave(storage);
  return createGuildRpgState(profile, loadGuildPreferences(storage, Boolean(profile)));
}
