import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type {
  GuildBattleEvent,
  GuildBattleState,
  GuildProfile,
  HuntRewards,
} from '@expedition/shared-types';
import {
  chooseNextAdventurer,
  createSeededRandom,
  dismantleSkill,
  equipAdventurerSkill,
  equipStoredItem,
  forgeEquipmentItem,
  fuseSkills,
  isExecutionWindow,
  replaceFusedComponent,
  resetCurrentRoundOrder,
  resolveSkill,
  salvageSelectedEquipment,
  startGuildQuest,
  setRoundOrderCarry,
  toggleEquipmentItemFlag,
  type EquipmentItemFlag,
  type ForgeAction,
  type ForgeOptions,
} from '@expedition/simulation-core';

import type { FirstHuntCoachStep } from '../onboarding/first-hunt-coach';
import type { GuildPreferences, TutorialState } from '../preferences/guild-preferences';
import { createSkillEngineContent } from './create-skill-engine-content';
import { reduceHuntResult } from './reduce-hunt-result';

export type GuildPage = 'quest' | 'party' | 'skills' | 'equipment';
type SkillWorkspace = 'loadout' | 'fusion';
export interface GuildRpgState {
  screen: 'guild' | 'battle' | 'rewards';
  page: GuildPage;
  skillWorkspace: SkillWorkspace;
  profile: GuildProfile;
  preferences: GuildPreferences;
  tutorialStep: FirstHuntCoachStep;
  selectedHeroId: string;
  selectedSkillSlot: number;
  selectedFusionIds: readonly string[];
  selectedSalvageIds: readonly string[];
  lastFusedSkillId?: string;
  battle?: GuildBattleState | undefined;
  playbackStartBattle?: GuildBattleState | undefined;
  rewards?: HuntRewards | undefined;
  recentEvents: readonly GuildBattleEvent[];
  message: string;
}

export type GuildRpgAction =
  | { type: 'NAVIGATE'; page: GuildPage }
  | { type: 'SELECT_SKILL_WORKSPACE'; workspace: SkillWorkspace }
  | { type: 'SELECT_HERO'; adventurerId: string }
  | { type: 'SELECT_SKILL_SLOT'; slotIndex: number }
  | { type: 'EQUIP_SKILL'; skillId: string }
  | { type: 'MOVE_DEFAULT_HERO'; adventurerId: string; direction: -1 | 1 }
  | { type: 'TOGGLE_FUSION_SKILL'; skillId: string }
  | { type: 'FUSE_SELECTED' }
  | {
      type: 'REPLACE_FUSED_COMPONENT';
      fusedSkillId: string;
      componentIndex: number;
      replacementSkillId: string;
    }
  | {
      type: 'MOVE_FUSED_COMPONENT';
      fusedSkillId: string;
      componentIndex: number;
      direction: -1 | 1;
    }
  | { type: 'DISMANTLE_SKILL'; skillId: string }
  | { type: 'START_QUEST'; questId: string }
  | { type: 'SELECT_TARGET'; targetId: string }
  | { type: 'CHOOSE_NEXT_HERO'; adventurerId: string }
  | { type: 'RESET_CURRENT_ORDER' }
  | { type: 'SET_CARRY_ORDER'; enabled: boolean }
  | { type: 'USE_SKILL'; skillId: string; targetId: string }
  | { type: 'COLLECT_VICTORY' }
  | { type: 'EQUIP_REWARD_ITEM'; itemId: string; adventurerId: string }
  | { type: 'REPLAY_HUNT' }
  | { type: 'EQUIP_STORED'; itemId: string; adventurerId: string }
  | { type: 'FORGE_ITEM'; itemId: string; forgeAction: ForgeAction; options?: ForgeOptions }
  | { type: 'TOGGLE_ITEM_FLAG'; itemId: string; flag: EquipmentItemFlag }
  | { type: 'TOGGLE_SALVAGE_SELECTION'; itemId: string }
  | { type: 'SALVAGE_SELECTED' }
  | { type: 'GO_TO_EQUIPMENT' }
  | { type: 'GO_TO_FUSION' }
  | { type: 'RETURN_GUILD'; page?: GuildPage }
  | { type: 'ABANDON_HUNT' }
  | { type: 'SET_TUTORIAL'; tutorial: TutorialState };

