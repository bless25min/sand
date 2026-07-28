import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type { BattleUnit, GuildSkillItem, StatusLayers } from '@expedition/shared-types';

import { createSkillTilePresentation, previewCause } from '../presentation/skill-tile-presentation';

const STATUS_LABELS: Readonly<Record<keyof StatusLayers, string>> = {
  burn: '燃',
  poison: '毒',
  tide: '潮',
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
  const component = skill.components[0];
  const presentation = createSkillTilePresentation(skill, preview);
  const targetPreview = preview.units.find(({ id }) => id === target.id)!;
  const effectiveDefense = Math.max(0, target.stats.defense - (target.defenseReduction ?? 0));
  const firstHit = Math.max(
    0,
    actor.stats.attack + component.power + (actor.strengthened ?? 0) - effectiveDefense,
  );
  const affected = preview.units.filter(
    (unit) =>
      unit.damage > 0 ||
      unit.healing > 0 ||
      statusChanges(unit.beforeStatus, unit.afterStatus).length > 0 ||
      unit.beforeDefenseReduction !== unit.afterDefenseReduction ||
      unit.beforeStrengthened !== unit.afterStrengthened,
  );
  const cause = previewCause(preview);

  return (
    <section
      className="gr-skill-outcome-preview"
      data-skill-preview
      data-skill-id={skill.id}
      aria-live="polite"
    >
      <header>
        <span aria-hidden="true">{skill.stars}★</span>
        <strong>{presentation.intentName}</strong>
        <b data-preview-total={preview.totalDamage}>{presentation.primaryValue}</b>
        <i aria-hidden="true">×{presentation.hits}</i>
        {presentation.statusDelta && (
          <em aria-hidden="true">
            {STATUS_LABELS[presentation.statusDelta.kind]}
            {presentation.statusDelta.amount > 0 ? '+' : ''}
            {presentation.statusDelta.amount}
          </em>
        )}
      </header>
      {cause && <p className="gr-preview-cause">{cause}</p>}
      <details className="gr-preview-details">
        <summary>詳細</summary>
        <div className="gr-preview-result" data-preview-section="result">
          <b>結果</b>
          <strong>
            {target.name} {targetPreview.beforeHp} → {targetPreview.afterHp}
          </strong>
          {preview.overkill > 0 && <span>OVERKILL +{preview.overkill}</span>}
        </div>
        <div className="gr-preview-deltas">
          {affected.map((unit) => {
            const source = units.find(({ id }) => id === unit.id);
            return (
              <span data-preview-unit={unit.id} key={unit.id}>
                {source?.name ?? unit.id}
                {unit.damage > 0 ? ` −${unit.damage} HP` : ''}
                {unit.healing > 0 ? ` +${unit.healing} HP` : ''}
                {statusChanges(unit.beforeStatus, unit.afterStatus).map(
                  (change) => ` · ${change.label} ${change.before}→${change.after}`,
                )}
                {unit.beforeDefenseReduction !== unit.afterDefenseReduction
                  ? ` · 防禦降低 ${unit.beforeDefenseReduction}→${unit.afterDefenseReduction}`
                  : ''}
                {unit.beforeStrengthened !== unit.afterStrengthened
                  ? ` · 攻擊增加 ${unit.beforeStrengthened}→${unit.afterStrengthened}`
                  : ''}
              </span>
            );
          })}
        </div>
        <div className="gr-preview-formula" data-preview-section="calculation">
          <b>計算</b>
          <span>攻擊 {actor.stats.attack}</span>
          <i>＋</i>
          <span>技能 {component.power}</span>
          {(actor.strengthened ?? 0) > 0 && (
            <>
              <i>＋</i>
              <span>強化 {actor.strengthened}</span>
            </>
          )}
          <i>－</i>
          <span>防禦 {effectiveDefense}</span>
          <i>＝</i>
          <strong>基本命中 {firstHit}</strong>
        </div>
      </details>
      <small>再點此技能施放；點其他敵人可改變目標並施放</small>
    </section>
  );
}
