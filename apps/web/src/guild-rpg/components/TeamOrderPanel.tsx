import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function TeamOrderPanel({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const selectedHero = GUILD_GAME_CONTENT.adventurers.find(
    ({ id }) => id === state.selectedHeroId,
  )!;
  return (
    <section className="gr-panel" aria-labelledby="team-order-title">
      <header className="gr-panel__header">
        <div>
          <p>DEFAULT RELAY ORDER</p>
          <h2 id="team-order-title">六人預設接力順序</h2>
        </div>
        <span>戰鬥中仍可把尚未出手的角色臨時調成下一位</span>
      </header>
      <div className="gr-party-context" data-party-selected-hero={selectedHero.id}>
        <div>
          <span>目前操作：{selectedHero.name}</span>
          <strong>{selectedHero.title}</strong>
        </div>
        <p>點角色切換；箭頭調整預設接力順序。戰鬥中仍能臨時改下一棒。</p>
        <div className="gr-party-quick-actions">
          <button type="button" onClick={() => dispatch({ type: 'NAVIGATE', page: 'skills' })}>
            配置{selectedHero.name}技能
          </button>
          <button type="button" onClick={() => dispatch({ type: 'NAVIGATE', page: 'equipment' })}>
            更換{selectedHero.name}裝備
          </button>
        </div>
      </div>
      <div className="gr-hero-order">
        {state.profile.defaultOrder.map((heroId, index) => {
          const hero = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === heroId)!;
          const selected = state.selectedHeroId === heroId;
          return (
            <article className="gr-hero-order__card" data-selected={selected} key={hero.id}>
              <button
                type="button"
                data-guide-id={index === 0 ? 'hero:first' : undefined}
                data-guide-active={
                  index === 0
                    ? isFirstHuntCoachFocus(
                        state.preferences.tutorial,
                        state.tutorialStep,
                        'hero:first',
                      )
                    : undefined
                }
                onClick={() => dispatch({ type: 'SELECT_HERO', adventurerId: hero.id })}
              >
                <span>{index + 1}</span>
                <strong>{hero.name}</strong>
                <small>{hero.title}</small>
              </button>
              <div>
                <button
                  type="button"
                  aria-label={`${hero.name}往前`}
                  disabled={index === 0}
                  onClick={() =>
                    dispatch({ type: 'MOVE_DEFAULT_HERO', adventurerId: hero.id, direction: -1 })
                  }
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`${hero.name}往後`}
                  disabled={index === state.profile.defaultOrder.length - 1}
                  onClick={() =>
                    dispatch({ type: 'MOVE_DEFAULT_HERO', adventurerId: hero.id, direction: 1 })
                  }
                >
                  →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