const heroName = (id: string) =>
  GUILD_GAME_CONTENT.adventurers.find((hero) => hero.id === id)?.name ?? id;

const withTutorial = (
  state: GuildRpgState,
  expected: FirstHuntCoachStep,
  next: FirstHuntCoachStep,
) =>
  state.preferences.tutorial === 'active' && state.tutorialStep === expected
    ? { ...state, tutorialStep: next }
    : state;

const isBattleTutorialStep = (step: FirstHuntCoachStep) =>
  step === 'select_target' || step === 'collect_reward' || step.startsWith('relay_');

const finishBattle = (state: GuildRpgState, battle: GuildBattleState): GuildRpgState => {
  const result = reduceHuntResult(state.profile, battle, GUILD_GAME_CONTENT);
  if (!result) return { ...state, battle };
  return {
    ...state,
    screen: 'rewards',
    battle,
    rewards: result.rewards,
    profile: result.profile,
    tutorialStep: state.preferences.tutorial === 'active' ? 'equip_loot' : state.tutorialStep,
    message: result.message,
  };
};

export function guildRpgReducer(state: GuildRpgState, action: GuildRpgAction): GuildRpgState {
  if (action.type === 'SET_TUTORIAL') {
    return {
      ...state,
      preferences: { ...state.preferences, tutorial: action.tutorial },
      tutorialStep: action.tutorial === 'active' ? 'start_hunt' : 'complete',
    };
  }
  if (action.type === 'NAVIGATE' && state.screen === 'guild') {
    let next = {
      ...state,
      page: action.page,
      skillWorkspace:
        action.page === 'skills' && state.tutorialStep === 'inspect_skills'
          ? ('fusion' as const)
          : ('loadout' as const),
    };
    if (action.page === 'skills') next = withTutorial(next, 'inspect_skills', 'fuse_skill');
    return next;
  }
  if (action.type === 'SELECT_SKILL_WORKSPACE' && state.screen === 'guild') {
    return { ...state, skillWorkspace: action.workspace };
  }
  if (action.type === 'SELECT_HERO' && state.screen === 'guild') {
    if (!state.profile.party.some(({ definitionId }) => definitionId === action.adventurerId)) {
      return state;
    }
    return { ...state, selectedHeroId: action.adventurerId, selectedSkillSlot: 0 };
  }
  if (action.type === 'SELECT_SKILL_SLOT' && action.slotIndex >= 0 && action.slotIndex < 6) {
    return { ...state, selectedSkillSlot: action.slotIndex };
  }
  if (action.type === 'EQUIP_SKILL' && state.screen === 'guild') {
    const resolution = equipAdventurerSkill(
      state.profile,
      state.selectedHeroId,
      state.selectedSkillSlot,
      action.skillId,
      GUILD_GAME_CONTENT,
    );
    if (resolution.profile === state.profile) return { ...state, message: resolution.message };
    const index = state.profile.defaultOrder.indexOf(state.selectedHeroId);
    const nextHeroId = state.profile.defaultOrder[(index + 1) % state.profile.defaultOrder.length]!;
    const tutorialStep =
      state.tutorialStep === 'equip_fused' && action.skillId === state.lastFusedSkillId
        ? 'replay'
        : state.tutorialStep;
    return {
      ...state,
      profile: resolution.profile,
      selectedHeroId: nextHeroId,
      selectedSkillSlot: 0,
      tutorialStep,
      message: `${resolution.message} 下一位：${heroName(nextHeroId)}。`,
    };
  }
  if (action.type === 'MOVE_DEFAULT_HERO' && state.screen === 'guild') {
    const current = [...state.profile.defaultOrder];
    const from = current.indexOf(action.adventurerId);
    const to = from + action.direction;
    if (from < 0 || to < 0 || to >= current.length) return state;
    [current[from], current[to]] = [current[to]!, current[from]!];
    return {
      ...state,
      profile: { ...state.profile, defaultOrder: current },
      message: `預設順序已更新：${current.map(heroName).join(' → ')}。`,
    };
  }
  if (action.type === 'TOGGLE_FUSION_SKILL' && state.screen === 'guild') {
    const selected = state.selectedFusionIds.includes(action.skillId)
      ? state.selectedFusionIds.filter((id) => id !== action.skillId)
      : [...state.selectedFusionIds, action.skillId].slice(-3);
    return { ...state, selectedFusionIds: selected };
  }
  if (action.type === 'FUSE_SELECTED' && state.screen === 'guild') {
    const source = state.selectedFusionIds.map((id) =>
      state.profile.skillInventory.find((skill) => skill.id === id),
    );
    if (
      source.some((skill) => !skill || skill.stars !== 1) ||
      source.length < 2 ||
      source.length > 3
    ) {
      return { ...state, message: '請選擇兩或三張同屬性的一星技能。' };
    }
    const owned = source as Extract<(typeof source)[number], { stars: 1 }>[];
    try {
      const id = `fused:${state.profile.nextLootSeed}:${state.profile.progressionEvents.length + 1}`;
      const fused = fuseSkills(owned, id, `${heroName(state.selectedHeroId)}的融合技`);
      const sourceIds = new Set(owned.map((skill) => skill.id));
      return {
        ...state,
        profile: {
          ...state.profile,
          skillInventory: [
            ...state.profile.skillInventory.filter((skill) => !sourceIds.has(skill.id)),
            fused,
          ],
          progressionEvents: [
            ...state.profile.progressionEvents,
            {
              id: `fusion-${id}`,
              kind: 'fusion' as const,
              label: fused.name,
              detail: `${fused.stars} 星 · ${fused.components.map(({ triggerId }) => triggerId).join(' → ')}`,
            },
          ].slice(-20),
        },
        selectedFusionIds: [],
        lastFusedSkillId: fused.id,
        skillWorkspace: 'loadout',
        tutorialStep: state.tutorialStep === 'fuse_skill' ? 'equip_fused' : state.tutorialStep,
        message: `${fused.name}融合完成；現在把它裝進角色的六格技能。`,
      };
    } catch (error) {
      return { ...state, message: error instanceof Error ? error.message : '融合失敗。' };
    }
  }
  if (action.type === 'DISMANTLE_SKILL' && state.screen === 'guild') {
    const fused = state.profile.skillInventory.find(
      (skill) => skill.id === action.skillId && skill.stars > 1,
    );
    if (!fused || fused.stars === 1) return state;
    const restored = dismantleSkill(fused);
    return {
      ...state,
      profile: {
        ...state.profile,
        skillInventory: [
          ...state.profile.skillInventory.filter(({ id }) => id !== fused.id),
          ...restored,
        ],
      },
      message: `${fused.name}已無損拆解為 ${restored.length} 張一星技能。`,
    };
  }
  if (action.type === 'REPLACE_FUSED_COMPONENT' && state.screen === 'guild') {
    const fused = state.profile.skillInventory.find(
      (skill) => skill.id === action.fusedSkillId && skill.stars > 1,
    );
    const replacement = state.profile.skillInventory.find(
      (skill) => skill.id === action.replacementSkillId && skill.stars === 1,
    );
    if (!fused || fused.stars === 1 || !replacement || replacement.stars !== 1) {
      return { ...state, message: '找不到可替換的融合元件。' };
    }
    try {
      const result = replaceFusedComponent(fused, action.componentIndex, replacement);
      return {
        ...state,
        profile: {
          ...state.profile,
          skillInventory: [
            ...state.profile.skillInventory.filter(
              ({ id }) => id !== fused.id && id !== replacement.id,
            ),
            result.skill,
            result.removedSkill,
          ],
        },
        message: `${fused.name}第 ${action.componentIndex + 1} 段已替換；原技能完整退回技能庫。`,
      };
    } catch (error) {
      return { ...state, message: error instanceof Error ? error.message : '元件替換失敗。' };
    }
  }
  if (action.type === 'MOVE_FUSED_COMPONENT' && state.screen === 'guild') {
    const fused = state.profile.skillInventory.find(
      (skill) => skill.id === action.fusedSkillId && skill.stars > 1,
    );
    if (!fused || fused.stars === 1) return state;
    const to = action.componentIndex + action.direction;
    if (to < 0 || to >= fused.sourceSkills.length) return state;
    const sources = [...fused.sourceSkills];
    [sources[action.componentIndex], sources[to]] = [sources[to]!, sources[action.componentIndex]!];
    const reordered = fuseSkills(sources, fused.id, fused.name);
    return {
      ...state,
      profile: {
        ...state.profile,
        skillInventory: state.profile.skillInventory.map((skill) =>
          skill.id === fused.id ? reordered : skill,
        ),
      },
      message: `${fused.name}的結算順序已更新。`,
    };
  }
  if (action.type === 'START_QUEST' && state.screen === 'guild') {
    try {
      const battle = startGuildQuest(state.profile, action.questId, GUILD_GAME_CONTENT);
      const completingReplay = state.tutorialStep === 'replay';
      return {
        ...state,
        screen: 'battle',
        battle: {
          ...battle,
          roundOrder: {
            ...battle.roundOrder!,
            defaultOrder: state.profile.defaultOrder,
            currentOrder: state.profile.defaultOrder,
          },
        },
        rewards: undefined,
        playbackStartBattle: undefined,
        recentEvents: [],
        tutorialStep:
          state.tutorialStep === 'start_hunt'
            ? 'select_target'
            : completingReplay
              ? 'complete'
              : state.tutorialStep,
        preferences: completingReplay
          ? { ...state.preferences, tutorial: 'complete' }
          : state.preferences,
        message: `進入${GUILD_GAME_CONTENT.quests.find(({ id }) => id === action.questId)?.name ?? action.questId}；選目標後由${heroName(state.profile.defaultOrder[0]!)}出招。`,
      };
    } catch (error) {
      return { ...state, message: error instanceof Error ? error.message : '無法開始任務。' };
    }
  }
  if (action.type === 'SELECT_TARGET' && state.screen === 'battle' && state.battle) {
    const valid = state.battle.units.some(
      (unit) => unit.id === action.targetId && unit.side === 'enemies' && unit.currentHp > 0,
    );
    return valid
      ? withTutorial(
          { ...state, battle: { ...state.battle, selectedTargetId: action.targetId } },
          'select_target',
          'relay_1',
        )
      : state;
  }
  if (action.type === 'CHOOSE_NEXT_HERO' && state.screen === 'battle' && state.battle?.roundOrder) {
    try {
      const living = state.battle.units
        .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
        .map(({ id }) => id);
      return {
        ...state,
        battle: {
          ...state.battle,
          roundOrder: chooseNextAdventurer(state.battle.roundOrder, action.adventurerId, living),
        },
        message: `${heroName(action.adventurerId)}已調整為本回合下一位。`,
      };
    } catch (error) {
      return { ...state, message: error instanceof Error ? error.message : '無法調整順序。' };
    }
  }
  if (
    action.type === 'RESET_CURRENT_ORDER' &&
    state.screen === 'battle' &&
    state.battle?.roundOrder
  ) {
    const living = state.battle.units
      .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
      .map(({ id }) => id);
    return {
      ...state,
      battle: {
        ...state.battle,
        roundOrder: resetCurrentRoundOrder(state.battle.roundOrder, living),
      },
      message: '本回合剩餘角色已恢復預設接力順序。',
    };
  }
  if (action.type === 'SET_CARRY_ORDER' && state.screen === 'battle' && state.battle?.roundOrder) {
    return {
      ...state,
      battle: {
        ...state.battle,
        roundOrder: setRoundOrderCarry(state.battle.roundOrder, action.enabled),
      },
      message: action.enabled ? '目前接力順序會沿用到下一回合。' : '下一回合會恢復戰前預設順序。',
    };
  }
  if (action.type === 'USE_SKILL' && state.screen === 'battle' && state.battle) {
    try {
      const actorId = state.battle.roundOrder?.activeAdventurerId;
      if (!actorId) return state;
      const result = resolveSkill({
        battle: state.battle,
        actorId,
        skillId: action.skillId,
        targetId: action.targetId,
        content: createSkillEngineContent(state.profile),
      });
      const relayStep = state.tutorialStep.match(/^relay_([1-6])$/);
      const relayNumber = relayStep ? Number(relayStep[1]) : undefined;
      const tutorialStep =
        state.preferences.tutorial === 'active' && relayNumber
          ? relayNumber === 6
            ? 'collect_reward'
            : (`relay_${relayNumber + 1}` as FirstHuntCoachStep)
          : state.tutorialStep;
      const next = {
        ...state,
        battle: result.battle,
        playbackStartBattle: state.battle,
        recentEvents: result.events,
        tutorialStep,
        message: result.events.at(-1)?.message ?? '技能已結算。',
      };
      return result.battle.status === 'victory'
        ? {
            ...next,
            message: '第六棒終結完成。確認戰果後，收下全部戰利品。',
          }
        : isExecutionWindow(result.battle)
          ? {
              ...next,
              message: `敵軍已破勢；由${heroName(result.battle.roundOrder!.activeAdventurerId!)}選擇第六棒終結方式。`,
            }
          : next;
    } catch (error) {
      return { ...state, message: error instanceof Error ? error.message : '技能無法施放。' };
    }
  }
  if (
    action.type === 'COLLECT_VICTORY' &&
    state.screen === 'battle' &&
    state.battle?.status === 'victory'
  ) {
    return finishBattle(state, state.battle);
  }
  if (action.type === 'EQUIP_REWARD_ITEM' && state.screen === 'rewards') {
    const result = equipStoredItem(state.profile, action.itemId, action.adventurerId);
    return {
      ...state,
      profile: result.profile,
      tutorialStep:
        result.profile !== state.profile && state.tutorialStep === 'equip_loot'
          ? 'forge_loot'
          : state.tutorialStep,
      message:
        result.profile !== state.profile
          ? `${result.message} 可繼續查看全部掉落，或前往裝備頁強化。`
          : result.message,
    };
  }
  if (action.type === 'REPLAY_HUNT' && state.screen === 'rewards' && state.rewards) {
    if (state.preferences.tutorial === 'active' && state.tutorialStep !== 'complete') {
      return { ...state, message: '先完成第一次裝備與技能配置，之後即可從這裡直接再戰。' };
    }
    try {
      const battle = startGuildQuest(state.profile, state.rewards.questId, GUILD_GAME_CONTENT);
      return {
        ...state,
        screen: 'battle',
        battle: {
          ...battle,
          roundOrder: {
            ...battle.roundOrder!,
            defaultOrder: state.profile.defaultOrder,
            currentOrder: state.profile.defaultOrder,
          },
        },
        playbackStartBattle: undefined,
        rewards: undefined,
        recentEvents: [],
        message: '再次出征；鎖定目標並開始六人接力。',
      };
    } catch (error) {
      return { ...state, message: error instanceof Error ? error.message : '無法再次出征。' };
    }
  }
  if (action.type === 'EQUIP_STORED' && state.screen === 'guild') {
    const result = equipStoredItem(state.profile, action.itemId, action.adventurerId);
    return {
      ...state,
      profile: result.profile,
      selectedSalvageIds: state.selectedSalvageIds.filter((id) => id !== action.itemId),
      tutorialStep:
        result.profile !== state.profile && state.tutorialStep === 'equip_loot'
          ? 'forge_loot'
          : state.tutorialStep,
      message: result.message,
    };
  }
  if (action.type === 'TOGGLE_ITEM_FLAG' && state.screen === 'guild') {
    const result = toggleEquipmentItemFlag(state.profile, action.itemId, action.flag);
    return {
      ...state,
      profile: result.profile,
      selectedSalvageIds:
        result.profile !== state.profile
          ? state.selectedSalvageIds.filter((id) => id !== action.itemId)
          : state.selectedSalvageIds,
      message: result.message,
    };
  }
  if (action.type === 'TOGGLE_SALVAGE_SELECTION' && state.screen === 'guild') {
    const item = state.profile.inventory.find(({ id }) => id === action.itemId);
    if (!item || item.locked || item.favorite) {
      return { ...state, message: '鎖定或收藏裝備不會加入分解清單。' };
    }
    const selected = state.selectedSalvageIds.includes(action.itemId);
    return {
      ...state,
      selectedSalvageIds: selected
        ? state.selectedSalvageIds.filter((id) => id !== action.itemId)
        : [...state.selectedSalvageIds, action.itemId],
      message: `${item.name}${selected ? '移出' : '加入'}批次分解清單。`,
    };
  }
  if (action.type === 'SALVAGE_SELECTED' && state.screen === 'guild') {
    const result = salvageSelectedEquipment(
      state.profile,
      state.selectedSalvageIds,
      GUILD_GAME_CONTENT,
    );
    return {
      ...state,
      profile: result.profile,
      selectedSalvageIds: [],
      message: result.message,
    };
  }
  if (action.type === 'FORGE_ITEM' && state.screen === 'guild') {
    const result = forgeEquipmentItem(
      state.profile,
      action.itemId,
      action.forgeAction,
      GUILD_GAME_CONTENT,
      createSeededRandom(
        `forge:${state.profile.forgeSequence}:${action.itemId}:${action.forgeAction}`,
      ),
      action.options,
    );
    const completedCoachForge =
      result.profile !== state.profile && state.tutorialStep === 'forge_loot';
    return {
      ...state,
      profile: result.profile,
      page: state.page,
      tutorialStep: completedCoachForge ? 'inspect_skills' : state.tutorialStep,
      message: completedCoachForge
        ? `${result.message} 接著打開技能頁，查看這次取得的新技能。`
        : result.message,
    };
  }
  if (action.type === 'GO_TO_EQUIPMENT' && state.screen === 'rewards') {
    return {
      ...state,
      screen: 'guild',
      page: 'equipment',
      rewards: undefined,
      tutorialStep: state.tutorialStep,
      message: '所有掉落已收入背包；先把一件新裝備穿到目前角色身上。',
    };
  }
  if (action.type === 'GO_TO_FUSION' && state.screen === 'rewards') {
    if (state.preferences.tutorial === 'active' && state.tutorialStep === 'equip_loot') {
      return {
        ...state,
        message: '先穿上一件新裝備，完成後就會開放技能融合。',
      };
    }
    return {
      ...state,
      screen: 'guild',
      page: 'skills',
      skillWorkspace: 'fusion',
      rewards: undefined,
      tutorialStep: state.tutorialStep === 'equip_loot' ? 'fuse_skill' : state.tutorialStep,
      message: '戰利品已全部收入背包與技能庫；選兩張同屬性一星技能融合。',
    };
  }
  if (action.type === 'RETURN_GUILD') {
    return {
      ...state,
      screen: 'guild',
      page: action.page ?? 'quest',
      skillWorkspace: 'loadout',
      battle: undefined,
      playbackStartBattle: undefined,
      rewards: undefined,
      recentEvents: [],
      message: '已返回整備介面，所有掉落均已保留。',
    };
  }
  if (action.type === 'ABANDON_HUNT' && state.screen === 'battle') {
    const resetTutorial =
      state.preferences.tutorial === 'active' && isBattleTutorialStep(state.tutorialStep);
    return {
      ...state,
      screen: 'guild',
      page: 'quest',
      battle: undefined,
      playbackStartBattle: undefined,
      recentEvents: [],
      tutorialStep: resetTutorial ? 'start_hunt' : state.tutorialStep,
      message: '已撤離，整備進度保持不變。',
    };
  }
  return state;
}
