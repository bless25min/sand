import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { useCombatPlayback } from '../hooks/use-combat-playback';
import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { BattleCommandDock } from './BattleCommandDock';
import { CombatBattlefield } from './CombatBattlefield';
import { TurnOrderRail } from './TurnOrderRail';

const heroDefinition = (id?: string) =>
  GUILD_GAME_CONTENT.adventurers.find((hero) => hero.id === id);

export function BattleScreen({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const battle = state.battle!;
  const order = battle.roundOrder!;
  const victory = battle.status === 'victory';
  const quest = GUILD_GAME_CONTENT.quests.find(({ id }) => id === battle.questId)!;
  const recentActorId = state.recentEvents.find(({ kind }) => kind === 'skill_cast')?.actorId;
  const finisherActorId = state.recentEvents.find(({ kind }) => kind === 'finisher')?.actorId;
  const eventRelay = state.recentEvents.find(({ kind }) => kind === 'relay')?.amount;
  const activeActorId = victory ? finisherActorId : order.activeAdventurerId;
  const relay = victory
    ? 6
    : eventRelay !== undefined
      ? eventRelay
      : state.recentEvents.length > 0
        ? Math.max(1, order.actedIds.length)
        : Math.min(6, order.actedIds.length + 1);
  const playback = useCombatPlayback(state.recentEvents, relay, state.preferences);
  const actingActorId = playback.isPlaying && recentActorId ? recentActorId : activeActorId;
  const nextActorId = victory
    ? undefined
    : playback.isPlaying
      ? order.activeAdventurerId
      : order.currentOrder.find(
          (heroId) => heroId !== order.activeAdventurerId && !order.actedIds.includes(heroId),
        );
  const actor = heroDefinition(actingActorId);
  const commandActor = heroDefinition(order.activeAdventurerId);
  const battleCoachStep =
    state.tutorialStep === 'select_target' ||
    state.tutorialStep === 'collect_reward' ||
    state.tutorialStep.startsWith('relay_');
  const coach = battleCoachStep
    ? createFirstHuntCoach(state.preferences.tutorial, state.tutorialStep, {
        ...(commandActor ? { heroName: commandActor.name } : {}),
        battleStatus: battle.status,
      })
    : undefined;

  return (
    <main className="gr-battle" data-playback={playback.isPlaying}>
      <header className="gr-battle__header">
        <div>
          <span>QUEST · {quest.name}</span>
          <h1>
            {victory ? '終結者' : playback.isPlaying ? '正在出招' : '目前出手'}：
            {actor?.name ?? '等待結算'}
          </h1>
        </div>
        {victory ? (
          <strong className="gr-finisher-badge">第六棒 · 終結完成</strong>
        ) : (
          <div className="gr-battle-header-actions">
            <button
              type="button"
              disabled={playback.isPlaying}
              aria-label="恢復本回合預設順序"
              onClick={() => dispatch({ type: 'RESET_CURRENT_ORDER' })}
            >
              重排
            </button>
            <button
              type="button"
              disabled={playback.isPlaying}
              aria-label="切換是否沿用目前順序到下回合"
              aria-pressed={order.carryCurrentOrder}
              onClick={() =>
                dispatch({
                  type: 'SET_CARRY_ORDER',
                  enabled: !order.carryCurrentOrder,
                })
              }
            >
              {order.carryCurrentOrder ? '沿用中' : '沿用'}
            </button>
            <button
              type="button"
              disabled={playback.isPlaying}
              onClick={() => dispatch({ type: 'ABANDON_HUNT' })}
            >
              撤離
            </button>
          </div>
        )}
      </header>

      <TurnOrderRail state={state} dispatch={dispatch} locked={playback.isPlaying} />
      <CombatBattlefield
        battle={battle}
        preferences={state.preferences}
        tutorialStep={state.tutorialStep}
        currentBeat={playback.currentBeat}
        visibleBeats={playback.visibleBeats}
        actingActorId={actingActorId}
        nextActorId={nextActorId}
        relay={relay}
        locked={playback.isPlaying}
        onSelectTarget={(targetId) => dispatch({ type: 'SELECT_TARGET', targetId })}
      />

      <BattleCommandDock
        state={state}
        dispatch={dispatch}
        playback={playback}
        relay={relay}
        commandActorName={commandActor?.name}
        coach={coach}
      />
      <p className="gr-status-line" role="status">
        {playback.isPlaying ? playback.currentBeat?.label : state.message}
      </p>
    </main>
  );
}
