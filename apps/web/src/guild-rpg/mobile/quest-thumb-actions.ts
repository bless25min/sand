import type { QuestDefinition } from '@expedition/shared-types';
import type { Dispatch, SetStateAction } from 'react';

import type { ThumbDeckAction } from '../components/ThumbCommandDeck';
import type { GuildRpgAction } from '../state/game-reducer';
import { wrapThumbIndex } from './thumb-deck-model';

interface QuestActionsInput {
  quest: QuestDefinition;
  questCount: number;
  unlocked: boolean;
  replay: boolean;
  dispatch: React.Dispatch<GuildRpgAction>;
  setQuestIndex: Dispatch<SetStateAction<number>>;
  onOpenArchive?: () => void;
}

export function createQuestThumbActions({
  quest,
  questCount,
  unlocked,
  replay,
  dispatch,
  setQuestIndex,
  onOpenArchive,
}: QuestActionsInput): readonly ThumbDeckAction[] {
  return [
    {
      id: 'previous-quest',
      label: '上一個',
      slot: 'secondary',
      onPress: () => setQuestIndex((current) => wrapThumbIndex(current, questCount, -1)),
    },
    {
      id: 'next-quest',
      label: '下一個',
      slot: 'choice-a',
      onPress: () => setQuestIndex((current) => wrapThumbIndex(current, questCount, 1)),
    },
    {
      id: 'archive',
      label: '檔案館',
      detail: '挑戰 · 紀錄 · Ascended',
      slot: 'utility',
      disabled: !onOpenArchive,
      onPress: onOpenArchive ?? (() => undefined),
    },
    {
      id: 'start-quest',
      label: unlocked ? (replay ? '帶新引擎重刷' : '開始遠征') : '尚未解鎖',
      detail: `建議 Lv.${quest.recommendedLevel}`,
      slot: 'primary',
      tone: 'primary',
      disabled: !unlocked,
      onPress: () => dispatch({ type: 'START_QUEST', questId: quest.id }),
    },
  ];
}
