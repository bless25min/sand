import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import {
  previewSkillOutcome,
  projectBattlePlayback,
  type SkillOutcomePreview,
} from '@expedition/simulation-core';
import { useEffect, useMemo, useState } from 'react';

import { useCombatPlayback } from '../hooks/use-combat-playback';
import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import { chooseSkillIntent, chooseTargetIntent } from '../presentation/skill-command-intent';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { BattleCommandDock } from './BattleCommandDock';
import { CombatBattlefield } from './CombatBattlefield';

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
  const [armedSkillId, setArmedSkillId] = useState<string>();
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
  const displayBattle =
    playback.isPlaying && state.playbackStartBattle
      ? projectBattlePlayback(
          state.playbackStartBattle,
          battle,
          state.recentEvents,
          playback.visibleBeats.length,
        )
      : battle;
  const displayTargetHp = displayBattle.units.find(
    ({ id }) => id === displayBattle.selectedTargetId,
  )?.currentHp;
  const actingActorId = playback.isPlaying && recentActorId ? recentActorId : activeActorId;
  const nextActorId = victory
    ? undefined
    : playback.isPlaying
      ? order.activeAdventurerId
      : order.currentOrder.find(
          (heroId) => heroId !== order.activeAdventurerId && !order.actedIds.includes(heroId),
        );
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
  const actor = battle.units.find(({ id }) => id === order.activeAdventurerId);
  const target = battle.units.find(({ id }) => id === battle.selectedTargetId);
  const skillPreview = useMemo<SkillOutcomePreview | undefined>(() => {
    if (!armedSkillId || !actor || !target || battle.status !== 'active') return undefined;
    return previewSkillOutcome({
      battle,
      actorId: actor.id,
      skillId: armedSkillId,
      targetId: target.id,
      content: createSkillEngineContent(state.profile),
    });
  }, [actor, armedSkillId, battle, state.profile, target]);

  useEffect(() => {
    setArmedSkillId(undefined);
  }, [battle.status, order.activeAdventurerId]);

  const castSkill = (skillId: string, targetId: string) => {
    setArmedSkillId(undefined);
    dispatch({ type: 'USE_SKILL', skillId, targetId });
  };
  const chooseSkill = (skillId: string) => {
    const intent = chooseSkillIntent(armedSkillId, skillId, battle.selectedTargetId);
    if ('cast' in intent) {
      castSkill(intent.cast.skillId, intent.cast.targetId);
      return;
    }
    if ('arm' in intent) setArmedSkillId(intent.arm);
  };
  const chooseTarget = (targetId: string) => {
    const intent = chooseTargetIntent(armedSkillId, targetId);
    if ('cast' in intent) {
      castSkill(intent.cast.skillId, intent.cast.targetId);
      return;
    }
    if ('select' in intent) dispatch({ type: 'SELECT_TARGET', targetId: intent.select });
  };

  return (
    <main
      className="gr-battle"
      data-playback={playback.isPlaying}
      data-shell="single-screen"
      data-display-target-hp={displayTargetHp}
    >
      <header className="gr-battle__header">
        <div>
          <span>QUEST</span>
          <h1>{quest.name}</h1>
        </div>
        {victory ? (
          <strong className="gr-finisher-badge">第六棒 · 終結完成</strong>
        ) : (
          <details className="gr-battle-menu">
            <summary aria-label="更多戰鬥選項">⋯</summary>
            <div>
              <button
                type="button"
                disabled={playback.isPlaying}
                onClick={() => dispatch({ type: 'RESET_CURRENT_ORDER' })}
              >
                重設順序
              </button>
              <button
                type="button"
                disabled={playback.isPlaying}
                aria-pressed={order.carryCurrentOrder}
                onClick={() =>
                  dispatch({
                    type: 'SET_CARRY_ORDER',
                    enabled: !order.carryCurrentOrder,
                  })
                }
              >
                {order.carryCurrentOrder ? '取消沿用' : '沿用順序'}
              </button>
              <button
                type="button"
                disabled={playback.isPlaying}
                onClick={() => dispatch({ type: 'ABANDON_HUNT' })}
              >
                撤離
              </button>
            </div>
          </details>
        )}
      </header>

      <CombatBattlefield
        battle={displayBattle}
        preferences={state.preferences}
        tutorialStep={state.tutorialStep}
        currentBeat={playback.currentBeat}
        visibleBeats={playback.visibleBeats}
        actingActorId={actingActorId}
        nextActorId={nextActorId}
        relay={relay}
        preview={skillPreview}
        locked={playback.isPlaying}
        onSelectTarget={chooseTarget}
        onChooseHero={(adventurerId) => {
          setArmedSkillId(undefined);
          dispatch({ type: 'CHOOSE_NEXT_HERO', adventurerId });
        }}
      />

      <BattleCommandDock
        state={state}
        dispatch={dispatch}
        playback={playback}
        relay={relay}
        commandActorName={commandActor?.name}
        coach={coach}
        armedSkillId={armedSkillId}
        preview={skillPreview}
        onChooseSkill={chooseSkill}
      />
      <p className="gr-status-line gr-sr-only" role="status">
        {playback.isPlaying ? playback.currentBeat?.label : state.message}
      </p>
    </main>
  );
}
