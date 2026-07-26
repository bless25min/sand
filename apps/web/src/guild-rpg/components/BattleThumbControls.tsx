import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { compileCommand } from '@expedition/simulation-core';
import { useState } from 'react';

import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import { createBattleSensationModel } from '../presentation/battle-sensation-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { ThumbCommandDeck, type ThumbDeckAction } from './ThumbCommandDeck';

interface BattleThumbControlsProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

type BattleThumbPage = 'cards' | 'command' | 'target' | 'system';

const CARD_SLOTS = ['choice-a', 'choice-b'] as const;

export function BattleThumbControls({ state, dispatch }: BattleThumbControlsProps) {
  const battle = state.battle!;
  const runtime = battle.combo!;
  const [page, setPage] = useState<BattleThumbPage>('cards');
  const [cardPage, setCardPage] = useState(0);
  const selectedTarget = battle.units.find((unit) => unit.id === battle.selectedTargetId);
  const earlyRelease = runtime.draft.cardIds.length > 0 && runtime.draft.cardIds.length < 4;
  const sensation = createBattleSensationModel(state, GUILD_GAME_CONTENT);
  const coach = createFirstHuntCoach({
    tutorial: state.preferences.tutorial,
    screen: 'battle',
    questId: battle.questId,
    selectedBuildId: state.profile.selectedBuildId,
    ...(battle.selectedTargetId ? { selectedTargetId: battle.selectedTargetId } : {}),
    draftCardIds: runtime.draft.cardIds,
    previewEventCount: sensation.preview.eventCount,
    rewardItemCount: 0,
    resolvedItemCount: 0,
    hasBorderRecord: Boolean(state.profile.questRecords.border_pack),
    replaying: state.tutorialReplay,
    previewAcknowledged: state.tutorialPreviewAcknowledged,
    bossExecutionOpen: Boolean(battle.combo?.activatedBossPhaseIds?.includes('alpha-execution')),
  });
  const releaseLabel =
    coach?.step === 'recover'
      ? '撤銷錯誤卡'
      : coach?.step === 'preview'
        ? '確認預演'
        : coach?.step === 'release'
          ? '釋放軍令'
          : earlyRelease
            ? '提早釋放'
            : '釋放軍令';
  const releaseAction = () =>
    dispatch(
      coach?.step === 'recover'
        ? { type: 'UNDO_COMBO_CARD' }
        : coach?.step === 'preview'
          ? { type: 'ACK_TUTORIAL_PREVIEW' }
          : { type: 'RELEASE_COMBO' },
    );
  const recommendedCardId = coach?.expectedCardId ?? sensation.signature.nextCard?.id;

  let actions: readonly ThumbDeckAction[];
  let title: string;
  if (page === 'cards') {
    const cards = runtime.availableCardIds
      .map((cardId) => GUILD_GAME_CONTENT.cards[cardId]!)
      .filter(
        (card) =>
          compileCommand({ cardIds: [...runtime.draft.cardIds, card.id] }, GUILD_GAME_CONTENT.cards)
            .diagnostics.length === 0,
      )
      .sort((left, right) =>
        left.id === recommendedCardId ? -1 : right.id === recommendedCardId ? 1 : 0,
      );
    const pageCount = Math.max(1, Math.ceil(cards.length / 2));
    const visibleCards = cards.slice((cardPage % pageCount) * 2, (cardPage % pageCount) * 2 + 2);
    title =
      runtime.draft.cardIds.length > 0 ? `軍令 ${runtime.draft.cardIds.length} 段` : '選擇起手卡';
    actions = [
      ...visibleCards.map((card, index) => ({
        id: card.id,
        label: card.name,
        detail: GUILD_GAME_CONTENT.adventurers.find((hero) => hero.id === card.ownerId)?.name,
        slot: CARD_SLOTS[index]!,
        onPress: () => dispatch({ type: 'APPEND_COMBO_CARD', cardId: card.id }),
      })),
      {
        id: 'next-cards',
        label: '下一組',
        detail: `${(cardPage % pageCount) + 1} / ${pageCount}`,
        slot: 'utility',
        onPress: () => setCardPage((current) => (current + 1) % pageCount),
      },
      {
        id: 'undo',
        label: '撤銷上一步',
        detail: '移除最後一張',
        slot: 'secondary',
        disabled: runtime.draft.cardIds.length === 0,
        onPress: () => dispatch({ type: 'UNDO_COMBO_CARD' }),
      },
      {
        id: 'release',
        label: releaseLabel,
        detail: `${sensation.preview.eventCount} 事件 · ${sensation.preview.defeatedEnemyIds.length} 擊殺`,
        slot: 'primary',
        tone: 'primary',
        disabled: runtime.draft.cardIds.length === 0,
        onPress: releaseAction,
      },
    ];
  } else if (page === 'command') {
    const latestCardId = runtime.draft.cardIds.at(-1);
    title =
      runtime.draft.cardIds.length > 0
        ? `${runtime.draft.cardIds.length} 段軍令待命`
        : '軍令尚未開始';
    actions = [
      {
        id: 'release',
        label: releaseLabel,
        detail: `${sensation.preview.eventCount} 事件 · ${sensation.preview.defeatedEnemyIds.length} 擊殺`,
        slot: 'primary',
        tone: 'primary',
        disabled: runtime.draft.cardIds.length === 0,
        onPress: releaseAction,
      },
      {
        id: 'undo',
        label: '撤銷上一步',
        detail: latestCardId ? GUILD_GAME_CONTENT.cards[latestCardId]?.name : '沒有可撤銷卡牌',
        slot: 'secondary',
        disabled: runtime.draft.cardIds.length === 0,
        onPress: () => dispatch({ type: 'UNDO_COMBO_CARD' }),
      },
    ];
  } else if (page === 'target') {
    const targets = battle.units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0);
    title = `目標：${selectedTarget?.name ?? '未選擇'}`;
    actions = targets.map((target, index) => ({
      id: target.id,
      label: target.name,
      detail: `${Math.ceil(target.currentHp)} / ${target.stats.hp} HP`,
      slot: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'choice-a',
      selected: target.id === battle.selectedTargetId,
      tone: index === 0 ? 'primary' : 'default',
      onPress: () => {
        dispatch({ type: 'SELECT_TARGET', targetId: target.id });
        setPage('cards');
      },
    }));
  } else {
    title = state.paused ? '戰鬥時間已暫停' : '戰鬥時間流動中';
    actions = [
      {
        id: 'toggle-pause',
        label: state.paused ? '繼續時間' : '暫停戰鬥',
        detail: '軍令輸入仍可操作',
        slot: 'primary',
        tone: 'primary',
        onPress: () => dispatch({ type: 'SET_PAUSED', paused: !state.paused }),
      },
      {
        id: 'settings',
        label: '開啟設定',
        detail: '音效 · 震動 · 動態',
        slot: 'secondary',
        onPress: () => dispatch({ type: 'SET_SETTINGS_OPEN', open: true }),
      },
      ...(coach
        ? [
            {
              id: 'skip-tutorial',
              label: '跳過教學',
              detail: '保留目前遠征',
              slot: 'utility' as const,
              onPress: () => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' }),
            },
          ]
        : []),
    ];
  }

  const focusedActionVisible =
    coach?.focusId?.startsWith('action:') &&
    actions.some((action) => `action:${action.id}` === coach.focusId);
  const guide =
    coach?.focusId?.startsWith('action:') && !focusedActionVisible
      ? {
          ...coach,
          title: coach.step === 'target' ? '打開目標選單' : '回到卡牌',
          message:
            coach.step === 'target'
              ? '先切到目標分頁，再鎖定教學標示的敵人。'
              : '先切回卡牌分頁，繼續完成這一步軍令。',
          focusId: coach.step === 'target' ? 'tab:target' : 'tab:cards',
        }
      : coach;

  return (
    <ThumbCommandDeck
      ariaLabel="戰鬥操作"
      eyebrow="FREE-FORM COMMAND"
      title={title}
      status={`${sensation.build.payoffLabel} · ${sensation.signature.nextCard ? `推薦 ${sensation.signature.nextCard.name}` : '招牌路線完成'} · 鎖定 ${selectedTarget?.name ?? '無'}`}
      feedback={state.message}
      guide={guide}
      onSkipGuide={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' })}
      tabs={[
        {
          id: 'cards',
          label: '卡牌',
          selected: page === 'cards',
          onSelect: () => setPage('cards'),
        },
        {
          id: 'command',
          label: '軍令',
          selected: page === 'command',
          onSelect: () => setPage('command'),
        },
        {
          id: 'target',
          label: '目標',
          selected: page === 'target',
          onSelect: () => {
            setPage('target');
          },
        },
        {
          id: 'system',
          label: '系統',
          selected: page === 'system',
          onSelect: () => setPage('system'),
        },
      ]}
      actions={actions}
    />
  );
}
