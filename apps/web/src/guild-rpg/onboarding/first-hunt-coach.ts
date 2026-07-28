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
    title: '第 1 棒',
    message: '確認目前角色，點一次技能查看精準傷害；再點技能或戰場敵人即可施放。',
    focusId: 'battle:skill',
  },
  relay_2: {
    title: '第 2 棒',
    message: '第二位角色已接力。觀察上一招留下的屬性與狀態，再選六個技能之一。',
    focusId: 'battle:skill',
  },
  relay_3: {
    title: '第 3 棒',
    message: '連技開始升溫。綠框代表追加條件已成立，仍可自由選擇任何技能。',
    focusId: 'battle:skill',
  },
  relay_4: {
    title: '第 4 棒',
    message: '連鎖效果正在累積；也可點上方尚未行動的角色改成下一棒。',
    focusId: 'battle:skill',
  },
  relay_5: {
    title: '第 5 棒',
    message: '進入終結準備。選擇能消耗疊層、擴散或多段命中的技能。',
    focusId: 'battle:skill',
  },
  relay_6: {
    title: '第 6 棒',
    message: '最後一位角色會釋放本回合終結演出；選一招完成六人接力。',
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
  const relay = step.startsWith('relay_') ? Number(step.slice('relay_'.length)) : undefined;
  return {
    step,
    stepNumber: TUTORIAL_STEPS.indexOf(step) + 1,
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
          message:
            relay === 1
              ? `目前由${context.heroName}出手。點一次六個技能中的任一招預覽，再點技能或敵人施放。`
              : `${context.heroName}已接棒。先看目標狀態與預計結果，再選技能延續第 ${relay} 段連技。`,
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
