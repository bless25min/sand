import type { TutorialState } from '../preferences/guild-preferences';

export const TUTORIAL_STEPS = [
  'start_hunt',
  'select_target',
  'relay_1',
  'relay_2',
  'relay_3',
  'relay_4',
  'relay_5',
  'relay_6',
  'collect_reward',
  'equip_loot',
  'forge_loot',
  'inspect_skills',
  'equip_skill',
  'replay',
  'complete',
] as const;

type LegacyFirstHuntCoachStep = 'fuse_skill' | 'equip_fused';
export type FirstHuntCoachStep = (typeof TUTORIAL_STEPS)[number] | LegacyFirstHuntCoachStep;

export interface FirstHuntCoach {
  step: FirstHuntCoachStep;
  stepNumber: number;
  stepTotal: number;
  title: string;
  message: string;
  focusId: string;
}

export interface FirstHuntCoachContext {
  heroName?: string;
  surface?: 'guild' | 'rewards';
  battleStatus?: 'active' | 'victory' | 'defeat' | undefined;
}

const COPY: Readonly<
  Record<
    Exclude<FirstHuntCoachStep, 'complete'>,
    Omit<FirstHuntCoach, 'step' | 'stepNumber' | 'stepTotal'>
  >
> = {
  start_hunt: {
    title: '開始第一場教學戰',
    message: '先親手完成六人接力；勝利後再學裝備、技能與刷寶養成。',
    focusId: 'hunt:start',
  },
  select_target: {
    title: '選擇攻擊目標',
    message: '直接點戰場上仍存活的敵人；角色身上的金色光圈會顯示目前目標。',
    focusId: 'target:first',
  },
  relay_1: {
    title: '先留下一個接力條件',
    message: '點技能預演：小傷害會留下狀態或強化，讓下一棒有事可接。',
    focusId: 'battle:skill',
  },
  relay_2: {
    title: '找亮起的技能節點',
    message: '上一棒建立的條件會讓節點亮起；選亮起的招，把小效果接成追加事件。',
    focusId: 'battle:skill',
  },
  relay_3: {
    title: '看條件如何變成效果',
    message: '亮節點會依序變成追擊、反應或路由；暗節點仍可看見缺少哪個狀態。',
    focusId: 'battle:skill',
  },
  relay_4: {
    title: '改選能延續的角色',
    message: '戰場上發光的隊員已有可接技能；也可點其他未行動角色改變順序。',
    focusId: 'battle:skill',
  },
  relay_5: {
    title: '把累積資源轉成事件',
    message: '優先選消耗層數、擴散或連鎖技能；每層會成為獨立命中。',
    focusId: 'battle:skill',
  },
  relay_6: {
    title: '釋放真實累積的終結',
    message: '最後一棒只結算本輪真正建立的因果，不會憑空乘上假倍率。',
    focusId: 'battle:skill',
  },
  collect_reward: {
    title: '接力完成，收下戰利品',
    message: '戰場會保留最後爆發結果；確認後一次取得素材、裝備與技能。',
    focusId: 'battle:collect',
  },
  equip_loot: {
    title: '穿上第一件屬性裝備',
    message: '先前往裝備頁，再把第一件掉落裝備穿給目前角色。',
    focusId: 'reward:equipment',
  },
  forge_loot: {
    title: '做一次範圍內校準',
    message: '點已裝備物品的「校準」；只會在公開範圍內重骰，不會無限線性升級。',
    focusId: 'equipment:forge',
  },
  inspect_skills: {
    title: '打開技能配置',
    message: '點「技能」，查看目前角色的六格技能與這次獲得的新組合。',
    focusId: 'nav:skills',
  },
  equip_skill: {
    title: '把新技能換入六格',
    message: '選一個技能格，再把本次掉落技能裝上；累積兩張同屬性技能後即可融合。',
    focusId: 'skill:equip-new',
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
  context: FirstHuntCoachContext = {},
): FirstHuntCoach | undefined {
  if (tutorial !== 'active' || step === 'complete') return undefined;
  const copy = COPY[step];
  const currentStep =
    step === 'fuse_skill' || step === 'equip_fused' ? ('equip_skill' as const) : step;
  const relay = step.startsWith('relay_') ? Number(step.slice('relay_'.length)) : undefined;
  return {
    step,
    stepNumber: TUTORIAL_STEPS.indexOf(currentStep) + 1,
    stepTotal: TUTORIAL_STEPS.length - 1,
    ...copy,
    ...(step === 'equip_loot' && context.surface === 'guild'
      ? {
          title: '穿上第一件屬性裝備',
          message: '從下方背包找到剛取得的裝備，點「裝備給角色」。',
          focusId: 'equipment:equip',
        }
      : {}),
    ...(step === 'collect_reward' && context.battleStatus === 'active'
      ? {
          title: '自由接力，殲滅剩餘敵人',
          message: '六棒教學已完成。繼續從目前角色的六個技能中選招，直到敵人全滅。',
          focusId: 'battle:skill',
        }
      : {}),
    ...(relay && context.heroName
      ? {
          title: `第 ${relay} 棒：${context.heroName}`,
          message: `${context.heroName}出手。${COPY[`relay_${relay}` as keyof typeof COPY].message}`,
        }
      : {}),
  };
}

export const isFirstHuntCoachFocus = (
  tutorial: TutorialState,
  step: FirstHuntCoachStep,
  focusId: string,
  context: FirstHuntCoachContext = {},
) => createFirstHuntCoach(tutorial, step, context)?.focusId === focusId;
