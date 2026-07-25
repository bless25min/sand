import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { compileCommand } from '@expedition/simulation-core';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface CommandComposerProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function CommandComposer({ state, dispatch }: CommandComposerProps) {
  const battle = state.battle!;
  const runtime = battle.combo!;
  const draftCards = runtime.draft.cardIds.map((cardId) => GUILD_GAME_CONTENT.cards[cardId]!);
  const availableCards = runtime.availableCardIds.map(
    (cardId) => GUILD_GAME_CONTENT.cards[cardId]!,
  );
  const earlyRelease = draftCards.length > 0 && draftCards.length < 4;

  return (
    <section className="gr-command gr-combo-composer" aria-label="自由軍令編排">
      <div className="gr-combo-composer__summary">
        <p>FREE-FORM COMMAND</p>
        <h2>{draftCards.length > 0 ? `${draftCards.length} 段連擊待命` : '選擇一張起手卡牌'}</h2>
        <ol>
          {draftCards.map((card, index) => (
            <li key={`${index}:${card.id}`}>
              <span>{index + 1}</span>
              {card.name}
            </li>
          ))}
        </ol>
        <div className="gr-combo-composer__commit">
          <button
            type="button"
            onClick={() => dispatch({ type: 'UNDO_COMBO_CARD' })}
            disabled={draftCards.length === 0}
          >
            撤銷上一步
          </button>
          <button
            type="button"
            data-tone="primary"
            onClick={() => dispatch({ type: 'RELEASE_COMBO' })}
            disabled={draftCards.length === 0}
          >
            {earlyRelease ? '提早釋放' : '釋放軍令'}
          </button>
        </div>
      </div>
      <div className="gr-combo-composer__cards">
        {availableCards.map((card) => {
          const diagnostics = compileCommand(
            { cardIds: [...runtime.draft.cardIds, card.id] },
            GUILD_GAME_CONTENT.cards,
          ).diagnostics;
          return (
            <button
              type="button"
              key={card.id}
              disabled={diagnostics.length > 0}
              title={diagnostics[0]}
              onClick={() => dispatch({ type: 'APPEND_COMBO_CARD', cardId: card.id })}
            >
              <span>
                {GUILD_GAME_CONTENT.adventurers.find((hero) => hero.id === card.ownerId)?.name}
              </span>
              <strong>{card.name}</strong>
              <small>{diagnostics[0] ?? card.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
