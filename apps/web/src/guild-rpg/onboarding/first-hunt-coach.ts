import type { TutorialState } from '../preferences/guild-preferences';

export type FirstHuntCoachStep =
  | 'build'
  | 'target'
  | 'brace'
  | 'riposte'
  | 'sweep'
  | 'release'
  | 'playback'
  | 'loot'
  | 'return'
  | 'replay'
  | 'complete';

export interface CoachInput {
  tutorial: TutorialState;
  screen: 'guild' | 'battle' | 'playback' | 'rewards';
  questId?: string;
  selectedBuildId: string;
  selectedTargetId?: string;
  draftCardIds: readonly string[];
  previewEventCount: number;
  rewardItemCount: number;
  resolvedItemCount: number;
  hasBorderRecord: boolean;
}

export interface FirstHuntCoach {
  step: FirstHuntCoachStep;
  paused: boolean;
  message: string;
  expectedCardId?: string;
  completeTutorial?: true;
}

const SIGNATURE = ['brann_brace', 'brann_riposte', 'brann_sweep'] as const;

function signatureStep(input: CoachInput): FirstHuntCoach {
  if (input.selectedTargetId !== 'wolf_scout') {
    return { step: 'target', paused: true, message: '先鎖定灰牙斥候，打開狼群的第一個缺口。' };
  }
  const nextIndex = input.draftCardIds.length;
  if (nextIndex < SIGNATURE.length) {
    const expectedCardId = SIGNATURE[nextIndex]!;
    const names = ['架盾', '盾後反擊', '破陣橫掃'];
    return {
      step: nextIndex === 0 ? 'brace' : nextIndex === 1 ? 'riposte' : 'sweep',
      paused: true,
      expectedCardId,
      message: `下一張選 ${names[nextIndex]}，讓盾牆蓄爆沿著因果鏈接起來。`,
    };
  }
  return {
    step: 'release',
    paused: true,
    message: `預演已展開 ${input.previewEventCount} 個事件。釋放軍令，讓整條引擎一次爆完。`,
  };
}

export function createFirstHuntCoach(input: CoachInput): FirstHuntCoach | undefined {
  if (input.tutorial !== 'active') return undefined;
  if (input.hasBorderRecord && input.screen === 'battle') {
    return {
      step: 'complete',
      paused: false,
      message: '第一次殲滅循環完成。接下來自由改造你的引擎。',
      completeTutorial: true,
    };
  }
  if (input.screen === 'guild') {
    return input.hasBorderRecord
      ? { step: 'replay', paused: false, message: '帶著剛上線的裝備規則，再重刷一次邊境狼群。' }
      : {
          step: 'build',
          paused: false,
          message:
            input.selectedBuildId === 'retaliation'
              ? '先確認反擊壁壘，再從任務分頁開始邊境狼群。'
              : '切回反擊壁壘，完成第一條盾牆蓄爆路線。',
        };
  }
  if (input.questId !== 'border_pack') return undefined;
  if (input.screen === 'playback') {
    return {
      step: 'playback',
      paused: false,
      message: '觀看因果鏈逐段升級；也可以跳過並直接落在完整高潮。',
    };
  }
  if (input.screen === 'rewards') {
    return input.resolvedItemCount < input.rewardItemCount
      ? { step: 'loot', paused: false, message: '使用推薦裝備者，讓新規則立刻加入 Build。' }
      : { step: 'return', paused: false, message: '戰利品已處理完成，返回公會準備重刷。' };
  }
  return signatureStep(input);
}
