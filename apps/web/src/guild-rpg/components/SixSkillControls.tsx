import type { SkillOutcomePreview } from '@expedition/simulation-core';

import { elementName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import { createSkillActionPresentation } from '../presentation/skill-action-presentation';
import type { GuildRpgState } from '../state/game-reducer';

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
  const focused = armedSkillId !== undefined;

  return (
    <div className="gr-skill-command-layer" data-skill-mode={focused ? 'focus' : 'choose'}>
      <div className="gr-battle-skills" aria-label="六個可用技能">
        {member.skillIds.map((skillId, index) => {
          const skill = state.profile.skillInventory.find(({ id }) => id === skillId);
          const first = skill?.components[0];
          const preview = previews.get(skillId);
          const presentation =
            skill && preview ? createSkillActionPresentation(skill, preview) : undefined;
          const guideActive =
            index === 0 &&
            isFirstHuntCoachFocus(state.preferences.tutorial, state.tutorialStep, 'battle:skill', {
              battleStatus: state.battle?.status,
            });
          const skillLabel = presentation
            ? `${index + 1}，${presentation.name}，${presentation.baseLabel}${
                presentation.conditionLabel
                  ? `，${presentation.conditionLabel}${
                      presentation.conditionState === 'not-ready' ? '尚未成立' : '會觸發'
                    }，${presentation.addedLabel ?? '追加效果'}`
                  : ''
              }`
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
                data-final-execution={preview ? preview.finisherPower > 0 : undefined}
                data-trigger-readiness={presentation?.ready ? 'ready' : 'not-ready'}
                data-armed={armedSkillId === skillId}
                data-skill-total={preview?.totalDamage ?? preview?.totalHealing}
                data-skill-segments={preview?.damageSegments}
                data-combo-ready={presentation?.ready}
                data-skill-switch={focused ? index + 1 : undefined}
                data-guide-id={index === 0 ? 'battle:skill' : undefined}
                data-guide-active={index === 0 ? guideActive : undefined}
                disabled={locked || !skill}
                onClick={() => skill && onChooseSkill(skillId)}
              >
                <span className="gr-skill-glyph" aria-hidden="true">
                  {first ? elementName(first.element).slice(0, 1) : '－'}
                </span>
                <span className="gr-skill-title">
                  <strong>{presentation?.name ?? '空位'}</strong>
                  {!focused && presentation && <b>{presentation.baseLabel}</b>}
                </span>
                {!focused && presentation && (
                  <small
                    className="gr-skill-cause"
                    data-cause-state={presentation.conditionState ?? 'not-ready'}
                  >
                    <span>{presentation.conditionLabel ?? '立即'}</span>
                    <i aria-hidden="true">›</i>
                    <b>{presentation.addedLabel ?? '追加效果'}</b>
                  </small>
                )}
                {guideActive && (
                  <span className="gr-guide-callout" role="status">
                    點技能預演
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
