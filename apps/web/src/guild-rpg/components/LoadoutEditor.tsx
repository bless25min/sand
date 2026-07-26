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
      <div className="gr-loadout-columns">
        <div>
          <b>ACTIVE 8 · 點選換下</b>
          <div className="gr-card-button-grid">{activeIds.map((id) => cardButton(id, true))}</div>
        </div>
        <div>
          <b>ARSENAL RESERVE · 點選裝填</b>
          <div className="gr-card-button-grid">{reserveIds.map((id) => cardButton(id, false))}</div>
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
