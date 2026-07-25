import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { compileCommand } from '@expedition/simulation-core';

import { createBattleSensationModel } from '../presentation/battle-sensation-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface CommandComposerProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

const TAG_LABEL: Readonly<Record<string, string>> = {
  area: '全場',
  block: '格擋',
  heal_overflow: '溢療',
  healed: '治療',
  hit: '命中',
  marked: '標記',
  ricochet: '彈射',
  staggered: '破勢',
};

const MILESTONE_LABEL = {
  'multi-kill': 'MULTI KILL',
  'chain-wipe': 'CHAIN WIPE',
  annihilation: 'ANNIHILATION',
  chest: 'CHEST',
} as const;

export function CommandComposer({ state, dispatch }: CommandComposerProps) {
  const battle = state.battle!;
  const runtime = battle.combo!;
  const draftCards = runtime.draft.cardIds.map((cardId) => GUILD_GAME_CONTENT.cards[cardId]!);
  const availableCards = runtime.availableCardIds.map(
    (cardId) => GUILD_GAME_CONTENT.cards[cardId]!,
  );
  const earlyRelease = draftCards.length > 0 && draftCards.length < 4;
  const sensation = createBattleSensationModel(state, GUILD_GAME_CONTENT);

  return (
    <section className="gr-command gr-combo-composer" aria-label="自由軍令編排">
      <div className="gr-combo-composer__summary">
        <p>FREE-FORM COMMAND</p>
        <h2>{draftCards.length > 0 ? `${draftCards.length} 段連擊待命` : '選擇一張起手卡牌'}</h2>
        <div className="gr-command__signature">
          <strong>{sensation.build.payoffLabel}</strong>
          <span>
            招牌路線 {sensation.signature.completedCardIds.length}/
            {sensation.build.signatureCardIds.length}
          </span>
        </div>
        <ol>
          {draftCards.map((card, index) => (
            <li key={`${index}:${card.id}`}>
              <span>{index + 1}</span>
              {card.name}
            </li>
          ))}
        </ol>
        <dl className="gr-command__forecast" role="status">
          <div>
            <dt>預演事件</dt>
            <dd>{sensation.preview.eventCount}</dd>
          </div>
          <div>
            <dt>預估傷害</dt>
            <dd>{Math.round(sensation.preview.totalDamage)}</dd>
          </div>
          <div>
            <dt>預估擊殺</dt>
            <dd>{sensation.preview.defeatedEnemyIds.length}</dd>
          </div>
          <div>
            <dt>OVERKILL</dt>
            <dd>{Math.round(sensation.preview.overkill)}</dd>
          </div>
        </dl>
        <div className="gr-command__milestones">
          {sensation.preview.milestones.map((milestone) => (
            <b key={milestone}>{MILESTONE_LABEL[milestone]}</b>
          ))}
          {sensation.signature.nextCard && (
            <span>下一張推薦：{sensation.signature.nextCard.name}</span>
          )}
        </div>
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
              className={card.id === sensation.signature.nextCard?.id ? 'is-recommended' : ''}
              disabled={diagnostics.length > 0}
              title={diagnostics[0]}
              onClick={() => dispatch({ type: 'APPEND_COMBO_CARD', cardId: card.id })}
            >
              <span>
                {GUILD_GAME_CONTENT.adventurers.find((hero) => hero.id === card.ownerId)?.name}
              </span>
              <strong>{card.name}</strong>
              <em>{card.emitsTags.map((tag) => TAG_LABEL[tag] ?? tag).join(' · ')}</em>
              <small>{diagnostics[0] ?? card.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
