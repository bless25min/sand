import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type {
  BattleUnit,
  GuildBattleState,
  GuildProfile,
  ItemChoice,
  QuestRewards,
} from '@expedition/shared-types';
import {
  advanceGuildBattle,
  advanceComposition,
  compileBuild,
  createSeededRandom,
  equipStoredItem,
  resolveItemChoice,
  startGuildQuest,
  submitLeaderAction,
} from '@expedition/simulation-core';

import { reduceComboAction, type ComboCommandAction } from './reduce-combo-action';
import { reduceHuntResult } from './reduce-hunt-result';

export interface GuildRpgState {
  screen: 'guild' | 'battle' | 'playback' | 'rewards';
  profile: GuildProfile;
  battle?: GuildBattleState | undefined;
  rewards?: QuestRewards | undefined;
  playback?: ComboPlaybackState | undefined;
  speed: 1 | 2;
  resolvedItemIds: readonly string[];
  message: string;
}

interface ComboPlaybackState {
  eventStartIndex: number;
  startingUnits: readonly BattleUnit[];
  visibleEventCount: number;
}

export type GuildRpgAction =
  | ComboCommandAction
  | { type: 'ADVANCE_PLAYBACK'; count: number }
  | { type: 'COMPLETE_PLAYBACK' }
  | { type: 'START_QUEST'; questId: string }
  | { type: 'TICK'; elapsedMs: number }
  | { type: 'SELECT_TARGET'; targetId: string }
  | { type: 'USE_SKILL'; skillId: string; targetId: string }
  | { type: 'TOGGLE_AUTO' }
  | { type: 'SET_SPEED'; speed: 1 | 2 }
  | { type: 'SET_BUILD'; buildId: string }
  | { type: 'SET_LEADER'; adventurerId: string }
  | { type: 'EQUIP_STORED'; itemId: string; adventurerId: string }
  | { type: 'CHOOSE_ITEM'; itemId: string; choice: ItemChoice; adventurerId: string }
  | { type: 'RETURN_GUILD' };

function actionRandom(battle: GuildBattleState) {
  return createSeededRandom(`${battle.seed}:${battle.sequence}`);
}

function finishBattle(state: GuildRpgState, battle: GuildBattleState): GuildRpgState {
  const result = reduceHuntResult(state.profile, battle, GUILD_GAME_CONTENT);
  if (!result) return { ...state, battle };
  return {
    ...state,
    screen: 'rewards',
    battle,
    rewards: result.rewards,
    playback: undefined,
    resolvedItemIds: [],
    profile: result.profile,
    message: result.message,
  };
}

