import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import {
  isExecutionWindow,
  previewEnemyPressure,
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
import { GuildFeedbackSettings } from './GuildFeedbackSettings';

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
  const activeActorId = victory ? finisherActorId : order.activeAdventurerId;
  const relay = Math.max(1, ...state.recentEvents.map(({ causalDepth = 1 }) => causalDepth));
  const playback = useCombatPlayback(state.recentEvents, relay, state.preferences);
  const visibleSourceIds = new Set(
    playback.visibleBeats.flatMap(({ sourceEventIds }) => sourceEventIds),
  );
  const visibleEventCount = state.recentEvents.reduce(
    (count, { id }, index) => (visibleSourceIds.has(id) ? index + 1 : count),
    0,
  );
  const displayBattle =
    playback.isPlaying && state.playbackStartBattle
      ? projectBattlePlayback(
          state.playbackStartBattle,
          battle,
          state.recentEvents,
          visibleEventCount,
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
  const commandMember = state.profile.party.find(
    ({ definitionId }) => definitionId === order.activeAdventurerId,
  );
  const skillPreviews = useMemo<ReadonlyMap<string, SkillOutcomePreview>>(() => {
    if (!actor || !target || !commandMember || battle.status !== 'active') return new Map();
    const content = createSkillEngineContent(state.profile);
    return new Map(
      commandMember.skillIds.map((skillId) => [
        skillId,
        previewSkillOutcome({
          battle,
          actorId: actor.id,
          skillId,
          targetId: target.id,
          content,
        }),
      ]),
    );
  }, [actor, battle, commandMember, state.profile, target]);
  const skillPreview = armedSkillId ? skillPreviews.get(armedSkillId) : undefined;
  const executionWindow = isExecutionWindow(battle);
  const displayExecutionWindow = executionWindow && !playback.isPlaying;
  const enemyIntent = playback.isPlaying
    ? undefined
    : (skillPreview?.enemyResponse ?? previewEnemyPressure(battle));

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
          <span>{battle.ascension ? `ASCENSION · ${battle.ascension.name}` : 'QUEST'}</span>
          <h1>{quest.name}</h1>
        </div>
        <div className="gr-battle__header-actions">
          {victory && <strong className="gr-finisher-badge">第六棒 · 終結完成</strong>}
          <details className="gr-battle-menu">
            <summary aria-label="更多戰鬥選項">⋯</summary>
            <div>
              {!victory && (
                <nav className="gr-battle-menu__actions" aria-label="戰鬥選項">
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
                </nav>
              )}
              <GuildFeedbackSettings
                preferences={state.preferences}
                dispatch={dispatch}
                surface="battle"
              />
            </div>
          </details>
        </div>
      </header>

      <CombatBattlefield
        battle={displayBattle}
        preferences={state.preferences}
        tutorialStep={state.tutorialStep}
        currentBeat={playback.currentBeat}
        actingActorId={actingActorId}
        nextActorId={nextActorId}
        relay={relay}
        preview={skillPreview}
        enemyIntent={enemyIntent}
        executionWindow={displayExecutionWindow}
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
        skillPreviews={skillPreviews}
        executionWindow={displayExecutionWindow}
        onChooseSkill={chooseSkill}
      />
      <p className="gr-status-line gr-sr-only" role="status">
        {playback.isPlaying ? playback.currentBeat?.label : state.message}
      </p>
    </main>
  );
}
