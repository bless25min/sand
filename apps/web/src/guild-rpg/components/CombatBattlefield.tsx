import type { EnemyPressureIntent, GuildBattleState } from '@expedition/shared-types';
import type { SkillOutcomePreview } from '@expedition/simulation-core';
import { lazy, Suspense } from 'react';

import { useBattlefieldLayout } from '../hooks/use-battlefield-layout';
import type { FirstHuntCoachStep } from '../onboarding/first-hunt-coach';
import type { GuildPreferences } from '../preferences/guild-preferences';
import { createBattleScene } from '../presentation/battle-scene';
import { createCombatBeatCue, shouldShowCombatBeatCue } from '../presentation/combat-beat-cue';
import { relayPresentation, type CombatBeat } from '../presentation/combat-beats';
import { BattlefieldUnitControls } from './BattlefieldUnitControls';

const PixiCombatStage = lazy(async () => {
  const module = await import('./PixiCombatStage');
  return { default: module.PixiCombatStage };
});

interface CombatBattlefieldProps {
  battle: GuildBattleState;
  preferences: GuildPreferences;
  tutorialStep: FirstHuntCoachStep;
  currentBeat?: CombatBeat | undefined;
  actingActorId?: string | undefined;
  nextActorId?: string | undefined;
  relay: number;
  preview?: SkillOutcomePreview | undefined;
  enemyIntent?: EnemyPressureIntent | undefined;
  executionWindow: boolean;
  locked: boolean;
  onSelectTarget(targetId: string): void;
  onChooseHero(adventurerId: string): void;
}

export function CombatBattlefield({
  battle,
  preferences,
  tutorialStep,
  currentBeat,
  actingActorId,
  nextActorId,
  relay,
  preview,
  enemyIntent,
  executionWindow,
  locked,
  onSelectTarget,
  onChooseHero,
}: CombatBattlefieldProps) {
  const stage = relayPresentation(relay);
  const beatCue = currentBeat ? createCombatBeatCue(currentBeat) : undefined;
  const layout = useBattlefieldLayout();
  const scene = createBattleScene(battle, {
    relay,
    layout,
    ...(actingActorId ? { actingActorId } : {}),
    ...(nextActorId ? { nextActorId } : {}),
    ...(currentBeat ? { event: currentBeat.visual } : {}),
    ...(preview ? { preview } : {}),
    ...(enemyIntent ? { enemyIntent } : {}),
    ...(executionWindow ? { executionWindow: true } : {}),
  });
  const focusActor = battle.units.find(
    ({ id }) => id === (actingActorId ?? battle.roundOrder?.activeAdventurerId),
  );
  const focusTarget = battle.units.find(({ id }) => id === battle.selectedTargetId);
  const targetPreview = preview?.units.find(({ id }) => id === focusTarget?.id);
  const targetDefense = focusTarget
    ? Math.max(0, focusTarget.stats.defense - (focusTarget.defenseReduction ?? 0))
    : 0;

  return (
    <section
      className="gr-combat-battlefield"
      aria-label="戰鬥畫面"
      data-combat-battlefield="true"
      data-relay-tier={stage.relay}
      data-finisher={stage.finisher}
      data-locked={locked}
      data-current-actor={actingActorId}
      data-next-actor={nextActorId}
      data-animation-first="true"
      data-battlefield-layout={layout}
      data-execution-window={executionWindow}
      data-enemy-intent={enemyIntent?.outcome}
    >
      <div className="gr-relay-energy" aria-label={`接力能量 ${stage.relay} / 6`}>
        {Array.from({ length: 6 }, (_, index) => (
          <i
            data-relay-energy={index + 1}
            data-active={index < stage.relay}
            aria-hidden="true"
            key={index}
          />
        ))}
      </div>

      {focusActor && focusTarget && (
        <div className="gr-battle-focus-hud">
          <section data-battle-hud="actor" data-hud-unit={focusActor.id}>
            <span>目前角色</span>
            <strong>{focusActor.name}</strong>
            <b>
              HP {focusActor.currentHp}/{focusActor.stats.hp}
            </b>
            <small>
              攻 {focusActor.stats.attack}
              {(focusActor.strengthened ?? 0) > 0 && ` · 強化 +${focusActor.strengthened}`}
            </small>
          </section>
          <section data-battle-hud="target" data-hud-unit={focusTarget.id}>
            <span>目前目標</span>
            <strong>{focusTarget.name}</strong>
            <b data-preview-hp={targetPreview ? 'true' : undefined}>
              HP{' '}
              {targetPreview
                ? `${targetPreview.beforeHp} → ${targetPreview.afterHp}`
                : `${focusTarget.currentHp}/${focusTarget.stats.hp}`}
            </b>
            <small>
              防 {targetDefense}
              {(focusTarget.defenseReduction ?? 0) > 0 && ` · 削弱 ${focusTarget.defenseReduction}`}
            </small>
          </section>
        </div>
      )}

      {executionWindow && (
        <div className="gr-execution-window" role="status">
          <span>EXECUTION WINDOW</span>
          <strong>敵軍破勢</strong>
          <small>選擇第六棒終結型態</small>
        </div>
      )}

      <Suspense
        fallback={
          <div
            className="gr-pixi-combat-stage"
            data-pixi-combat-stage="true"
            data-renderer="loading"
          >
            <div data-combat-canvas-host="true" />
          </div>
        }
      >
        <PixiCombatStage scene={scene} reducedMotion={preferences.motion === 'reduced'} />
      </Suspense>

      <BattlefieldUnitControls
        battle={battle}
        scene={scene}
        preferences={preferences}
        tutorialStep={tutorialStep}
        locked={locked}
        onSelectTarget={onSelectTarget}
        onChooseHero={onChooseHero}
      />

      {currentBeat && (
        <>
          {shouldShowCombatBeatCue(currentBeat) && (
            <div
              className="gr-impact-callout"
              data-combat-beat={currentBeat.kind}
              data-combat-cue={beatCue?.tone}
              data-trigger-id={currentBeat.visual.triggerId}
              data-combo-index={currentBeat.comboIndex}
              data-element={currentBeat.element}
              aria-hidden="true"
            >
              {beatCue && (
                <small>
                  <span>{beatCue.eyebrow}</span>
                  <b>{beatCue.label}</b>
                </small>
              )}
              {currentBeat.visual.number !== undefined && (
                <strong key={currentBeat.id}>
                  {currentBeat.visual.number > 0 ? '+' : ''}
                  {currentBeat.visual.number}
                </strong>
              )}
            </div>
          )}
          <p className="gr-sr-only" role="status">
            {currentBeat.label}
          </p>
        </>
      )}
    </section>
  );
}