export function guildRpgReducer(state: GuildRpgState, action: GuildRpgAction): GuildRpgState {
  if (action.type === 'START_QUEST') {
    return {
      ...state,
      screen: 'battle',
      battle: startGuildQuest(state.profile, action.questId, GUILD_GAME_CONTENT),
      rewards: undefined,
      playback: undefined,
      resolvedItemIds: [],
      message: '遠征開始，編排軍令時敵人仍會持續進攻。',
    };
  }
  if (action.type === 'SET_SPEED') return { ...state, speed: action.speed };
  if (action.type === 'ADVANCE_PLAYBACK' && state.screen === 'playback' && state.playback) {
    const eventCount = Math.max(
      0,
      (state.battle?.combo?.events.length ?? 0) - state.playback.eventStartIndex,
    );
    return {
      ...state,
      playback: {
        ...state.playback,
        visibleEventCount: Math.min(
          eventCount,
          state.playback.visibleEventCount + Math.max(0, action.count),
        ),
      },
    };
  }
  if (
    action.type === 'COMPLETE_PLAYBACK' &&
    state.screen === 'playback' &&
    state.battle &&
    state.playback
  ) {
    if (state.battle.status !== 'active') {
      return finishBattle(state, state.battle);
    }
    return {
      ...state,
      screen: 'battle',
      playback: undefined,
      message: '軍令播放完成，可以繼續編排下一次釋放。',
    };
  }
  if (action.type === 'SET_BUILD' && state.screen === 'guild') {
    const build = GUILD_GAME_CONTENT.builds.find((candidate) => candidate.id === action.buildId);
    if (!build || build.id === state.profile.selectedBuildId) return state;
    return {
      ...state,
      profile: { ...state.profile, selectedBuildId: build.id },
      message: `已切換為「${build.name}」。下一次軍令將套用新的規則圖。`,
    };
  }
  if (action.type === 'SET_LEADER' && state.screen === 'guild') {
    if (!state.profile.party.some((member) => member.definitionId === action.adventurerId)) {
      return state;
    }
    return {
      ...state,
      profile: { ...state.profile, leaderId: action.adventurerId },
      message: '隊長已變更。',
    };
  }
  if (action.type === 'EQUIP_STORED' && state.screen === 'guild') {
    const resolution = equipStoredItem(state.profile, action.itemId, action.adventurerId);
    return { ...state, profile: resolution.profile, message: resolution.message };
  }
  if (action.type === 'RETURN_GUILD') {
    return {
      ...state,
      screen: 'guild',
      battle: undefined,
      rewards: undefined,
      playback: undefined,
      resolvedItemIds: [],
      message: '隊伍已返回公會。',
    };
  }
  if (action.type === 'CHOOSE_ITEM' && state.rewards) {
    if (state.resolvedItemIds.includes(action.itemId)) return state;
    const item = state.rewards.items.find((candidate) => candidate.id === action.itemId);
    if (!item) return state;
    const resolution = resolveItemChoice(state.profile, item, action.choice, action.adventurerId);
    const rejectedKeep = action.choice === 'keep' && resolution.profile === state.profile;
    return {
      ...state,
      profile: resolution.profile,
      resolvedItemIds: rejectedKeep
        ? state.resolvedItemIds
        : [...state.resolvedItemIds, action.itemId],
      message: resolution.message,
    };
  }
  if (!state.battle || state.screen !== 'battle') return state;

  if (
    action.type === 'APPEND_COMBO_CARD' ||
    action.type === 'UNDO_COMBO_CARD' ||
    action.type === 'RELEASE_COMBO'
  ) {
    const build = compileBuild(state.profile, GUILD_GAME_CONTENT);
    const rules = Object.fromEntries(
      build.ruleIds.map((ruleId) => [ruleId, GUILD_GAME_CONTENT.rules[ruleId]!]),
    );
    const resolution = reduceComboAction(state.battle, action, GUILD_GAME_CONTENT.cards, rules);
    const next = { ...state, battle: resolution.battle, message: resolution.message };
    if (action.type !== 'RELEASE_COMBO') return next;
    return {
      ...next,
      screen: 'playback',
      playback: {
        eventStartIndex:
          resolution.battle.combo?.lastCommandEventStartIndex ??
          state.battle.combo?.events.length ??
          0,
        startingUnits: state.battle.units,
        visibleEventCount: 0,
      },
    };
  }
  if (action.type === 'SELECT_TARGET') {
    const valid = state.battle.units.some(
      (unit) => unit.id === action.targetId && unit.side === 'enemies' && unit.currentHp > 0,
    );
    return valid
      ? { ...state, battle: { ...state.battle, selectedTargetId: action.targetId } }
      : state;
  }
  if (action.type === 'TOGGLE_AUTO') {
    return {
      ...state,
      battle: {
        ...state.battle,
        leaderAuto: !state.battle.leaderAuto,
        pendingLeaderId: undefined,
      },
      message: state.battle.leaderAuto ? '隊長改為手動指揮。' : '隊長已交由自動戰術。',
    };
  }
  if (action.type === 'TICK') {
    const battle = state.battle.combo
      ? advanceComposition(state.battle, action.elapsedMs)
      : advanceGuildBattle(
          state.battle,
          action.elapsedMs,
          GUILD_GAME_CONTENT.skills,
          actionRandom(state.battle),
        );
    return finishBattle(state, battle);
  }
  if (action.type === 'USE_SKILL' && state.battle.pendingLeaderId) {
    const battle = submitLeaderAction(
      state.battle,
      {
        actorId: state.battle.pendingLeaderId,
        skillId: action.skillId,
        targetId: action.targetId,
      },
      GUILD_GAME_CONTENT.skills,
      actionRandom(state.battle),
    );
    return finishBattle(state, battle);
  }
  return state;
}
