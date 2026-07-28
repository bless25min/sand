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
          const skillLabel = presentation
            ? `${index + 1}，${presentation.intentName}，預計${presentation.primaryValue}${presentation.primaryKind === 'healing' ? '治療' : '傷害'}，${presentation.hits}次命中${status ? `，${STATUS_LABELS[status.kind]}${status.amount >= 0 ? '增加' : '消耗'}${Math.abs(status.amount)}` : ''}`
            : `${index + 1}，未裝備`;
          return (
            <div className="gr-battle-skill-slot" key={`${skillId}:${index}`}>
              <button
                type="button"
                aria-label={skillLabel}
                aria-pressed={armedSkillId === skillId}
                data-battle-skill={index + 1}
                data-element={first?.element}
                data-trigger-readiness={presentation?.readiness}
                data-armed={armedSkillId === skillId}
                data-skill-total={presentation?.primaryValue}
                data-skill-hits={presentation?.hits}
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
                    <b>{presentation.primaryValue}</b>
                    {presentation.hits > 0 && <span>×{presentation.hits}</span>}
                    {status && (
                      <span>
                        {STATUS_LABELS[status.kind]}
                        {status.amount > 0 ? '+' : ''}
                        {status.amount}
                      </span>
                    )}
                  </small>
                )}
                {presentation?.readiness === 'ready' && (
                  <i className="gr-skill-ready" aria-hidden="true">
                    +
                  </i>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
