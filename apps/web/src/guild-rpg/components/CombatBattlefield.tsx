import type { BattleUnit, GuildBattleState } from '@expedition/shared-types';

import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildPreferences } from '../preferences/guild-preferences';
import { relayPresentation, type CombatBeat } from '../presentation/combat-beats';
import type { FirstHuntCoachStep } from '../onboarding/first-hunt-coach';

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

function StatusLayers({ unit }: { unit: BattleUnit }) {
  const layers = unit.statusLayers;
  return (
    <div className="gr-formation-status" aria-label={`${unit.name}狀態`}>
      <span data-status="burn">燃 {layers?.burn ?? 0}</span>
      <span data-status="poison">毒 {layers?.poison ?? 0}</span>
      <span data-status="tide">潮 {layers?.tide ?? 0}</span>
    </div>
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
  const impactTarget = currentBeat?.targetId ?? battle.selectedTargetId;
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
        <strong>{locked ? '軍令演出中' : '選擇技能，立即出招'}</strong>
        <small>
          目前：{heroes.find(({ id }) => id === actingActorId)?.name ?? '結算中'} · 下一位：
          {heroes.find(({ id }) => id === nextActorId)?.name ?? '終結'}
        </small>
      </header>

      <div className="gr-combat-enemies" aria-label="敵方軍勢">
        {enemies.map((enemy, index) => (
          <button
            type="button"
            data-enemy-formation={enemy.id}
            data-targeted={battle.selectedTargetId === enemy.id}
            data-impacted={impactTarget === enemy.id}
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
            <span className="gr-formation-figure" aria-hidden="true">
              <i />
              <i />
              <i />
              <b />
            </span>
            <span className="gr-formation-copy">
              <small>
                {enemy.currentHp <= 0
                  ? '已擊破'
                  : battle.selectedTargetId === enemy.id
                    ? '鎖定目標'
                    : '點擊鎖定'}
              </small>
              <strong>{enemy.name}</strong>
              <span>
                HP {enemy.currentHp} / {enemy.stats.hp}
              </span>
              <span className="gr-hp">
                <i style={{ width: hpPercent(enemy) }} />
              </span>
              <StatusLayers unit={enemy} />
            </span>
          </button>
        ))}
      </div>

      <div className="gr-combat-impact" data-combat-beat={currentBeat?.kind} aria-live="polite">
        <svg
          data-target-route="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M 18 82 Q 52 52 80 18" />
          <path d="M 22 78 Q 53 60 78 47" />
          <path d="M 24 82 Q 58 78 82 76" />
        </svg>
        <div className="gr-impact-rings" aria-hidden="true">
          {Array.from({ length: stage.trailCount }, (_, index) => (
            <i style={{ '--ring': index } as React.CSSProperties} key={index} />
          ))}
        </div>
        <div className="gr-impact-copy" data-element={currentBeat?.element}>
          <span>{stage.finisher ? 'SIXTH RELAY FINISHER' : 'IMMEDIATE RELAY'}</span>
          <strong>{currentBeat?.label ?? '鎖定敵人，從六個技能中選擇一招'}</strong>
          {currentBeat?.amount !== undefined && (
            <b key={currentBeat.id}>
              {currentBeat.kind === 'support' ? '+' : '−'}
              {currentBeat.amount}
            </b>
          )}
        </div>
        <div className="gr-event-ribbon" aria-label="本次技能事件">
          {visibleBeats.slice(-5).map((beat) => (
            <span data-beat-kind={beat.kind} key={beat.id}>
              {beat.label}
            </span>
          ))}
        </div>
      </div>

      <div className="gr-combat-heroes" aria-label="遠征隊">
        {heroes.map((hero) => (
          <article
            data-hero-formation={hero.id}
            data-current={hero.id === actingActorId}
            data-next={hero.id === nextActorId}
            data-defeated={hero.currentHp <= 0}
            key={hero.id}
          >
            <span className="gr-hero-sigil" aria-hidden="true">
              <i />
              <b>{hero.name.slice(0, 1)}</b>
            </span>
            <span>
              <small>
                {hero.id === actingActorId ? '出手中' : hero.id === nextActorId ? '下一棒' : '待命'}
              </small>
              <strong>{hero.name}</strong>
              <span className="gr-hp">
                <i style={{ width: hpPercent(hero) }} />
              </span>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
