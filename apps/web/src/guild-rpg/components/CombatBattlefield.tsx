import type { BattleUnit, GuildBattleState } from '@expedition/shared-types';
import { lazy, Suspense } from 'react';

import { isFirstHuntCoachFocus, type FirstHuntCoachStep } from '../onboarding/first-hunt-coach';
import type { GuildPreferences } from '../preferences/guild-preferences';
import { createBattleScene } from '../presentation/battle-scene';
import { relayPresentation, type CombatBeat } from '../presentation/combat-beats';

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
}

const hpPercent = (unit: BattleUnit) =>
  `${Math.max(0, Math.min(100, (unit.currentHp / unit.stats.hp) * 100))}%`;

function StatusPips({ unit }: { unit: BattleUnit }) {
  const layers = unit.statusLayers;
  const visible = [
    ['燃', layers?.burn ?? 0, 'burn'],
    ['毒', layers?.poison ?? 0, 'poison'],
    ['潮', layers?.tide ?? 0, 'tide'],
  ] as const;
  return (
    <span className="gr-target-status" aria-label={`${unit.name}狀態`}>
      {visible.map(([label, value, kind]) => (
        <i data-status={kind} data-empty={value === 0} key={kind}>
          {label}
          {value}
        </i>
      ))}
    </span>
  );
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
}: CombatBattlefieldProps) {
  const stage = relayPresentation(relay);
  const enemies = battle.units.filter(({ side }) => side === 'enemies');
  const heroes = battle.units.filter(({ side }) => side === 'heroes');
  const actor = heroes.find(({ id }) => id === actingActorId);
  const nextActor = heroes.find(({ id }) => id === nextActorId);
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
    >
      <header className="gr-battlefield-readout">
        <span>{stage.label}</span>
        <strong>
          {currentBeat?.visual.headline ?? (locked ? '軍令演出中' : '選技能，立即出招')}
        </strong>
        <small>
          {actor?.name ?? '結算中'} → {nextActor?.name ?? '終結'}
        </small>
      </header>

      <div className="gr-target-rack" aria-label="選擇敵人">
        {enemies.map((enemy, index) => (
          <button
            type="button"
            data-enemy-formation={enemy.id}
            data-targeted={battle.selectedTargetId === enemy.id}
            data-defeated={enemy.currentHp <= 0}
            data-guide-id={index === 0 ? 'target:first' : undefined}
            data-guide-active={
              index === 0
                ? isFirstHuntCoachFocus(preferences.tutorial, tutorialStep, 'target:first')
                : undefined
            }
            disabled={locked || enemy.currentHp <= 0}
            key={enemy.id}
            onClick={() => onSelectTarget(enemy.id)}
          >
            <span>
              <strong>{enemy.name}</strong>
              <small>
                {enemy.currentHp <= 0
                  ? '擊破'
                  : battle.selectedTargetId === enemy.id
                    ? '已鎖定'
                    : '鎖定'}
              </small>
            </span>
            <span className="gr-target-hp">
              <i style={{ width: hpPercent(enemy) }} />
            </span>
            <StatusPips unit={enemy} />
          </button>
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

      {currentBeat && (
        <div
          className="gr-impact-callout"
          data-combat-beat={currentBeat.kind}
          data-element={currentBeat.element}
          role="status"
        >
          <span>{currentBeat.visual.headline}</span>
          {currentBeat.visual.number !== undefined && (
            <strong key={currentBeat.id}>
              {currentBeat.visual.number > 0 ? '+' : ''}
              {currentBeat.visual.number}
            </strong>
          )}
          <small>{currentBeat.visual.detail}</small>
        </div>
      )}

      <div className="gr-formation-rail" aria-label="遠征隊戰場狀態">
        {heroes.map((hero) => (
          <article
            data-hero-formation={hero.id}
            data-current={hero.id === actingActorId}
            data-next={hero.id === nextActorId}
            data-defeated={hero.currentHp <= 0}
            key={hero.id}
          >
            <b>{hero.name.slice(0, 1)}</b>
            <span>
              <strong>{hero.name}</strong>
              <small>
                {hero.id === actingActorId ? '出手' : hero.id === nextActorId ? '下一棒' : '待命'}
              </small>
            </span>
            <i>
              <i style={{ width: hpPercent(hero) }} />
            </i>
          </article>
        ))}
      </div>

      <details className="gr-combat-log">
        <summary>戰鬥詳情 · {visibleBeats.length} 個事件</summary>
        <ol>
          {visibleBeats.map((beat) => (
            <li data-beat-kind={beat.kind} key={beat.id}>
              <strong>{beat.visual.headline}</strong>
              <span>{beat.visual.detail}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
