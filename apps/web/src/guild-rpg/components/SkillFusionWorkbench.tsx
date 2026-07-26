import { elementName, specializationName, triggerName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function SkillFusionWorkbench({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const equipped = new Set(state.profile.party.flatMap(({ skillIds }) => skillIds));
  const candidates = state.profile.skillInventory.filter(
    (skill) => skill.stars === 1 && !equipped.has(skill.id),
  );
  const fused = state.profile.skillInventory.filter((skill) => skill.stars > 1);
  return (
    <section className="gr-panel gr-fusion" aria-labelledby="fusion-title">
      <header className="gr-panel__header">
        <div>
          <p>REVERSIBLE FUSION</p>
          <h2 id="fusion-title">技能融合工坊</h2>
        </div>
        <span>選 2–3 張同屬性一星技能；元件順序就是戰鬥結算順序</span>
      </header>
      <div className="gr-fusion__candidates">
        {candidates.length === 0 && <p>目前沒有未裝備的一星技能；先狩獵取得新技能。</p>}
        {candidates.map((skill) => (
          <button
            type="button"
            aria-pressed={state.selectedFusionIds.includes(skill.id)}
            key={skill.id}
            onClick={() => dispatch({ type: 'TOGGLE_FUSION_SKILL', skillId: skill.id })}
          >
            <strong>{skill.name}</strong>
            <span>
              {skill.components[0].element} · {skill.components[0].triggerId}
            </span>
          </button>
        ))}
      </div>
      <button
        className="gr-primary-action"
        type="button"
        data-guide-id="fusion:create"
        data-guide-active={isFirstHuntCoachFocus(
          state.preferences.tutorial,
          state.tutorialStep,
          'fusion:create',
        )}
        disabled={state.selectedFusionIds.length < 2}
        onClick={() => dispatch({ type: 'FUSE_SELECTED' })}
      >
        融合已選 {state.selectedFusionIds.length} 張技能
      </button>
      {fused.length > 0 && (
        <div className="gr-fusion__results">
          <h3>已融合技能</h3>
          {fused.map((skill) => (
            <article key={skill.id}>
              <strong>
                {skill.name} · {skill.stars}★ · {elementName(skill.components[0].element)}
              </strong>
              <ol>
                {skill.components.map((component, index) => {
                  const replacements = candidates.filter(
                    (candidate) => candidate.components[0].element === component.element,
                  );
                  return (
                    <li key={component.id}>
                      <span>
                        {index + 1}. {specializationName(component.specializationId)} ·
                        {triggerName(component.triggerId)}
                      </span>
                      <div>
                        <button
                          type="button"
                          aria-label={`${skill.name}第${index + 1}段上移`}
                          disabled={index === 0}
                          onClick={() =>
                            dispatch({
                              type: 'MOVE_FUSED_COMPONENT',
                              fusedSkillId: skill.id,
                              componentIndex: index,
                              direction: -1,
                            })
                          }
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`${skill.name}第${index + 1}段下移`}
                          disabled={index === skill.components.length - 1}
                          onClick={() =>
                            dispatch({
                              type: 'MOVE_FUSED_COMPONENT',
                              fusedSkillId: skill.id,
                              componentIndex: index,
                              direction: 1,
                            })
                          }
                        >
                          ↓
                        </button>
                        <select
                          aria-label={`${skill.name}替換第${index + 1}段`}
                          defaultValue=""
                          onChange={(event) => {
                            if (!event.currentTarget.value) return;
                            dispatch({
                              type: 'REPLACE_FUSED_COMPONENT',
                              fusedSkillId: skill.id,
                              componentIndex: index,
                              replacementSkillId: event.currentTarget.value,
                            });
                          }}
                        >
                          <option value="">替換這一段</option>
                          {replacements.map((replacement) => (
                            <option key={replacement.id} value={replacement.id}>
                              {replacement.name} ·{' '}
                              {triggerName(replacement.components[0].triggerId)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DISMANTLE_SKILL', skillId: skill.id })}
              >
                無損拆解
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
