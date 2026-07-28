import type { BattleUnit, GuildSkillItem, StatusLayers } from '@expedition/shared-types';
import type { SkillOutcomePreview } from '@expedition/simulation-core';

import { specializationName, triggerName } from '../content-labels';

const STATUS_LABELS: Readonly<Record<keyof StatusLayers, string>> = {
  burn: '燃燒',
  poison: '毒素',
  tide: '蓄潮',
};

const statusChanges = (
  before: StatusLayers,
  after: StatusLayers,
): readonly { label: string; before: number; after: number }[] =>
  (Object.keys(STATUS_LABELS) as (keyof StatusLayers)[])
    .filter((key) => before[key] !== after[key])
    .map((key) => ({ label: STATUS_LABELS[key], before: before[key], after: after[key] }));

export function SkillOutcomePreviewPanel({
  actor,
  target,
  skill,
  preview,
  units,
}: {
  actor: BattleUnit;
  target: BattleUnit;
  skill: GuildSkillItem;
  preview: SkillOutcomePreview;
  units: readonly BattleUnit[];
}) {
  const component = skill.components[0]!;
  const targetPreview = preview.units.find(({ id }) => id === target.id)!;
  const effectiveDefense = Math.max(0, target.stats.defense - (target.defenseReduction ?? 0));
  const firstHit = Math.max(
    0,
    actor.stats.attack + component.power + (actor.strengthened ?? 0) - effectiveDefense,
  );
  const hitEvents = preview.events.filter(({ kind }) => kind === 'damage' || kind === 'reaction');
  const triggeredEvents = preview.events.filter(({ kind }) => kind === 'triggered');
  const affected = preview.units.filter(
    ({
      damage,
      healing,
      beforeStatus,
      afterStatus,
      beforeDefenseReduction,
      afterDefenseReduction,
      beforeStrengthened,
      afterStrengthened,
    }) =>
      damage > 0 ||
      healing > 0 ||
      statusChanges(beforeStatus, afterStatus).length > 0 ||
      beforeDefenseReduction !== afterDefenseReduction ||
      beforeStrengthened !== afterStrengthened,
  );

  return (
    <section
      className="gr-skill-outcome-preview"
      data-skill-preview
      data-skill-id={skill.id}
      aria-live="polite"
    >
      <header>
        <span>{skill.stars}★</span>
        <strong>{skill.name}</strong>
        <span className="gr-preview-link">
          {specializationName(component.specializationId)} × {triggerName(component.triggerId)}
          {triggeredEvents.length > 0 ? ' ✓' : ' 待條件'}
        </span>
        <b data-preview-total={preview.totalDamage}>預計 {preview.totalDamage}</b>
      </header>
      <div className="gr-preview-formula">
        <span>攻 {actor.stats.attack}</span>
        <i>＋</i>
        <span>技 {component.power}</span>
        {(actor.strengthened ?? 0) > 0 && (
          <>
            <i>＋</i>
            <span>強 {actor.strengthened}</span>
          </>
        )}
        <i>－</i>
        <span>防 {effectiveDefense}</span>
        <i>＝</i>
        <strong>首擊 {firstHit}</strong>
      </div>
      <div className="gr-preview-result">
        <strong>
          {target.name} HP {targetPreview.beforeHp} → {targetPreview.afterHp}
        </strong>
        <span>{hitEvents.length} 次傷害</span>
        {triggeredEvents.length > 0 && <span>追加 {triggeredEvents.length} 次</span>}
        {preview.overkill > 0 && <span>OVERKILL +{preview.overkill}</span>}
      </div>
      <div className="gr-preview-deltas">
        {affected.map((unit) => {
          const source = units.find(({ id }) => id === unit.id);
          return (
            <span data-preview-unit={unit.id} key={unit.id}>
              {source?.name ?? unit.id}
              {unit.damage > 0 ? ` −${unit.damage}` : ''}
              {unit.healing > 0 ? ` +${unit.healing}HP` : ''}
              {statusChanges(unit.beforeStatus, unit.afterStatus).map(
                (change) => ` · ${change.label} ${change.before}→${change.after}`,
              )}
              {unit.beforeDefenseReduction !== unit.afterDefenseReduction
                ? ` · 削防 ${unit.beforeDefenseReduction}→${unit.afterDefenseReduction}`
                : ''}
              {unit.beforeStrengthened !== unit.afterStrengthened
                ? ` · 強化 ${unit.beforeStrengthened}→${unit.afterStrengthened}`
                : ''}
            </span>
          );
        })}
      </div>
      <small>點敵人施放；再點此技能則攻擊目前目標</small>
    </section>
  );
}
