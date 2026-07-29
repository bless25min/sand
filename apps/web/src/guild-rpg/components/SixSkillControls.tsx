import type { SkillOutcomePreview } from '@expedition/simulation-core';

import { elementName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import { createSkillTilePresentation } from '../presentation/skill-tile-presentation';
import type { GuildRpgState } from '../state/game-reducer';

const STATUS_LABELS = {
  burn: '燃',
  poison: '毒',
  tide: '潮',
} as const;

export function SixSkillControls({
  state,
  armedSkillId,
  previews,
  onChooseSkill,
  locked = false,
}: {
  state: GuildRpgState;
  armedSkillId?: string | undefined;
  previews: ReadonlyMap<string, SkillOutcomePreview>;
  onChooseSkill(skillId: string): void;
  locked?: boolean;
}) {
  const actorId = state.battle?.roundOrder?.activeAdventurerId;
  const member = state.profile.party.find(({ definitionId }) => definitionId === actorId);
  if (!member) return null;

  return (
    <div className="gr-skill-command-layer">
      <div className="gr-battle-skills" aria-label="六個可用技能">
        {member.skillIds.map((skillId, index) => {
          const skill = state.profile.skillInventory.find(({ id }) => id === skillId);
          const first = skill?.components[0];
          const preview = previews.get(skillId);
          const presentation =
            skill && preview ? createSkillTilePresentation(skill, preview) : undefined;
          const status = presentation?.statusDelta;
          const totalLabel =
            presentation?.execution && presentation.primaryKind !== 'finisher'
              ? '溢傷'
              : presentation?.primaryKind === 'healing'
                ? '療'
                : presentation?.primaryKind === 'finisher'
                  ? '終'
                  : '傷';
          const skillLabel = presentation
            ? presentation.execution
              ? `${index + 1}，${presentation.intentName}，${totalLabel}${presentation.primaryValue}，${presentation.triggerSummary}`
              : `${index + 1}，${presentation.intentName}，${totalLabel}${presentation.primaryValue}，${presentation.segments}次獨立效果，${presentation.triggerSummary}${status ? `，${STATUS_LABELS[status.kind]}${status.amount >= 0 ? '增加' : '消耗'}${Math.abs(status.amount)}` : ''}`
            : `${index + 1}，未裝備`;
          return (
            <div className="gr-battle-skill-slot" key={`${skillId}:${index}`}>
              <button
                type="button"
                aria-label={skillLabel}
                aria-pressed={armedSkillId === skillId}
                data-battle-skill={index + 1}
                data-element={first?.element}
                data-execution={presentation?.execution}
                data-final-execution={presentation?.primaryKind === 'finisher'}
                data-trigger-readiness={presentation?.readiness}
                data-armed={armedSkillId === skillId}
                data-skill-total={presentation?.primaryValue}
                data-skill-segments={presentation?.segments}
                data-combo-ready={
                  presentation ? `${presentation.readyCount}/${presentation.stepCount}` : undefined
                }
                data-guide-id={index === 0 ? 'battle:skill' : undefined}
                data-guide-active={
                  index === 0
                    ? isFirstHuntCoachFocus(
                        state.preferences.tutorial,
                        state.tutorialStep,
                        'battle:skill',
                        { battleStatus: state.battle?.status },
                      )
                    : undefined
                }
                disabled={locked || !skill}
                onClick={() => skill && onChooseSkill(skillId)}
              >
                <span className="gr-skill-glyph" aria-hidden="true">
                  {first ? elementName(first.element).slice(0, 1) : '－'}
                </span>
                <strong>{presentation?.intentName ?? '空位'}</strong>
                {presentation && (
                  <small className="gr-skill-outcome">
                    <b>
                      {totalLabel}
                      {presentation.primaryValue}
                    </b>
                    <span
                      className="gr-skill-hit-pips"
                      aria-label={`${presentation.segments} 次獨立效果`}
                    >
                      {Array.from({ length: Math.min(6, presentation.segments) }, (_, pipIndex) => (
                        <i data-skill-hit-pip={pipIndex + 1} aria-hidden="true" key={pipIndex} />
                      ))}
                    </span>
                    {status && (
                      <em>
                        {STATUS_LABELS[status.kind]}
                        {status.amount > 0 ? '+' : ''}
                        {status.amount}
                      </em>
                    )}
                  </small>
                )}
                {presentation && (
                  <span className="gr-skill-nodes" aria-label={presentation.triggerSummary}>
                    {presentation.comboSteps.map((step, stepIndex) => (
                      <i
                        data-combo-node={stepIndex + 1}
                        data-node-active={stepIndex === 0 || step.readiness === 'ready'}
                        data-readiness={step.readiness}
                        title={`${step.conditionLabel}：${step.readinessLabel}`}
                        aria-hidden="true"
                        key={step.componentId}
                      >
                        {step.conditionGlyph}
                      </i>
                    ))}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
