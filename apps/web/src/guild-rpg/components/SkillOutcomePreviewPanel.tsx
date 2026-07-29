import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type { BattleUnit, GuildBattleEvent, GuildSkillItem } from '@expedition/shared-types';

import {
  createSkillTilePresentation,
  skillIntentName,
} from '../presentation/skill-tile-presentation';

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

export function SkillOutcomePreviewPanel({
  actor,
  target,
  skill,
  skills,
  preview,
  units,
}: {
  actor: BattleUnit;
  target: BattleUnit;
  skill: GuildSkillItem;
  skills: readonly GuildSkillItem[];
  preview: SkillOutcomePreview;
  units: readonly BattleUnit[];
}) {
  const presentation = createSkillTilePresentation(skill, preview);
  const targetPreview = preview.units.find(({ id }) => id === target.id)!;

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

      <div className="gr-preview-causal-flow" aria-label="技能效果順序">
        {presentation.cueStages.map((stage, index) => (
          <div
            className="gr-preview-cue-stage"
            data-cue-stage={stage.kind}
            data-combo-node={stage.kind === 'condition' ? index : undefined}
            data-readiness={stage.readiness}
            data-preview-total={stage.kind === 'result' ? preview.totalDamage : undefined}
            key={`${stage.kind}:${index}`}
          >
            <span aria-hidden="true">{index + 1}</span>
            <b>{stage.label}</b>
            <em>{stage.detail}</em>
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
          {preview.nextRelays.slice(0, 2).map((relay) => {
            const unit = units.find(({ id }) => id === relay.actorId);
            const suggestedSkillId =
              relay.newlyReadySkillIds[0] ?? relay.readySkillIds[0] ?? undefined;
            const suggestedSkill = skills.find(({ id }) => id === suggestedSkillId);
            return (
              <span
                data-next-relay={relay.actorId}
                data-relay-skill={suggestedSkillId}
                key={relay.actorId}
              >
                <b>{unit?.name ?? relay.actorId}</b>
                <i aria-hidden="true">→</i>
                <strong>{suggestedSkill ? skillIntentName(suggestedSkill) : '可接招'}</strong>
                <em>
                  {suggestedSkillId && relay.newlyReadySkillIds.includes(suggestedSkillId)
                    ? '新亮'
                    : '可接'}
                </em>
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
