import type { TutorialState } from '../preferences/guild-preferences';

type FirstHuntCoachStep =
  | 'build'
  | 'quest'
  | 'start'
  | 'target'
  | 'brace'
  | 'riposte'
  | 'sweep'
  | 'recover'
  | 'execution'
  | 'preview'
  | 'release'
  | 'playback'
  | 'loot'
  | 'return'
  | 'power-build'
  | 'forge'
  | 'next-hunt'
  | 'replay'
  | 'complete';

export interface CoachInput {
  tutorial: TutorialState;
  screen: 'guild' | 'battle' | 'playback' | 'rewards';
  questId?: string;
  selectedBuildId: string;
  selectedTargetId?: string;
  acknowledgedTargetId?: string;
  focusedBuildId?: string;
  forgeSequence?: number;
  draftCardIds: readonly string[];
  previewEventCount: number;
  rewardItemCount: number;
  resolvedItemCount: number;
  hasBorderRecord: boolean;
  replaying: boolean;
  previewAcknowledged: boolean;
  bossExecutionOpen: boolean;
  mobilePage?: 'build' | 'quest' | 'party' | 'inventory';
}

export interface FirstHuntCoach {
  step: FirstHuntCoachStep;
  paused: boolean;
  phaseLabel: string;
  stepNumber: number;
  stepTotal: number;
  title: string;
  message: string;
  focusId?: string;
  expectedCardId?: string;
}

const OPENING_SIGNATURE = ['brann_brace', 'brann_riposte', 'brann_sweep'] as const;
const EXECUTION_SIGNATURE = [
  'brann_brace',
  'brann_riposte',
  'brann_shield_crash',
  'brann_sweep',
  'brann_fortress_breaker',
] as const;

function signatureStep(input: CoachInput): FirstHuntCoach {
  const signature = input.bossExecutionOpen ? EXECUTION_SIGNATURE : OPENING_SIGNATURE;
  const stepTotal = signature.length + 3;
  const expectedTargetId = input.bossExecutionOpen ? 'wolf_alpha' : 'wolf_scout';
  if (
    input.selectedTargetId !== expectedTargetId ||
    input.acknowledgedTargetId !== expectedTargetId
  ) {
    return {
      step: 'target',
      paused: true,
      phaseLabel: '軍令引導',
      stepNumber: 1,
      stepTotal,
      title: input.bossExecutionOpen ? '鎖定灰牙首領' : '鎖定灰牙斥候',
      message: input.bossExecutionOpen
        ? '護衛已倒。鎖定灰牙首領，進入孤王處決窗。'
        : '先鎖定灰牙斥候，打開狼群的第一個缺口。',
      focusId: `action:${expectedTargetId}`,
    };
  }
  const divergentIndex = input.draftCardIds
    .slice(0, signature.length)
    .findIndex((cardId, index) => cardId !== signature[index]);
  if (divergentIndex >= 0) {
    return {
      step: 'recover',
      paused: true,
      phaseLabel: '軍令引導',
      stepNumber: Math.min(input.draftCardIds.length + 1, stepTotal),
      stepTotal,
      title: '撤銷錯誤卡',
      message: '這張卡偏離盾牆蓄爆。先撤銷到上一步，推薦卡就會重新回到主操作位。',
      focusId: 'action:undo',
    };
  }
  const nextIndex = input.draftCardIds.length;
  if (nextIndex < signature.length) {
    const expectedCardId = signature[nextIndex]!;
    const names = input.bossExecutionOpen
      ? ['架盾', '盾後反擊', '盾擊破勢', '破陣橫掃', '城塞粉碎']
      : ['架盾', '盾後反擊', '破陣橫掃'];
    return {
      step: input.bossExecutionOpen
        ? 'execution'
        : nextIndex === 0
          ? 'brace'
          : nextIndex === 1
            ? 'riposte'
            : 'sweep',
      paused: true,
      phaseLabel: '軍令引導',
      stepNumber: nextIndex + 2,
      stepTotal,
      title: `打出${names[nextIndex]}`,
      expectedCardId,
      message: input.bossExecutionOpen
        ? `處決鏈 ${nextIndex + 1}/${signature.length}：選 ${names[nextIndex]}，把孤王一路壓進最終爆發。`
        : `下一張選 ${names[nextIndex]}，讓盾牆蓄爆沿著因果鏈接起來。`,
      focusId: `action:${expectedCardId}`,
    };
  }
  if (!input.previewAcknowledged) {
    return {
      step: 'preview',
      paused: true,
      phaseLabel: '軍令引導',
      stepNumber: stepTotal - 1,
      stepTotal,
      title: '確認軍令預演',
      message: `先讀一次預演：${input.previewEventCount} 個事件會依序堆疊、觸發、擊破。確認後再釋放。`,
      focusId: 'action:release',
    };
  }
  return {
    step: 'release',
    paused: true,
    phaseLabel: '軍令引導',
    stepNumber: stepTotal,
    stepTotal,
    title: '釋放完整軍令',
    message: `預演已展開 ${input.previewEventCount} 個事件。釋放軍令，讓整條引擎一次爆完。`,
    focusId: 'action:release',
  };
}

