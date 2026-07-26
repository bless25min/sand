import { previewTriggerReadiness } from '@expedition/simulation-core';

import { elementName, specializationName, triggerName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function SixSkillControls({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const actorId = state.battle?.roundOrder?.activeAdventurerId;
  const member = state.profile.party.find(({ definitionId }) => definitionId === actorId);
  const targetId = state.battle?.selectedTargetId;
  if (!member) return null;
  return (
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
        return (
          <button
            type="button"
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
                  )
                : undefined
            }
            disabled={!skill || !targetId}
            key={`${skillId}:${index}`}
            onClick={() => targetId && dispatch({ type: 'USE_SKILL', skillId, targetId })}
          >
            <span>
              {index + 1} · {first ? elementName(first.element) : '空'}
            </span>
            <strong>{skill?.name ?? '未裝備'}</strong>
            <small>
              {skill
                ? `${skill.stars}★ · ${specializationName(first!.specializationId)} · ${triggerName(first!.triggerId)} · ${readinessLabel}`
                : '返回技能頁裝備'}
            </small>
          </button>
        );
      })}
    </div>
  );
}
