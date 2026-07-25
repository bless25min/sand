import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildProfile } from '@expedition/shared-types';
import { createGuildProfile } from '@expedition/simulation-core';

import type { GuildRpgState } from './game-reducer';

export function createGuildRpgState(profile?: GuildProfile): GuildRpgState {
  return {
    screen: 'guild',
    profile: profile ?? createGuildProfile(GUILD_GAME_CONTENT),
    speed: 1,
    resolvedItemIds: [],
    message: profile ? '公會紀錄已載入。' : '新的遠征公會已成立。',
  };
}
