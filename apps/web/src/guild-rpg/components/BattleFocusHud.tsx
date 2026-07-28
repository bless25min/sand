import type { GuildBattleState } from '@expedition/shared-types';
import type { SkillOutcomePreview } from '@expedition/simulation-core';

const statusText = (unit: GuildBattleState['units'][number]) =>
  (
    [
      ['燃', unit.statusLayers?.burn ?? 0],
      ['毒', unit.statusLayers?.poison ?? 0],
      ['潮', unit.statusLayers?.tide ?? 0],
    ] as const
  )
    .filter(([, value]) => value > 0)
    .map(([label, value]) => `${label}${value}`)
    .join(' ');

export function BattleFocusHud({
  battle,
  actorId,
  preview,
}: {
  battle: GuildBattleState;
  actorId?: string | undefined;
  preview?: SkillOutcomePreview | undefined;
}) {
  const actor = battle.units.find(({ id }) => id === actorId);
  const target = battle.units.find(({ id }) => id === battle.selectedTargetId);
  const targetPreview = preview?.units.find(({ id }) => id === target?.id);

  return (
    <div className="gr-focus-hud">
      {actor && (
        <article className="gr-focus-card" data-focus-actor={actor.id}>
          <strong>{actor.name}</strong>
          <span>
            HP {actor.currentHp}/{actor.stats.hp}
          </span>
          <small>
            攻 {actor.stats.attack} · 防{' '}
            {Math.max(0, actor.stats.defense - (actor.defenseReduction ?? 0))}
          </small>
        </article>
      )}
      {target && (
        <article className="gr-focus-card gr-focus-card--target" data-focus-target={target.id}>
          <strong>{target.name}</strong>
          <span>
            HP {target.currentHp}
            {targetPreview ? ` → ${targetPreview.afterHp}` : `/${target.stats.hp}`}
          </span>
          <small>
            防 {Math.max(0, target.stats.defense - (target.defenseReduction ?? 0))}
            {statusText(target) ? ` · ${statusText(target)}` : ''}
          </small>
        </article>
      )}
    </div>
  );
}
