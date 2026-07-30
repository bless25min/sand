import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type { BattleUnit, GuildSkillItem } from '@expedition/shared-types';

import { createSkillActionPresentation } from '../presentation/skill-action-presentation';
import { skillIntentName } from '../presentation/skill-tile-presentation';

export function SkillOutcomePreviewPanel({
  actor,
  target,
  skill,
  skills,
  units,
  preview,
  onConfirm,
}: {
  actor: BattleUnit;
  target: BattleUnit;
  skill: GuildSkillItem;
  skills: readonly GuildSkillItem[];
  units: readonly BattleUnit[];
  preview: SkillOutcomePreview;
  onConfirm(): void;
}) {
  const presentation = createSkillActionPresentation(skill, preview);
  const targetPreview = preview.units.find(({ id }) => id === target.id)!;
  const nextRelay = presentation.nextRelay;
  const nextActor = nextRelay ? units.find(({ id }) => id === nextRelay.actorId) : undefined;
  const nextSkill = nextRelay ? skills.find(({ id }) => id === nextRelay.skillId) : undefined;

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
          <strong className="gr-sr-only">{actor.name}</strong>
          <span className="gr-sr-only" aria-hidden="true">
            →
          </span>
          <strong className="gr-sr-only">{target.name}</strong>
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
        <p data-action-sentence="true">{presentation.sentence}</p>
        <button type="button" data-confirm-skill="true" onClick={onConfirm}>
          對{target.name}施放
        </button>
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
      <div className="gr-preview-endpoints" data-preview-endpoints="true">
        <strong className="gr-sr-only">{actor.name}</strong>
        <span className="gr-sr-only" aria-hidden="true">
          →
        </span>
        <strong className="gr-sr-only">{target.name}</strong>
        <em data-preview-unit={target.id}>
          HP {targetPreview.beforeHp} → {targetPreview.afterHp}
        </em>
      </div>
      <div className="gr-causal-preview" aria-label="技能效果順序">
        <span data-causal-stage="base">
          <small>先</small>
          <b>{presentation.baseLabel.replace(/^先/, '')}</b>
        </span>
        <i aria-hidden="true">›</i>
        <span data-causal-stage="condition" data-condition-state={presentation.conditionState}>
          <small>當</small>
          <b>{presentation.conditionLabel ?? '立即'}</b>
        </span>
        <i aria-hidden="true">›</i>
        <span data-causal-stage="added">
          <small>再</small>
          <b>{presentation.addedLabel?.replace(/^(追加|可)/, '') ?? '追加效果'}</b>
        </span>
      </div>
      {nextRelay && nextActor && nextSkill && (
        <div
          className="gr-next-relay"
          data-next-relay={nextRelay.actorId}
          data-relay-skill={nextRelay.skillId}
        >
          <span>下一棒</span>
          <strong>{nextActor.name}</strong>
          <i aria-hidden="true">›</i>
          <b>{skillIntentName(nextSkill)}</b>
        </div>
      )}
      <p className="gr-sr-only" data-action-sentence="true">
        {presentation.sentence}
        {presentation.blockingReason ? ` ${presentation.blockingReason}。` : ''}
      </p>
      <button type="button" data-confirm-skill="true" onClick={onConfirm}>
        對{target.name}施放
      </button>
    </section>
  );
}
