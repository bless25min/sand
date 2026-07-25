import type { TutorialState } from '../preferences/guild-preferences';

type FirstHuntCoachStep =
  | 'build'
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
  replaying: boolean;
  previewAcknowledged: boolean;
  bossExecutionOpen: boolean;
}

export interface FirstHuntCoach {
  step: FirstHuntCoachStep;
  paused: boolean;
  message: string;
  expectedCardId?: string;
}

const OPENING_SIGNATURE = ['brann_brace', 'brann_riposte', 'brann_sweep'] as const;
const EXECUTION_SIGNATURE = [
  'lyra_mark',
  'lyra_piercing_shot',
  'lyra_ricochet',
  'elin_prayer',
  'elin_overflow_bolt',
  'elin_radiant_burst',
] as const;

function signatureStep(input: CoachInput): FirstHuntCoach {
  const signature = input.bossExecutionOpen ? EXECUTION_SIGNATURE : OPENING_SIGNATURE;
  const expectedTargetId = input.bossExecutionOpen ? 'wolf_alpha' : 'wolf_scout';
  if (input.selectedTargetId !== expectedTargetId) {
    return {
      step: 'target',
      paused: true,
      message: input.bossExecutionOpen
        ? '護衛已倒。鎖定灰牙首領，進入孤王處決窗。'
        : '先鎖定灰牙斥候，打開狼群的第一個缺口。',
    };
  }
  const divergentIndex = input.draftCardIds
    .slice(0, signature.length)
    .findIndex((cardId, index) => cardId !== signature[index]);
  if (divergentIndex >= 0) {
    return {
      step: 'recover',
      paused: true,
      message: '這張卡偏離盾牆蓄爆。先撤銷到上一步，推薦卡就會重新回到主操作位。',
    };
  }
  const nextIndex = input.draftCardIds.length;
  if (nextIndex < signature.length) {
    const expectedCardId = signature[nextIndex]!;
    const names = input.bossExecutionOpen
      ? ['鷹眼標記', '貫心箭', '彈射箭雨', '晨光祈禱', '溢光裁決', '輝光爆裂']
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
      expectedCardId,
      message: input.bossExecutionOpen
        ? `處決鏈 ${nextIndex + 1}/${signature.length}：選 ${names[nextIndex]}，把孤王一路壓進最終爆發。`
        : `下一張選 ${names[nextIndex]}，讓盾牆蓄爆沿著因果鏈接起來。`,
    };
  }
  if (!input.previewAcknowledged) {
    return {
      step: 'preview',
      paused: true,
      message: `先讀一次預演：${input.previewEventCount} 個事件會依序堆疊、觸發、擊破。確認後再釋放。`,
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
  if (input.screen !== 'guild' && input.questId !== 'border_pack') {
    return undefined;
  }
  if (input.screen === 'guild') {
    return input.hasBorderRecord
      ? {
          step: 'replay',
          paused: false,
          message: input.replaying
            ? '教學重播已待命。從任務分頁再次進入邊境狼群，完成整條殲滅鏈。'
            : '第一次狩獵已完成。你可以隨時從設定重播完整教學。',
        }
      : {
          step: 'build',
          paused: false,
          message:
            input.selectedBuildId === 'retaliation'
              ? '先確認反擊壁壘，再從任務分頁開始邊境狼群。'
              : '切回反擊壁壘，完成第一條盾牆蓄爆路線。',
        };
  }
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
