import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { compileCommand } from '@expedition/simulation-core';
import { useState } from 'react';

import { createBattleSensationModel } from '../presentation/battle-sensation-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { ThumbCommandDeck, type ThumbDeckAction } from './ThumbCommandDeck';

interface BattleThumbControlsProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

type BattleThumbPage = 'cards' | 'command' | 'target';

const CARD_SLOTS = ['choice-a', 'choice-b'] as const;

export function BattleThumbControls({ state, dispatch }: BattleThumbControlsProps) {
  const battle = state.battle!;
  const runtime = battle.combo!;
  const [page, setPage] = useState<BattleThumbPage>('cards');
  const [cardPage, setCardPage] = useState(0);
  const selectedTarget = battle.units.find((unit) => unit.id === battle.selectedTargetId);
  const earlyRelease = runtime.draft.cardIds.length > 0 && runtime.draft.cardIds.length < 4;
  const sensation = createBattleSensationModel(state, GUILD_GAME_CONTENT);

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
        left.id === sensation.signature.nextCard?.id
          ? -1
          : right.id === sensation.signature.nextCard?.id
            ? 1
            : 0,
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
        label: earlyRelease ? '提早釋放' : '釋放軍令',
        detail: `${sensation.preview.eventCount} 事件 · ${sensation.preview.defeatedEnemyIds.length} 擊殺`,
        slot: 'primary',
        tone: 'primary',
        disabled: runtime.draft.cardIds.length === 0,
        onPress: () => dispatch({ type: 'RELEASE_COMBO' }),
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
        label: earlyRelease ? '提早釋放' : '釋放軍令',
        detail: `${sensation.preview.eventCount} 事件 · ${sensation.preview.defeatedEnemyIds.length} 擊殺`,
        slot: 'primary',
        tone: 'primary',
        disabled: runtime.draft.cardIds.length === 0,
        onPress: () => dispatch({ type: 'RELEASE_COMBO' }),
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
  } else {
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
  }

  return (
    <ThumbCommandDeck
      ariaLabel="戰鬥操作"
      eyebrow="FREE-FORM COMMAND"
      title={title}
      status={`${sensation.build.payoffLabel} · ${sensation.signature.nextCard ? `推薦 ${sensation.signature.nextCard.name}` : '招牌路線完成'} · 鎖定 ${selectedTarget?.name ?? '無'}`}
      feedback={state.message}
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
      ]}
      actions={actions}
    />
  );
}
