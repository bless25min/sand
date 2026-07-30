import type { EnemyPressureIntent, GuildBattleState } from '@expedition/shared-types';
import type { GuildCombatScene, GuildCombatSceneUnit } from '@expedition/pixi-renderer';

import { isFirstHuntCoachFocus, type FirstHuntCoachStep } from '../onboarding/first-hunt-coach';
import type { GuildPreferences } from '../preferences/guild-preferences';

interface BattlefieldUnitControlsProps {
  battle: GuildBattleState;
  scene: GuildCombatScene;
  preferences: GuildPreferences;
  tutorialStep: FirstHuntCoachStep;
  locked: boolean;
  onSelectTarget(targetId: string): void;
  onChooseHero(adventurerId: string): void;
}

const statusValues = (unit: GuildCombatSceneUnit) =>
  [
    ['burn', '燃', unit.statusLayers.burn],
    ['poison', '毒', unit.statusLayers.poison],
    ['tide', '潮', unit.statusLayers.tide],
  ] as const;

const intentLabel = (outcome: 'damage' | 'guard' | 'dodge', amount: number) =>
  outcome === 'damage' ? `危險 ${amount}` : outcome === 'dodge' ? '閃避' : '格擋';

function IntentGlyph({
  source,
  outcome,
}: {
  source: boolean;
  outcome: EnemyPressureIntent['outcome'];
}) {
  return (
    <svg viewBox="0 0 24 24" data-intent-glyph={source ? 'source' : outcome} aria-hidden="true">
      {source ? (
        <path d="m7 17 10-10m-8-2 10 10m-3-9 3 3M5 15l4 4-3 1-2-2 1-3Z" />
      ) : outcome === 'damage' ? (
        <path d="m13 2-8 12h6l-1 8 9-13h-6V2Z" />
      ) : outcome === 'dodge' ? (
        <path d="M4 8h11l-3-3m3 3-3 3M20 16H9l3-3m-3 3 3 3" />
      ) : (
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Zm0 4v9" />
      )}
    </svg>
  );
}

const controlLabel = (
  unit: GuildCombatSceneUnit,
  battle: GuildBattleState,
  acted: boolean,
  previewing: boolean,
  intent?: EnemyPressureIntent,
) => {
  const source = battle.units.find(({ id }) => id === unit.id);
  const hp = source
    ? `${source.currentHp} / ${source.stats.hp}`
    : `${Math.round(unit.hpRatio * 100)}%`;
  if (unit.side === 'enemies') {
    const selected = battle.selectedTargetId === unit.id;
    const counter = unit.enemyIntentRole === 'source' ? '，即將反擊' : '';
    return `${unit.name}${counter}，${previewing ? '點擊切換預演目標' : selected ? '目前目標' : '點擊鎖定'}，生命 ${hp}`;
  }
  const active = battle.roundOrder?.activeAdventurerId === unit.id;
  const danger =
    intent?.targetId === unit.id ? `，反擊預告${intentLabel(intent.outcome, intent.amount)}` : '';
  return `${unit.name}${danger}，${active ? '目前出手' : acted ? '已行動' : '點擊改為出手角色'}，生命 ${hp}`;
};

export function BattlefieldUnitControls({
  battle,
  scene,
  preferences,
  tutorialStep,
  locked,
  onSelectTarget,
  onChooseHero,
}: BattlefieldUnitControlsProps) {
  const order = battle.roundOrder;
  const guideHeroId = order?.currentOrder.find(
    (heroId) => !order.actedIds.includes(heroId) && heroId !== order.activeAdventurerId,
  );

  return (
    <div className="gr-battle-unit-controls" aria-label="戰場人物操作">
      {scene.units.map((unit, index) => {
        const defeated = unit.hpRatio <= 0;
        const previewing = unit.side === 'enemies' && scene.preview !== undefined;
        const acted = order?.actedIds.includes(unit.id) ?? false;
        const active = order?.activeAdventurerId === unit.id;
        const intent = scene.enemyIntent;
        const intentSource = intent?.enemyId === unit.id;
        const intentTarget = intent?.targetId === unit.id;
        const guideId =
          unit.side === 'enemies' &&
          index === scene.units.findIndex(({ side }) => side === 'enemies')
            ? 'target:first'
            : unit.side === 'heroes' && unit.id === guideHeroId
              ? 'order:next'
              : undefined;
        const guideActive = Boolean(
          guideId &&
          isFirstHuntCoachFocus(
            preferences.tutorial,
            tutorialStep,
            guideId,
            unit.side === 'enemies' ? { battleStatus: battle.status } : undefined,
          ),
        );
        const disabled =
          locked ||
          defeated ||
          battle.status !== 'active' ||
          (unit.side === 'heroes' && (acted || active));
        return (
          <button
            type="button"
            aria-label={controlLabel(unit, battle, acted, previewing, intent)}
            aria-pressed={
              unit.side === 'enemies'
                ? battle.selectedTargetId === unit.id
                : order?.activeAdventurerId === unit.id
            }
            data-battle-unit={unit.id}
            data-battle-side={unit.side}
            data-enemy-formation={unit.side === 'enemies' ? unit.id : undefined}
            data-hero-formation={unit.side === 'heroes' ? unit.id : undefined}
            data-targeted={unit.side === 'enemies' && battle.selectedTargetId === unit.id}
            data-current={unit.side === 'heroes' && active}
            data-next={unit.side === 'heroes' && unit.state === 'next'}
            data-combo-ready={unit.side === 'heroes' && unit.comboReady}
            data-acted={unit.side === 'heroes' && acted}
            data-defeated={defeated}
            data-preview-ready={previewing}
            data-enemy-intent-source={intentSource || undefined}
            data-enemy-intent-target={intentTarget || undefined}
            data-enemy-intent-outcome={intentTarget ? intent?.outcome : undefined}
            data-guide-id={guideId}
            data-guide-active={guideId ? guideActive : undefined}
            disabled={disabled}
            key={unit.id}
            style={{
              left: `${(unit.x / scene.width) * 100}%`,
              top: `${(unit.y / scene.height) * 100}%`,
            }}
            onClick={() =>
              unit.side === 'enemies' ? onSelectTarget(unit.id) : onChooseHero(unit.id)
            }
          >
            {guideActive && (
              <span className="gr-guide-callout" role="status">
                {unit.side === 'enemies' ? '點敵人鎖定' : '點角色換順序'}
              </span>
            )}
            {(intentSource || intentTarget) && intent && (
              <span className="gr-enemy-intent-cue" aria-hidden="true">
                <IntentGlyph source={intentSource} outcome={intent.outcome} />
                {!intentSource && intent.outcome === 'damage' && <b>{intent.amount}</b>}
              </span>
            )}
            <span className="gr-unit-fallback" aria-hidden="true">
              <b>{unit.name}</b>
              <i>
                {battle.units.find(({ id }) => id === unit.id)?.currentHp ?? 0} /{' '}
                {battle.units.find(({ id }) => id === unit.id)?.stats.hp ?? 0}
              </i>
              {unit.side === 'enemies' &&
                statusValues(unit).map(([kind, label, value]) =>
                  value > 0 ? (
                    <em key={kind}>
                      {label}
                      {value}
                    </em>
                  ) : null,
                )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
