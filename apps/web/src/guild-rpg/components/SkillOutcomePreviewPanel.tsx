import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type { BattleUnit, GuildSkillItem, StatusLayers } from '@expedition/shared-types';

import { createSkillTilePresentation } from '../presentation/skill-tile-presentation';

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
  const relay = preview.nextRelay
    ? units.find(({ id }) => id === preview.nextRelay?.actorId)
    : undefined;
  const totalLabel = presentation.primaryKind === 'healing' ? '總療' : '總傷';

  if (preview.executionWindow) {
    const finalExecution = preview.finisherPower > 0;
    return (
      <section
        className="gr-skill-outcome-preview gr-skill-outcome-preview--execution"
        data-skill-preview
        data-execution-preview
        data-final-execution={finalExecution}
        data-skill-id={skill.id}
        aria-live="polite"
      >
        <header>
          <span aria-hidden="true">{skill.stars}★</span>
          <strong>{presentation.intentName}</strong>
          <b className="gr-execution-preview-title">{finalExecution ? '處刑預演' : '餘震回收'}</b>
        </header>
        <div
          className="gr-execution-preview-rail"
          aria-label={finalExecution ? '第六棒處刑流程' : '破勢接力流程'}
        >
          <span>敵軍破勢</span>
          <i aria-hidden="true">→</i>
          <strong>回收{preview.relayEchoes}次</strong>
          <i aria-hidden="true">→</i>
          <b>{finalExecution ? '全軍終結' : '第六棒蓄勢'}</b>
        </div>
        <div className="gr-preview-totals gr-preview-totals--execution">
          <b>
            {finalExecution ? '處刑' : '餘震'}
            {finalExecution ? preview.finisherPower : preview.overkill}
          </b>
          <strong>OVERKILL +{preview.overkill}</strong>
        </div>
        <small>{finalExecution ? '再點此技能立即處刑' : '再點此技能回收餘震'}</small>
      </section>
    );
  }

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
        <div className="gr-preview-totals">
          <span>本次：</span>
          <b>{presentation.segments}段</b>
          <b>{presentation.chases}追擊</b>
          <strong data-preview-total={preview.totalDamage}>
            {totalLabel}
            {presentation.primaryValue}
          </strong>
          {presentation.statusDelta && (
            <em aria-hidden="true">
              {STATUS_LABELS[presentation.statusDelta.kind]}
              {presentation.statusDelta.amount > 0 ? '+' : ''}
              {presentation.statusDelta.amount}
            </em>
          )}
        </div>
      </header>
      <div className="gr-preview-combo-rail" aria-label="技能觸發與效果">
        {presentation.comboSteps.map((step, index) => (
          <div
            className="gr-preview-combo-step"
            data-combo-step={step.componentId}
            data-readiness={step.readiness}
            key={step.componentId}
          >
            <span>{step.conditionLabel}</span>
            <i>{step.readinessLabel}</i>
            <b>→ {step.effectLabel}</b>
            {index < presentation.comboSteps.length - 1 && <em aria-hidden="true">＋</em>}
          </div>
        ))}
      </div>
      {relay && preview.nextRelay && (
        <p className="gr-preview-relay">
          接棒：{relay.name}
          {preview.nextRelay.newlyReadySkillIds.length > 0
            ? `新亮${preview.nextRelay.newlyReadySkillIds.length}招`
            : '，暫無新亮技能'}
        </p>
      )}
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
