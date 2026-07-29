import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type {
  BattleUnit,
  GuildBattleEvent,
  GuildSkillItem,
  StatusLayers,
} from '@expedition/shared-types';

import { createSkillTilePresentation } from '../presentation/skill-tile-presentation';

const STATUS_LABELS: Readonly<Record<keyof StatusLayers, string>> = {
  burn: '燃',
  poison: '毒',
  tide: '潮',
};

const eventLabel = (event: GuildBattleEvent): string => {
  if (event.kind === 'damage') return `命中 ${event.amount ?? 0}`;
  if (event.kind === 'reaction') return `反應 ${event.amount ?? 0}`;
  if (event.kind === 'status_applied') return `留層 ${event.amount ?? 0}`;
  if (event.kind === 'triggered') return `條件追加 ${event.amount ?? 0}`;
  if (event.kind === 'core_triggered') return `核心 ${event.amount ?? 0}`;
  if (event.kind === 'weaken') return `削弱 ${event.amount ?? 0}`;
  if (event.kind === 'strengthen') return `強化 ${event.amount ?? 0}`;
  return event.kind;
};

const statusDelta = (preview: SkillOutcomePreview) => {
  const target = preview.units.find(({ id }) => id === preview.targetId);
  if (!target) return [];
  return (Object.keys(STATUS_LABELS) as (keyof StatusLayers)[])
    .map((kind) => ({
      kind,
      amount: target.afterStatus[kind] - target.beforeStatus[kind],
    }))
    .filter(({ amount }) => amount !== 0);
};

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
  const presentation = createSkillTilePresentation(skill, preview);
  const targetPreview = preview.units.find(({ id }) => id === target.id)!;
  const deltas = statusDelta(preview);

  if (preview.executionWindow) {
    const hasRoundFinisher = preview.finisherPower > 0;
    return (
      <section
        className="gr-skill-outcome-preview gr-skill-outcome-preview--execution"
        data-skill-preview
        data-execution-preview
        data-final-execution={hasRoundFinisher}
        data-skill-id={skill.id}
        aria-live="polite"
      >
        <div className="gr-preview-endpoints" data-preview-endpoints="true">
          <strong>{actor.name}</strong>
          <span aria-hidden="true">→</span>
          <strong>{target.name}</strong>
          <em>破勢</em>
        </div>
        <div className="gr-execution-summary">
          <b>{hasRoundFinisher ? '終結預演' : '破勢預演'}</b>
          {hasRoundFinisher ? (
            <strong>本輪{preview.finisherPower}</strong>
          ) : (
            <span>本招不新增假傷害</span>
          )}
          {preview.overkill > 0 && <em>OVERKILL +{preview.overkill}</em>}
        </div>
        <small>再點同一技能立即施放</small>
      </section>
    );
  }

  const primaryLabel = presentation.primaryKind === 'healing' ? '療' : '傷';
  const causalEvents = preview.events.filter(
    ({ kind }) =>
      kind === 'damage' ||
      kind === 'reaction' ||
      kind === 'status_applied' ||
      kind === 'triggered' ||
      kind === 'core_triggered' ||
      kind === 'weaken' ||
      kind === 'strengthen',
  );

  return (
    <section
      className="gr-skill-outcome-preview"
      data-skill-preview
      data-skill-id={skill.id}
      aria-live="polite"
    >
      <div className="gr-preview-endpoints" data-preview-endpoints="true">
        <strong>{actor.name}</strong>
        <span aria-hidden="true">→</span>
        <strong>{target.name}</strong>
        <em data-preview-unit={target.id}>
          {targetPreview.beforeHp} → {targetPreview.afterHp}
        </em>
      </div>

      <div className="gr-preview-impact" data-preview-total={preview.totalDamage}>
        <strong>
          {primaryLabel}
          {presentation.primaryValue}
        </strong>
        <span className="gr-impact-pips" aria-label={`${preview.damageSegments} 次獨立效果`}>
          {Array.from({ length: Math.min(6, preview.damageSegments) }, (_, index) => (
            <i data-impact-pip={index + 1} aria-hidden="true" key={index} />
          ))}
        </span>
        {deltas.map(({ kind, amount }) => (
          <em key={kind}>
            {STATUS_LABELS[kind]}
            {amount > 0 ? '+' : ''}
            {amount}
          </em>
        ))}
      </div>

      <div className="gr-preview-combo-rail" aria-label="技能條件路徑">
        {presentation.comboSteps.map((step, index) => (
          <div
            className="gr-preview-combo-step"
            data-combo-node={index + 1}
            data-base-ready={index === 0}
            data-readiness={step.readiness}
            key={step.componentId}
          >
            <span aria-hidden="true">{step.conditionGlyph}</span>
            <b>{step.conditionLabel}</b>
            <i>{step.readinessLabel}</i>
            <em>{step.effectLabel}</em>
          </div>
        ))}
      </div>

      <div className="gr-preview-route" data-preview-route="true" aria-label="預計攻擊路徑">
        {preview.targetRoute.map((targetId, index) => {
          const routed = units.find(({ id }) => id === targetId);
          return (
            <span data-route-target={targetId} key={`${targetId}:${index}`}>
              {index > 0 && <i aria-hidden="true">›</i>}
              {routed?.name ?? targetId}
            </span>
          );
        })}
      </div>

      {preview.nextRelays.length > 0 && (
        <div className="gr-preview-relays" aria-label="可延續接力">
          {preview.nextRelays.map((relay) => {
            const unit = units.find(({ id }) => id === relay.actorId);
            return (
              <span data-next-relay={relay.actorId} key={relay.actorId}>
                {unit?.name ?? relay.actorId}
                <b aria-label={`${relay.readySkillIds.length} 個可接技能`}>
                  ⚡{relay.readySkillIds.length}
                </b>
              </span>
            );
          })}
        </div>
      )}

      <details className="gr-preview-details">
        <summary>事件</summary>
        <div className="gr-preview-events">
          {causalEvents.slice(0, 12).map((event) => (
            <span data-causal-event={event.id} key={event.id}>
              {eventLabel(event)}
            </span>
          ))}
        </div>
      </details>
      <small>再點技能施放 · 點敵人換目標並施放</small>
    </section>
  );
}
