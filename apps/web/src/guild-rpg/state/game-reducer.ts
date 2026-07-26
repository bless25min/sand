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
  forgeEquipmentItem,
  resolveItemChoice,
  startGuildQuest,
  submitLeaderAction,
  swapBuildLoadoutCard,
  type ForgeAction,
} from '@expedition/simulation-core';

import { reduceComboAction, type ComboCommandAction } from './reduce-combo-action';
import { reduceHuntResult } from './reduce-hunt-result';
import type { GuildPreferences, TutorialState } from '../preferences/guild-preferences';

export interface GuildRpgState {
  screen: 'guild' | 'battle' | 'playback' | 'rewards';
  profile: GuildProfile;
  preferences: GuildPreferences;
  paused: boolean;
  pausedBeforeSettings: boolean;
  settingsOpen: boolean;
  tutorialReplay: boolean;
  tutorialAcknowledgedTargetId?: string | undefined;
  tutorialPreviewAcknowledged: boolean;
  battle?: GuildBattleState | undefined;
  rewards?: QuestRewards | undefined;
  playback?: ComboPlaybackState | undefined;
  speed: 1 | 2;
  resolvedItemIds: readonly string[];
  activatedRuleIds: readonly string[];
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
  | { type: 'SKIP_PLAYBACK' }
  | { type: 'COMPLETE_PLAYBACK' }
  | { type: 'START_QUEST'; questId: string; ascensionId?: string }
  | { type: 'TICK'; elapsedMs: number }
  | { type: 'SELECT_TARGET'; targetId: string }
  | { type: 'USE_SKILL'; skillId: string; targetId: string }
  | { type: 'TOGGLE_AUTO' }
  | { type: 'SET_SPEED'; speed: 1 | 2 }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'SET_SETTINGS_OPEN'; open: boolean }
  | { type: 'SET_TUTORIAL'; tutorial: TutorialState }
  | { type: 'ACK_TUTORIAL_PREVIEW' }
  | {
      type: 'UPDATE_PREFERENCES';
      preferences: Partial<Omit<GuildPreferences, 'version' | 'tutorial'>>;
    }
  | { type: 'ABANDON_HUNT' }
  | { type: 'SET_BUILD'; buildId: string }
  | { type: 'SET_LEADER'; adventurerId: string }
  | { type: 'EQUIP_STORED'; itemId: string; adventurerId: string }
  | {
      type: 'SWAP_LOADOUT_CARD';
      buildId: string;
      removedCardId: string;
      addedCardId: string;
    }
  | { type: 'FORGE_ITEM'; itemId: string; forgeAction: ForgeAction }
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
    paused: false,
    pausedBeforeSettings: false,
    settingsOpen: false,
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
    const guidedBorderHunt =
      state.preferences.tutorial === 'active' && action.questId === 'border_pack';
    const completedPowerBridge =
      state.preferences.tutorial === 'active' &&
      !state.tutorialReplay &&
      Boolean(state.profile.questRecords.border_pack) &&
      state.profile.selectedBuildId === 'ricochet' &&
      state.profile.forgeSequence > 0 &&
      action.questId !== 'border_pack';
    return {
      ...state,
      screen: 'battle',
      paused: true,
      pausedBeforeSettings: false,
      settingsOpen: false,
      tutorialReplay:
        guidedBorderHunt &&
        (state.tutorialReplay || Boolean(state.profile.questRecords.border_pack)),
      tutorialAcknowledgedTargetId: undefined,
      tutorialPreviewAcknowledged: false,
      preferences: completedPowerBridge
        ? { ...state.preferences, tutorial: 'complete' }
        : state.preferences,
      battle: startGuildQuest(
        state.profile,
        action.questId,
        GUILD_GAME_CONTENT,
        false,
        action.ascensionId,
      ),
      rewards: undefined,
      playback: undefined,
      resolvedItemIds: [],
      activatedRuleIds: [],
      message: action.ascensionId
        ? `${GUILD_GAME_CONTENT.ascensions.find((ascension) => ascension.id === action.ascensionId)!.name}啟動——壓力、路線與奇觀全面升階。`
        : '遠征開始，戰場已停時；只有你明確繼續時間時敵軍才會推進。',
    };
  }
  if (action.type === 'SET_PAUSED') return { ...state, paused: action.paused };
  if (action.type === 'SET_SETTINGS_OPEN') {
    if (action.open) {
      return {
        ...state,
        settingsOpen: true,
        pausedBeforeSettings: state.settingsOpen ? state.pausedBeforeSettings : state.paused,
        paused: state.screen === 'battle' || state.screen === 'playback' ? true : state.paused,
      };
    }
    return {
      ...state,
      settingsOpen: false,
      paused:
        state.screen === 'battle' || state.screen === 'playback'
          ? state.pausedBeforeSettings
          : state.paused,
      pausedBeforeSettings: false,
    };
  }
  if (action.type === 'SET_TUTORIAL') {
    const replayRequested =
      action.tutorial === 'active' && Boolean(state.profile.questRecords.border_pack);
    const pauseGuidedHunt =
      action.tutorial === 'active' &&
      (state.screen === 'battle' || state.screen === 'playback') &&
      state.battle?.questId === 'border_pack';
    return {
      ...state,
      paused: pauseGuidedHunt ? true : state.paused,
      pausedBeforeSettings:
        pauseGuidedHunt && state.settingsOpen ? true : state.pausedBeforeSettings,
      tutorialReplay: replayRequested,
      tutorialAcknowledgedTargetId: undefined,
      tutorialPreviewAcknowledged: false,
      preferences: { ...state.preferences, tutorial: action.tutorial },
    };
  }
  if (action.type === 'ACK_TUTORIAL_PREVIEW') {
    const bossExecutionOpen =
      state.battle?.combo?.activatedBossPhaseIds?.includes('alpha-execution');
    const signature = bossExecutionOpen
      ? [
          'brann_brace',
          'brann_riposte',
          'brann_shield_crash',
          'brann_sweep',
          'brann_fortress_breaker',
        ]
      : ['brann_brace', 'brann_riposte', 'brann_sweep'];
    const draft = state.battle?.combo?.draft.cardIds ?? [];
    const hasSignature = signature.every((cardId, index) => draft[index] === cardId);
    return hasSignature ? { ...state, tutorialPreviewAcknowledged: true } : state;
  }
  if (action.type === 'UPDATE_PREFERENCES') {
    return {
      ...state,
      preferences: { ...state.preferences, ...action.preferences, version: 1 },
    };
  }
  if (
    action.type === 'ABANDON_HUNT' &&
    (state.screen === 'battle' || state.screen === 'playback')
  ) {
    return {
      ...state,
      screen: 'guild',
      battle: undefined,
      playback: undefined,
      rewards: undefined,
      paused: false,
      pausedBeforeSettings: false,
      settingsOpen: false,
      tutorialAcknowledgedTargetId: undefined,
      tutorialPreviewAcknowledged: false,
      message: '本次遠征已中止；公會與裝備進度保持不變。',
    };
  }
  if (action.type === 'SET_SPEED') return { ...state, speed: action.speed };
  if (action.type === 'ADVANCE_PLAYBACK' && state.screen === 'playback' && state.playback) {
    if (state.paused) return state;
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
    action.type === 'SKIP_PLAYBACK' &&
    state.screen === 'playback' &&
    state.playback &&
    state.battle?.combo
  ) {
    if (state.paused) return state;
    return {
      ...state,
      playback: {
        ...state.playback,
        visibleEventCount: state.battle.combo.events.length - state.playback.eventStartIndex,
      },
      message: '已跳至完整高潮，殲滅結果與所有事件完整保留。',
    };
  }
  if (
    action.type === 'COMPLETE_PLAYBACK' &&
    state.screen === 'playback' &&
    state.battle &&
    state.playback
  ) {
    if (state.paused) return state;
    if (state.battle.status !== 'active') {
      return finishBattle(state, state.battle);
    }
    return {
      ...state,
      screen: 'battle',
      paused: true,
      pausedBeforeSettings: false,
      playback: undefined,
      message: '軍令播放完成，可以繼續編排下一次釋放。',
    };
  }
  if (action.type === 'SET_BUILD' && state.screen === 'guild') {
    const build = GUILD_GAME_CONTENT.builds.find((candidate) => candidate.id === action.buildId);
    if (!build || build.id === state.profile.selectedBuildId) return state;
    return {
      ...state,
      profile: {
        ...state.profile,
        selectedBuildId: build.id,
        discoveredRuleIds: [...new Set([...state.profile.discoveredRuleIds, ...build.ruleIds])],
      },
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
  if (action.type === 'SWAP_LOADOUT_CARD' && state.screen === 'guild') {
    const resolution = swapBuildLoadoutCard(
      state.profile,
      action.buildId,
      action.removedCardId,
      action.addedCardId,
      GUILD_GAME_CONTENT,
    );
    return { ...state, profile: resolution.profile, message: resolution.message };
  }
  if (action.type === 'FORGE_ITEM' && state.screen === 'guild') {
    const resolution = forgeEquipmentItem(
      state.profile,
      action.itemId,
      action.forgeAction,
      GUILD_GAME_CONTENT,
      createSeededRandom(
        `forge:${state.profile.forgeSequence}:${action.itemId}:${action.forgeAction}`,
      ),
    );
    return { ...state, profile: resolution.profile, message: resolution.message };
  }
  if (action.type === 'RETURN_GUILD') {
    const completedReplay =
      state.preferences.tutorial === 'active' &&
      state.tutorialReplay &&
      state.battle?.questId === 'border_pack' &&
      state.rewards?.successful === true;
    const returnedSuccessfulBorder =
      state.battle?.questId === 'border_pack' && state.rewards?.successful === true;
    const activatedRuleNames = state.activatedRuleIds.map(
      (ruleId) => GUILD_GAME_CONTENT.rules[ruleId]?.name ?? ruleId,
    );
    return {
      ...state,
      screen: 'guild',
      battle: undefined,
      rewards: undefined,
      playback: undefined,
      resolvedItemIds: [],
      paused: false,
      pausedBeforeSettings: false,
      settingsOpen: false,
      tutorialReplay: returnedSuccessfulBorder ? false : state.tutorialReplay,
      tutorialAcknowledgedTargetId: undefined,
      tutorialPreviewAcknowledged: false,
      preferences: completedReplay
        ? { ...state.preferences, tutorial: 'complete' }
        : state.preferences,
      message:
        activatedRuleNames.length > 0
          ? `規則上線：${activatedRuleNames.join('、')}。帶著新引擎重刷，讓下一次殲滅更誇張。`
          : '狩獵紀錄已更新。帶著戰利品重刷，讓下一次殲滅更誇張。',
    };
  }
  if (action.type === 'CHOOSE_ITEM' && state.rewards) {
    if (state.resolvedItemIds.includes(action.itemId)) return state;
    const item = state.rewards.items.find((candidate) => candidate.id === action.itemId);
    if (!item) return state;
    const resolution = resolveItemChoice(
      state.profile,
      item,
      action.choice,
      action.adventurerId,
      GUILD_GAME_CONTENT.rules,
    );
    const rejectedKeep = action.choice === 'keep' && resolution.profile === state.profile;
    return {
      ...state,
      profile: resolution.profile,
      resolvedItemIds: rejectedKeep
        ? state.resolvedItemIds
        : [...state.resolvedItemIds, action.itemId],
      activatedRuleIds:
        action.choice === 'equip' && resolution.profile !== state.profile
          ? [...new Set([...state.activatedRuleIds, ...(item.ruleIds ?? [])])]
          : state.activatedRuleIds,
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
    const hunt = GUILD_GAME_CONTENT.hunts.find(
      (candidate) => candidate.questId === state.battle?.questId,
    );
    const resolution = reduceComboAction(
      state.battle,
      action,
      GUILD_GAME_CONTENT.cards,
      rules,
      hunt,
    );
    const next = { ...state, paused: true, battle: resolution.battle, message: resolution.message };
    if (action.type !== 'RELEASE_COMBO') return next;
    return {
      ...next,
      screen: 'playback',
      paused: false,
      tutorialPreviewAcknowledged: false,
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
      ? {
          ...state,
          battle: { ...state.battle, selectedTargetId: action.targetId },
          tutorialAcknowledgedTargetId:
            state.preferences.tutorial === 'active' && state.battle.questId === 'border_pack'
              ? action.targetId
              : state.tutorialAcknowledgedTargetId,
        }
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
    if (state.paused && state.battle.status === 'active') return state;
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
