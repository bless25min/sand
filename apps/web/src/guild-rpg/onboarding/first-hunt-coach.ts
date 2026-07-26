import type { TutorialState } from '../preferences/guild-preferences';

export const TUTORIAL_STEPS = [
  'inspect_party',
  'select_hero',
  'inspect_skills',
  'equip_skill',
  'inspect_equipment',
  'start_hunt',
  'select_target',
  'use_skill',
  'reorder',
  'collect_reward',
  'equip_loot',
  'forge_loot',
  'fuse_skill',
  'equip_fused',
  'replay',
  'complete',
] as const;

export type FirstHuntCoachStep = (typeof TUTORIAL_STEPS)[number];

export interface FirstHuntCoach {
  step: FirstHuntCoachStep;
  stepNumber: number;
  stepTotal: number;
  title: string;
  message: string;
  focusId: string;
}

const COPY: Readonly<
  Record<
    Exclude<FirstHuntCoachStep, 'complete'>,
    Omit<FirstHuntCoach, 'step' | 'stepNumber' | 'stepTotal'>
  >
> = {
  inspect_party: {
    title: '先看完整隊伍',
    message: '點「隊伍」，確認六名角色與預設出手順序。',
    focusId: 'nav:party',
  },
  select_hero: {
    title: '選一名角色',
    message: '點任一角色；目前操作角色會持續高亮並顯示名字。',
    focusId: 'hero:first',
  },
  inspect_skills: {
    title: '打開技能頁',
    message: '點「技能」，查看目前角色的六格技能與所有可選技能。',
    focusId: 'nav:skills',
  },
  equip_skill: {
    title: '選擇技能',
    message: '先點六格中的一格，再從技能庫裝備一招；完成後會自動切到下一位角色。',
    focusId: 'skill:equip',
  },
  inspect_equipment: {
    title: '打開裝備頁',
    message: '點「裝備」，查看武器、護甲、飾品、內嵌核心與鍛造。',
    focusId: 'nav:equipment',
  },
  start_hunt: {
    title: '進入第一場狩獵',
    message: '回到「任務」，閱讀公開掉落池後開始邊境狼群。',
    focusId: 'hunt:start',
  },
  select_target: {
    title: '選擇攻擊目標',
    message: '點一張仍存活的敵人卡；金框會顯示目前鎖定目標。',
    focusId: 'target:first',
  },
  use_skill: {
    title: '讓當前角色立即出招',
    message: '下方六招全部可用。點一招就立刻結算，不必等全隊設定完成。',
    focusId: 'battle:skill',
  },
  reorder: {
    title: '改變本回合下一位',
    message: '點一名尚未行動的角色，把他調到下一位並立即看見接力變化。',
    focusId: 'order:next',
  },
  collect_reward: {
    title: '讀完這次掉落',
    message: '勝利會同時取得素材、帶核心裝備與技能；先穿上其中一件裝備。',
    focusId: 'reward:equipment',
  },
  equip_loot: {
    title: '穿上第一件屬性裝備',
    message: '點戰利品的「裝備給角色」；原裝備會安全回到背包，不會消失。',
    focusId: 'equipment:equip',
  },
  forge_loot: {
    title: '做一次範圍內校準',
    message: '點已裝備物品的「校準」；只會在公開範圍內重骰，不會無限線性升級。',
    focusId: 'equipment:forge',
  },
  fuse_skill: {
    title: '融合相同屬性技能',
    message: '選兩張同屬性一星技能融合；每個元件的數值與觸發都會保留。',
    focusId: 'fusion:create',
  },
  equip_fused: {
    title: '裝備融合技能',
    message: '把剛融合的技能放進目前角色六格之一，讓組合正式進入戰場。',
    focusId: 'skill:equip-fused',
  },
  replay: {
    title: '帶新組合重刷',
    message: '回任務重刷第一關，驗證新技能與裝備核心形成更長接力。',
    focusId: 'hunt:replay',
  },
};

export function createFirstHuntCoach(
  tutorial: TutorialState,
  step: FirstHuntCoachStep,
  context: { heroName?: string } = {},
): FirstHuntCoach | undefined {
  if (tutorial !== 'active' || step === 'complete') return undefined;
  const copy = COPY[step];
  return {
    step,
    stepNumber: TUTORIAL_STEPS.indexOf(step) + 1,
    stepTotal: TUTORIAL_STEPS.length - 1,
    ...copy,
    ...(step === 'equip_skill' && context.heroName
      ? {
          title: `替${context.heroName}選擇技能`,
          message: `先點${context.heroName}的六格之一，再從技能庫裝備一招；完成後會自動切到下一位角色。`,
        }
      : {}),
  };
}

export const isFirstHuntCoachFocus = (
  tutorial: TutorialState,
  step: FirstHuntCoachStep,
  focusId: string,
) => createFirstHuntCoach(tutorial, step)?.focusId === focusId;
