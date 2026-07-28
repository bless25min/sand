import { previewTriggerReadiness } from '@expedition/simulation-core';
import type { GuildElement, SkillSpecialization } from '@expedition/shared-types';

import { elementName, specializationName, triggerName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgState } from '../state/game-reducer';

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

const STATUS_ABBREVIATIONS: Readonly<Record<GuildElement, string>> = {
  fire: '燃',
  grass: '毒',
  water: '潮',
};

export function SixSkillControls({
  state,
  armedSkillId,
  onChooseSkill,
  locked = false,
}: {
  state: GuildRpgState;
  armedSkillId?: string | undefined;
  onChooseSkill(skillId: string): void;
  locked?: boolean;
}) {
  const actorId = state.battle?.roundOrder?.activeAdventurerId;
  const member = state.profile.party.find(({ definitionId }) => definitionId === actorId);
  const targetId = state.battle?.selectedTargetId;
  if (!member) return null;

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
              ? `${index + 1}，${skill.name}，威力加${first.power}，${first.repeatCount}擊，${elementName(first.element)}層數加${first.layerStrength}，${triggerName(first.triggerId)}，${readinessLabel}`
              : `${index + 1}，未裝備`;
          return (
            <div className="gr-battle-skill-slot" key={`${skillId}:${index}`}>
              <button
                type="button"
                aria-label={skillLabel}
                aria-pressed={armedSkillId === skillId}
                data-battle-skill={index + 1}
                data-element={first?.element}
                data-trigger-readiness={readinessLabel}
                data-armed={armedSkillId === skillId}
                data-skill-power={first?.power}
                data-skill-hits={first?.repeatCount}
                data-skill-layers={first?.layerStrength}
                data-skill-abbreviation={
                  first ? specializationAbbreviation(first.specializationId) : ''
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
                <strong>{skill?.name ?? '空位'}</strong>
                {first && (
                  <small>
                    威力 +{first.power}
                    {first.specializationId === 'multistrike' ||
                    first.specializationId === 'chain' ||
                    first.specializationId === 'blast'
                      ? ` · ${first.repeatCount}擊`
                      : ''}
                    {' · '}
                    {STATUS_ABBREVIATIONS[first.element]} +{first.layerStrength}
                    {skill && skill.components.length > 1 ? ` · ${skill.components.length}段` : ''}
                  </small>
                )}
                <i className="gr-skill-kind" aria-hidden="true">
                  {first
                    ? `${specializationAbbreviation(first.specializationId)} · ${triggerName(first.triggerId)}`
                    : ''}
                </i>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
