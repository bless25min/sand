import type { GuildBattleState } from '@expedition/shared-types';
import { lazy, Suspense } from 'react';

import type { FirstHuntCoachStep } from '../onboarding/first-hunt-coach';
import type { GuildPreferences } from '../preferences/guild-preferences';
import { createBattleScene } from '../presentation/battle-scene';
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
  visibleBeats: readonly CombatBeat[];
  actingActorId?: string | undefined;
  nextActorId?: string | undefined;
  relay: number;
  locked: boolean;
  onSelectTarget(targetId: string): void;
  onChooseHero(adventurerId: string): void;
}

export function CombatBattlefield({
  battle,
  preferences,
  tutorialStep,
  currentBeat,
  visibleBeats,
  actingActorId,
  nextActorId,
  relay,
  locked,
  onSelectTarget,
  onChooseHero,
}: CombatBattlefieldProps) {
  const stage = relayPresentation(relay);
  const scene = createBattleScene(battle, {
    relay,
    ...(actingActorId ? { actingActorId } : {}),
    ...(nextActorId ? { nextActorId } : {}),
    ...(currentBeat ? { event: currentBeat.visual } : {}),
  });
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
          <div
            className="gr-impact-callout"
            data-combat-beat={currentBeat.kind}
            data-element={currentBeat.element}
            aria-hidden="true"
          >
            {currentBeat.visual.number !== undefined && (
              <strong key={currentBeat.id}>
                {currentBeat.visual.number > 0 ? '+' : ''}
                {currentBeat.visual.number}
              </strong>
            )}
          </div>
          <p className="gr-sr-only" role="status">
            {currentBeat.visual.headline}。{currentBeat.visual.detail}。已播放 {visibleBeats.length}{' '}
            個事件。
          </p>
        </>
      )}
    </section>
  );
}
