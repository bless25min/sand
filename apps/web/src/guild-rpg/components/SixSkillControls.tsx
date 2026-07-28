import { useState } from 'react';
import { previewTriggerReadiness } from '@expedition/simulation-core';
import type { SkillSpecialization } from '@expedition/shared-types';

import { elementName, specializationName, triggerName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

const SPECIALIZATION_ABBREVIATIONS: Partial<Record<SkillSpecialization, string>> = {
  blast: '爆破',
  stack: '疊層',
  weaken: '削弱',
  chain: '連鎖',
  empower: '強化',
  multistrike: '連擊',
};

const specializationAbbreviation = (specializationId: SkillSpecialization) =>
  SPECIALIZATION_ABBREVIATIONS[specializationId] ??
  specializationName(specializationId).slice(0, 2);

export function SixSkillControls({
  state,
  dispatch,
  locked = false,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  locked?: boolean;
}) {
  const actorId = state.battle?.roundOrder?.activeAdventurerId;
  const member = state.profile.party.find(({ definitionId }) => definitionId === actorId);
  const targetId = state.battle?.selectedTargetId;
  const [detailSkillId, setDetailSkillId] = useState<string>();
  if (!member) return null;
  const detailSkill = state.profile.skillInventory.find(({ id }) => id === detailSkillId);
  const detailComponent = detailSkill?.components[0];

  return (
    <div className="gr-skill-command-layer">
      <div className="gr-battle-skills" aria-label="六個可用技能">
        {member.skillIds.map((skillId, index) => {
          const skill = state.profile.skillInventory.find(({ id }) => id === skillId);
          const first = skill?.components[0];
          const readiness =
            skill && targetId && actorId
              ? previewTriggerReadiness({
                  battle: state.battle!,
                  actorId,
                  targetId,
                  skill,
                })
              : [];
          const readinessLabel = readiness.some(({ readiness: value }) => value === 'ready')
            ? '條件現在成立'
            : readiness.some(({ readiness: value }) => value === 'pending-impact')
              ? '命中後判定'
              : '追加未成立；基礎效果可用';
          const skillLabel =
            skill && first
              ? `${index + 1}，${skill.name}，${elementName(first.element)}，${specializationName(first.specializationId)}，${triggerName(first.triggerId)}，${readinessLabel}`
              : `${index + 1}，未裝備`;
          return (
            <div className="gr-battle-skill-slot" key={`${skillId}:${index}`}>
              <button
                type="button"
                aria-label={skillLabel}
                data-battle-skill={index + 1}
                data-element={first?.element}
                data-trigger-readiness={readinessLabel}
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
                disabled={locked || !skill || !targetId}
                onClick={() => targetId && dispatch({ type: 'USE_SKILL', skillId, targetId })}
              >
                <span className="gr-skill-glyph" aria-hidden="true">
                  {first ? elementName(first.element).slice(0, 1) : '－'}
                </span>
                <strong data-skill-abbreviation>
                  {first ? specializationAbbreviation(first.specializationId) : '空位'}
                </strong>
              </button>
              {skill && (
                <button
                  type="button"
                  className="gr-skill-info"
                  data-skill-info={index + 1}
                  aria-label={`查看${skill.name}詳情`}
                  disabled={locked}
                  onClick={() => setDetailSkillId(skill.id)}
                >
                  i
                </button>
              )}
            </div>
          );
        })}
      </div>
      {detailSkill && detailComponent && (
        <aside
          className="gr-skill-detail-overlay"
          data-skill-detail
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="gr-skill-detail-close"
            aria-label="關閉技能詳情"
            onClick={() => setDetailSkillId(undefined)}
          >
            ×
          </button>
          <span>
            {elementName(detailComponent.element)} · {detailSkill.stars}★
          </span>
          <strong>{detailSkill.name}</strong>
          <small>
            {specializationName(detailComponent.specializationId)} ·{' '}
            {triggerName(detailComponent.triggerId)}
          </small>
        </aside>
      )}
    </div>
  );
}
