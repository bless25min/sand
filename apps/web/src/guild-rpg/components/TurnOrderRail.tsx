import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function TurnOrderRail({
  state,
  dispatch,
  locked = false,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  locked?: boolean;
}) {
  const order = state.battle?.roundOrder;
  if (!order) return null;
  const victory = state.battle?.status === 'victory';
  const finisherActorId = victory
    ? state.recentEvents.find(({ kind }) => kind === 'finisher')?.actorId
    : undefined;
  const guideHeroId = order.currentOrder.find(
    (heroId) => !order.actedIds.includes(heroId) && heroId !== order.activeAdventurerId,
  );
  return (
    <section className="gr-turn-order" aria-label="本回合六人出手順序">
      {order.currentOrder.map((heroId, index) => {
        const hero = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === heroId)!;
        const acted = order.actedIds.includes(heroId);
        const active = victory ? finisherActorId === heroId : order.activeAdventurerId === heroId;
        const alive = (state.battle?.units.find(({ id }) => id === heroId)?.currentHp ?? 0) > 0;
        return (
          <button
            type="button"
            data-order-hero={heroId}
            data-active={active}
            data-acted={victory ? !active : acted}
            data-guide-id={heroId === guideHeroId ? 'order:next' : undefined}
            data-guide-active={
              heroId === guideHeroId
                ? isFirstHuntCoachFocus(
                    state.preferences.tutorial,
                    state.tutorialStep,
                    'order:next',
                  )
                : undefined
            }
            disabled={locked || victory || acted || !alive || active}
            key={heroId}
            onClick={() => dispatch({ type: 'CHOOSE_NEXT_HERO', adventurerId: heroId })}
          >
            <span>{index + 1}</span>
            <strong>{hero.name}</strong>
            <small>
              {victory
                ? active
                  ? '終結者'
                  : '已完成'
                : active
                  ? '目前出手'
                  : acted
                    ? '已行動'
                    : '點擊改為下一位'}
            </small>
          </button>
        );
      })}
    </section>
  );
}
