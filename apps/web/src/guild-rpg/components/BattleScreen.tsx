import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { createFirstHuntCoach, isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { SixSkillControls } from './SixSkillControls';
import { TurnOrderRail } from './TurnOrderRail';

export function BattleScreen({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const battle = state.battle!;
  const quest = GUILD_GAME_CONTENT.quests.find(({ id }) => id === battle.questId)!;
  const victory = battle.status === 'victory';
  const actorId = victory
    ? (state.recentEvents.find(({ kind }) => kind === 'finisher')?.actorId ??
      battle.roundOrder?.activeAdventurerId)
    : battle.roundOrder?.activeAdventurerId;
  const actor = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === actorId);
  const enemies = battle.units.filter(({ side }) => side === 'enemies');
  const heroes = battle.units.filter(({ side }) => side === 'heroes');
  const coach =
    state.tutorialStep === 'select_target' ||
    state.tutorialStep === 'use_skill' ||
    state.tutorialStep === 'reorder'
      ? createFirstHuntCoach(state.preferences.tutorial, state.tutorialStep, {
          ...(actor ? { heroName: actor.name } : {}),
        })
      : undefined;
  const relay = state.recentEvents.find(({ kind }) => kind === 'relay')?.amount ?? 1;
  return (
    <main className="gr-battle">
      <header className="gr-battle__header">
        <div>
          <span>QUEST · {quest.name}</span>
          <h1>
            {victory ? '終結者' : '目前出手'}：{actor?.name ?? '等待結算'}
          </h1>
        </div>
        {victory ? (
          <strong className="gr-finisher-badge">第六棒已完成</strong>
        ) : (
          <div className="gr-battle-header-actions">
            <button
              type="button"
              aria-label="恢復本回合預設順序"
              onClick={() => dispatch({ type: 'RESET_CURRENT_ORDER' })}
            >
              重排
            </button>
            <button
              type="button"
              aria-label="切換是否沿用目前順序到下回合"
              aria-pressed={battle.roundOrder?.carryCurrentOrder}
              onClick={() =>
                dispatch({
                  type: 'SET_CARRY_ORDER',
                  enabled: !battle.roundOrder?.carryCurrentOrder,
                })
              }
            >
              {battle.roundOrder?.carryCurrentOrder ? '沿用中' : '沿用'}
            </button>
            <button type="button" onClick={() => dispatch({ type: 'ABANDON_HUNT' })}>
              撤離
            </button>
          </div>
        )}
      </header>
      <TurnOrderRail state={state} dispatch={dispatch} />
      <section className="gr-battlefield" aria-label="戰鬥畫面">
        <div className="gr-enemy-grid">
          {enemies.map((enemy, index) => (
            <button
              type="button"
              data-targeted={battle.selectedTargetId === enemy.id}
              data-guide-id={index === 0 ? 'target:first' : undefined}
              data-guide-active={
                index === 0
                  ? isFirstHuntCoachFocus(
                      state.preferences.tutorial,
                      state.tutorialStep,
                      'target:first',
                    )
                  : undefined
              }
              disabled={enemy.currentHp <= 0}
              key={enemy.id}
              onClick={() => dispatch({ type: 'SELECT_TARGET', targetId: enemy.id })}
            >
              <span>
                {enemy.currentHp <= 0
                  ? '擊破'
                  : battle.selectedTargetId === enemy.id
                    ? '目前目標'
                    : '點擊鎖定'}
              </span>
              <strong>{enemy.name}</strong>
              <small>
                HP {enemy.currentHp}/{enemy.stats.hp}
              </small>
              <div className="gr-hp">
                <i style={{ width: `${Math.max(0, enemy.currentHp / enemy.stats.hp) * 100}%` }} />
              </div>
              <em>
                燃 {enemy.statusLayers?.burn ?? 0} · 毒 {enemy.statusLayers?.poison ?? 0} · 潮{' '}
                {enemy.statusLayers?.tide ?? 0}
              </em>
            </button>
          ))}
        </div>
        <div className="gr-impact-stage" data-relay-level={Math.min(6, relay)} aria-live="polite">
          <span>IMMEDIATE RELAY</span>
          <strong>
            {state.recentEvents.find(({ kind }) => kind === 'skill_cast')?.message ??
              '選目標，立即施放技能'}
          </strong>
          <div>
            {state.recentEvents.slice(-8).map((event) => (
              <p data-event-kind={event.kind} key={event.id}>
                {event.message}
              </p>
            ))}
          </div>
        </div>
        <div className="gr-hero-grid">
          {heroes.map((hero) => (
            <article data-active={hero.id === actorId} key={hero.id}>
              <strong>{hero.name}</strong>
              <small>
                HP {hero.currentHp}/{hero.stats.hp}
              </small>
              <div className="gr-hp">
                <i style={{ width: `${Math.max(0, hero.currentHp / hero.stats.hp) * 100}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="gr-command-dock">
        {victory ? (
          <div className="gr-finisher-dock" role="status">
            <header>
              <span>SIXTH RELAY · FINISHER</span>
              <strong>六人接力已完整爆發</strong>
              <small>戰鬥畫面會停留在終結結果；確認後再領取本次全部掉落。</small>
            </header>
            <button
              type="button"
              data-guide-id="battle:collect"
              onClick={() => dispatch({ type: 'COLLECT_VICTORY' })}
            >
              收下全部戰利品
            </button>
          </div>
        ) : coach ? (
          <>
            <header className="gr-battle-guide-strip" role="status">
              <div>
                <span>
                  實戰引導 {coach.stepNumber}/{coach.stepTotal} · {coach.title}
                </span>
                <strong>{coach.message}</strong>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' })}
              >
                略過
              </button>
            </header>
            <SixSkillControls state={state} dispatch={dispatch} />
          </>
        ) : (
          <>
            <header>
              <span>點擊後立即結算，不等待其他角色</span>
              <strong>{actor?.name}的六個技能</strong>
            </header>
            <SixSkillControls state={state} dispatch={dispatch} />
          </>
        )}
      </section>
      <p className="gr-status-line" role="status">
        {state.message}
      </p>
    </main>
  );
}