export function createFirstHuntCoach(input: CoachInput): FirstHuntCoach | undefined {
  if (input.tutorial !== 'active') return undefined;
  if (input.screen !== 'guild' && input.questId !== 'border_pack') {
    return undefined;
  }
  if (input.screen === 'guild') {
    if (input.hasBorderRecord) {
      if (!input.replaying) {
        if (input.selectedBuildId !== 'ricochet') {
          const onBuildPage = input.mobilePage === 'build';
          const focusedOnRicochet = input.focusedBuildId === 'ricochet';
          return {
            step: 'power-build',
            paused: false,
            phaseLabel: '力量成長',
            stepNumber: 1,
            stepTotal: 3,
            title: focusedOnRicochet ? '啟動殲滅彈射' : '找到殲滅彈射',
            message: focusedOnRicochet
              ? '啟動殲滅彈射，讓每次命中分岔成覆蓋全場的追擊。'
              : '切到殲滅彈射；剛取得的規則會讓下一場的命中一路跳遍敵群。',
            focusId: !onBuildPage
              ? 'tab:build'
              : focusedOnRicochet
                ? 'action:activate-build'
                : 'action:next-build',
          };
        }
        if ((input.forgeSequence ?? 0) === 0) {
          const onInventoryPage = input.mobilePage === 'inventory';
          return {
            step: 'forge',
            paused: false,
            phaseLabel: '力量成長',
            stepNumber: 2,
            stepTotal: 3,
            title: onInventoryPage ? '點燃第一次鍛造' : '前往鍛造工坊',
            message: '完成一次結果可預見的力量強化，把剛拿到的戰利品再推高一階。',
            focusId: onInventoryPage ? 'action:open-forge' : 'tab:inventory',
          };
        }
        const onQuestPage = input.mobilePage === 'quest';
        return {
          step: 'next-hunt',
          paused: false,
          phaseLabel: '力量成長',
          stepNumber: 3,
          stepTotal: 3,
          title: onQuestPage ? '帶新引擎出發' : '前往下一場狩獵',
          message: 'Build 與裝備都已升級。出發下一戰，親眼看見力量成長。',
          focusId: onQuestPage ? 'action:start-quest' : 'tab:quest',
        };
      }
      const onQuestPage = input.mobilePage === 'quest';
      return {
        step: 'replay',
        paused: false,
        phaseLabel: '教學重播',
        stepNumber: 1,
        stepTotal: 1,
        title: input.replaying ? '再次進入邊境狼群' : '首次狩獵已完成',
        message: input.replaying
          ? '教學重播已待命。再次進入邊境狼群，完成整條殲滅鏈。'
          : '你可以隨時從設定重播完整教學。',
        ...(input.replaying ? { focusId: onQuestPage ? 'action:start-quest' : 'tab:quest' } : {}),
      };
    }
    if (input.selectedBuildId !== 'retaliation') {
      return {
        step: 'build',
        paused: false,
        phaseLabel: '新手引導',
        stepNumber: 1,
        stepTotal: 2,
        title: '切回反擊壁壘',
        message: '切回反擊壁壘，完成第一條盾牆蓄爆路線。',
        focusId: input.mobilePage === 'build' ? 'action:activate-build' : 'tab:build',
      };
    }
    const onQuestPage = input.mobilePage === 'quest';
    return {
      step: onQuestPage ? 'start' : 'quest',
      paused: false,
      phaseLabel: '新手引導',
      stepNumber: onQuestPage ? 2 : 1,
      stepTotal: 2,
      title: onQuestPage ? '出發邊境狼群' : '前往第一個任務',
      message: onQuestPage
        ? '情報先放一邊，按下開始遠征就會進入停時教學戰。'
        : '反擊壁壘已就緒。現在只要切到任務分頁。',
      focusId: onQuestPage ? 'action:start-quest' : 'tab:quest',
    };
  }
  if (input.screen === 'playback') {
    return {
      step: 'playback',
      paused: false,
      phaseLabel: '軍令演出',
      stepNumber: 1,
      stepTotal: 1,
      title: '觀看因果鏈爆發',
      message: '觀看因果鏈逐段升級；也可以跳過並直接落在完整高潮。',
    };
  }
  if (input.screen === 'rewards') {
    const stepTotal = input.rewardItemCount + 1;
    return input.resolvedItemCount < input.rewardItemCount
      ? {
          step: 'loot',
          paused: false,
          phaseLabel: '戰利品引導',
          stepNumber: input.resolvedItemCount + 1,
          stepTotal,
          title: `處理第 ${input.resolvedItemCount + 1} 件戰利品`,
          message: '先使用推薦裝備者，讓新規則立刻加入 Build。',
          focusId: 'action:equip',
        }
      : {
          step: 'return',
          paused: false,
          phaseLabel: '戰利品引導',
          stepNumber: stepTotal,
          stepTotal,
          title: '返回公會',
          message: '戰利品已處理完成，返回公會準備重刷。',
          focusId: 'action:return-guild',
        };
  }
  return signatureStep(input);
}
