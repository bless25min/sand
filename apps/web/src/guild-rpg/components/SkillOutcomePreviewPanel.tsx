import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type { BattleUnit, GuildSkillItem } from '@expedition/shared-types';

import { createSkillActionPresentation } from '../presentation/skill-action-presentation';

export function SkillOutcomePreviewPanel({
  actor,
  target,
  skill,
  preview,
  onConfirm,
}: {
  actor: BattleUnit;
  target: BattleUnit;
  skill: GuildSkillItem;
  preview: SkillOutcomePreview;
  onConfirm(): void;
}) {
  const presentation = createSkillActionPresentation(skill, preview);
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
        <strong>{actor.name}</strong>
        <span aria-hidden="true">→</span>
        <strong>{target.name}</strong>
        <em data-preview-unit={target.id}>
          {targetPreview.beforeHp} → {targetPreview.afterHp}
        </em>
      </div>
      <div className="gr-skill-focus-copy">
        <b>{presentation.name}</b>
        <p data-action-sentence="true">{presentation.sentence}</p>
        {presentation.blockingReason && <small>{presentation.blockingReason}</small>}
      </div>
      <button type="button" data-confirm-skill="true" onClick={onConfirm}>
        對{target.name}施放
      </button>
    </section>
  );
}
