import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type {
  GuildBattleState,
  GuildProfile,
  ItemChoice,
  QuestRewards,
} from '@expedition/shared-types';
import {
  advanceGuildBattle,
  applyQuestRewards,
  createSeededRandom,
  equipStoredItem,
  generateQuestRewards,
  resolveItemChoice,
  startGuildQuest,
  submitLeaderAction,
} from '@expedition/simulation-core';

export interface GuildRpgState {
  screen: 'guild' | 'battle' | 'rewards';
  profile: GuildProfile;
  battle?: GuildBattleState | undefined;
  rewards?: QuestRewards | undefined;
  speed: 1 | 2;
  resolvedItemIds: readonly string[];
  message: string;
}

export type GuildRpgAction =
  | { type: 'START_QUEST'; questId: string }
  | { type: 'TICK'; elapsedMs: number }
  | { type: 'SELECT_TARGET'; targetId: string }
  | { type: 'USE_SKILL'; skillId: string; targetId: string }
  | { type: 'TOGGLE_AUTO' }
  | { type: 'SET_SPEED'; speed: 1 | 2 }
  | { type: 'SET_LEADER'; adventurerId: string }
  | { type: 'EQUIP_STORED'; itemId: string; adventurerId: string }
  | { type: 'CHOOSE_ITEM'; itemId: string; choice: ItemChoice; adventurerId: string }
  | { type: 'RETURN_GUILD' };

function actionRandom(battle: GuildBattleState) {
  return createSeededRandom(`${battle.seed}:${battle.sequence}`);
}

function finishBattle(state: GuildRpgState, battle: GuildBattleState): GuildRpgState {
  if (battle.status !== 'victory') return { ...state, battle };
  const rewards = generateQuestRewards(
    state.profile,
    battle,
    GUILD_GAME_CONTENT,
    createSeededRandom(`${battle.seed}:loot`),
  );
  if (!rewards) return { ...state, battle };
  return {
    ...state,
    screen: 'rewards',
    battle,
    rewards,
    resolvedItemIds: [],
    profile: applyQuestRewards(state.profile, rewards, GUILD_GAME_CONTENT.quests),
    message: `遠征勝利，獲得 ${rewards.experience} 經驗與 ${rewards.gold} 金幣！`,
  };
}

export function guildRpgReducer(state: GuildRpgState, action: GuildRpgAction): GuildRpgState {
  if (action.type === 'START_QUEST') {
    return {
      ...state,
      screen: 'battle',
      battle: startGuildQuest(state.profile, action.questId, GUILD_GAME_CONTENT),
      rewards: undefined,
      resolvedItemIds: [],
      message: '遠征開始，等待行動量表蓄滿。',
    };
  }
  if (action.type === 'SET_SPEED') return { ...state, speed: action.speed };
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
    const battle = advanceGuildBattle(
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
