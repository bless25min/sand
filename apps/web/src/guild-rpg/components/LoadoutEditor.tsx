import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { useState } from 'react';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface LoadoutEditorProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export function LoadoutEditor({ state, dispatch, onClose, onOpenSettings }: LoadoutEditorProps) {
  const build = GUILD_GAME_CONTENT.builds.find(
    (candidate) => candidate.id === state.profile.selectedBuildId,
  )!;
  const activeIds = state.profile.loadouts[build.id] ?? build.defaultCardIds;
  const reserveIds = build.cardIds.filter((cardId) => !activeIds.includes(cardId));
  const [removedCardId, setRemovedCardId] = useState(activeIds[0]!);
  const [expanded, setExpanded] = useState(false);
  const focusedActiveIds = [
    ...build.signatureCardIds,
    ...activeIds.filter((cardId) => !build.signatureCardIds.includes(cardId)),
  ].slice(0, 4);
  const visibleActiveIds = expanded ? activeIds : focusedActiveIds;
  const visibleReserveIds = expanded ? reserveIds : reserveIds.slice(0, 2);
  const cardButton = (cardId: string, active: boolean) => {
    const card = GUILD_GAME_CONTENT.cards[cardId]!;
    return (
      <button
        type="button"
        className={active && removedCardId === cardId ? 'is-selected' : ''}
        aria-pressed={active ? removedCardId === cardId : undefined}
        key={card.id}
        onClick={() =>
          active
            ? setRemovedCardId(card.id)
            : dispatch({
                type: 'SWAP_LOADOUT_CARD',
                buildId: build.id,
                removedCardId,
                addedCardId: card.id,
              })
        }
      >
        <span>{GUILD_GAME_CONTENT.adventurers.find((hero) => hero.id === card.ownerId)?.name}</span>
        <strong>{card.name}</strong>
        <small>{card.description}</small>
      </button>
    );
  };

  return (
    <section className="gr-longterm-panel gr-loadout-editor" aria-labelledby="loadout-title">
      <header>
        <div>
          <p>
            LOADOUT · {activeIds.length} / {build.cardIds.length}
          </p>
          <h3 id="loadout-title">八卡軍械庫</h3>
        </div>
        <span>先選一張主動卡，再點後備卡立即替換；下一場戰鬥只出現這八張。</span>
      </header>
      <p className="gr-longterm-feedback" role="status" aria-live="polite">
        {state.message}
      </p>
      <section className="gr-loadout-suggestion" aria-label="建議路線">
        <div>
          <b>建議路線 · {build.payoffLabel}</b>
          <span>
            {build.signatureCardIds
              .map((cardId) => GUILD_GAME_CONTENT.cards[cardId]!.name)
              .join(' → ')}
          </span>
        </div>
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? '收起建議模式' : `展開全部 ${build.cardIds.length} 張`}
        </button>
      </section>
      <div className="gr-loadout-columns">
        <div>
          <b>{expanded ? 'ACTIVE 8 · 點選換下' : '核心軍令 4 · 先讀懂主路線'}</b>
          <div className="gr-card-button-grid">
            {visibleActiveIds.map((id) => cardButton(id, true))}
          </div>
        </div>
        <div>
          <b>{expanded ? 'ARSENAL RESERVE · 點選裝填' : '推薦候選 2 · 再決定換入'}</b>
          <div className="gr-card-button-grid">
            {visibleReserveIds.map((id) => cardButton(id, false))}
          </div>
        </div>
      </div>
      {(onClose || onOpenSettings) && (
        <footer>
          {onOpenSettings && (
            <button type="button" onClick={onOpenSettings}>
              遊戲設定
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose}>
              完成牌組
            </button>
          )}
        </footer>
      )}
    </section>
  );
}
