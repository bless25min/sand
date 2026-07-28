import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { useEffect, useState } from 'react';

import { elementName, specializationName, triggerName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function SkillLoadoutPanel({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const [elementFilter, setElementFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [starFilter, setStarFilter] = useState('all');
  const [libraryPage, setLibraryPage] = useState(0);
  const member = state.profile.party.find(
    ({ definitionId }) => definitionId === state.selectedHeroId,
  )!;
  const hero = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === member.definitionId)!;
  const currentSkill = state.profile.skillInventory.find(
    ({ id }) => id === member.skillIds[state.selectedSkillSlot],
  );
  const currentPower =
    currentSkill?.components.reduce((sum, component) => sum + component.power, 0) ?? 0;
  const equippedIds = new Set(state.profile.party.flatMap(({ skillIds }) => skillIds));
  const equippedTriggers = new Set(
    state.profile.skillInventory
      .filter(({ id }) => equippedIds.has(id))
      .flatMap(({ components }) => components.map(({ triggerId }) => triggerId)),
  );
  const filteredSkills = state.profile.skillInventory
    .filter(
      (skill) =>
        (elementFilter === 'all' ||
          skill.components.some(({ element }) => element === elementFilter)) &&
        (specializationFilter === 'all' ||
          skill.components.some(
            ({ specializationId }) => specializationId === specializationFilter,
          )) &&
        (triggerFilter === 'all' ||
          skill.components.some(({ triggerId }) => triggerId === triggerFilter)) &&
        (starFilter === 'all' || skill.stars === Number(starFilter)),
    )
    .sort(
      (left, right) =>
        Number(right.id === state.lastFusedSkillId) - Number(left.id === state.lastFusedSkillId),
    );
  const pageCount = Math.max(1, Math.ceil(filteredSkills.length / 6));
  const safeLibraryPage = Math.min(libraryPage, pageCount - 1);
  const visibleSkills = filteredSkills.slice(safeLibraryPage * 6, safeLibraryPage * 6 + 6);

  useEffect(() => {
    setLibraryPage(0);
  }, [
    elementFilter,
    specializationFilter,
    starFilter,
    state.selectedHeroId,
    state.selectedSkillSlot,
    triggerFilter,
  ]);

  return (
    <section className="gr-panel" aria-labelledby="skill-loadout-title">
      <header className="gr-panel__header">
        <div>
          <p>SIX ALWAYS-READY SKILLS</p>
          <h2 id="skill-loadout-title">目前角色：{hero.name}</h2>
        </div>
        <span>
          {hero.deliveryPassive.name}：{hero.deliveryPassive.description}
        </span>
      </header>
      <ol className="gr-workflow-steps" aria-label="技能配置步驟">
        <li data-current="true">1 選角色</li>
        <li>2 選技能格</li>
        <li>3 裝備技能</li>
      </ol>
      <div className="gr-hero-tabs" aria-label="選擇角色">
        {state.profile.defaultOrder.map((heroId) => {
          const definition = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === heroId)!;
          return (
            <button
              type="button"
              aria-pressed={heroId === hero.id}
              key={heroId}
              onClick={() => dispatch({ type: 'SELECT_HERO', adventurerId: heroId })}
            >
              {definition.name}
            </button>
          );
        })}
      </div>
      <div className="gr-skill-selection-context" role="status">
        <strong>目前技能格：{state.selectedSkillSlot + 1}</strong>
        <span>{currentSkill?.name ?? '尚未裝備技能'}</span>
      </div>
      <div className="gr-skill-slots" aria-label={`${hero.name}已裝備技能`}>
        {member.skillIds.map((skillId, index) => {
          const skill = state.profile.skillInventory.find(({ id }) => id === skillId);
          return (
            <button
              type="button"
              data-skill-slot={index + 1}
              data-selected={state.selectedSkillSlot === index}
              key={`${skillId}:${index}`}
              onClick={() => dispatch({ type: 'SELECT_SKILL_SLOT', slotIndex: index })}
            >
              <span>技能 {index + 1}</span>
              <strong>{skill?.name ?? '空技能格'}</strong>
              <small>
                {skill
                  ? `${skill.stars}★ · ${elementName(skill.components[0].element)}`
                  : '請選技能'}
              </small>
            </button>
          );
        })}
      </div>
      <section
        className="gr-progressive-library"
        data-progressive-skill-library="true"
        data-skill-library="visible"
      >
        <header className="gr-library-heading">
          <strong>可選技能</strong>
          <span>
            顯示 {visibleSkills.length}/{filteredSkills.length} 張 · 裝到第{' '}
            {state.selectedSkillSlot + 1} 格後自動切換下一位
          </span>
        </header>
        <details className="gr-filter-drawer">
          <summary>依屬性、特化、觸發或星級篩選</summary>
          <div className="gr-skill-filters" aria-label="技能篩選">
            <label>
              屬性
              <select
                value={elementFilter}
                onChange={(event) => setElementFilter(event.currentTarget.value)}
              >
                <option value="all">全部</option>
                {GUILD_GAME_CONTENT.elements.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              特化
              <select
                value={specializationFilter}
                onChange={(event) => setSpecializationFilter(event.currentTarget.value)}
              >
                <option value="all">全部</option>
                {GUILD_GAME_CONTENT.skillSpecializations.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              觸發
              <select
                value={triggerFilter}
                onChange={(event) => setTriggerFilter(event.currentTarget.value)}
              >
                <option value="all">全部</option>
                {GUILD_GAME_CONTENT.triggerConditions.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              星級
              <select
                value={starFilter}
                onChange={(event) => setStarFilter(event.currentTarget.value)}
              >
                <option value="all">全部</option>
                <option value="1">1★</option>
                <option value="2">2★</option>
                <option value="3">3★</option>
              </select>
            </label>
          </div>
        </details>
        <div className="gr-skill-library">
          {visibleSkills.length === 0 && <p>目前沒有符合這組屬性、特化與觸發條件的技能。</p>}
          {visibleSkills.map((skill, index) => {
            const first = skill.components[0];
            const selected = state.selectedFusionIds.includes(skill.id);
            const power = skill.components.reduce((sum, component) => sum + component.power, 0);
            const canFuse =
              skill.stars === 1 &&
              state.profile.skillInventory.some(
                (candidate) =>
                  candidate.id !== skill.id &&
                  candidate.stars === 1 &&
                  candidate.components[0].element === first.element &&
                  !equippedIds.has(candidate.id),
              );
            const fillsChain = skill.components.some(({ triggerId }) =>
              [
                'previous_fire',
                'previous_grass',
                'previous_water',
                'ally_same_element',
                'team_three_elements',
                'final_actor',
              ].includes(triggerId),
            );
            const highValue = skill.components.some((component) => {
              const specialization = GUILD_GAME_CONTENT.skillSpecializations.find(
                ({ id }) => id === component.specializationId,
              );
              const trigger = GUILD_GAME_CONTENT.triggerConditions.find(
                ({ id }) => id === component.triggerId,
              );
              return (
                component.power >= (specialization?.powerRoll.max ?? Infinity) ||
                component.triggerAddition >= (trigger?.additionRoll.max ?? Infinity)
              );
            });
            const guideId =
              state.lastFusedSkillId === skill.id
                ? 'skill:equip-fused'
                : index === 0 && !state.lastFusedSkillId
                  ? 'skill:equip'
                  : undefined;
            return (
              <article
                className="gr-skill-card"
                data-element={first.element}
                data-skill-library-item={skill.id}
                key={skill.id}
              >
                <div>
                  <span>
                    {skill.stars}★ · {elementName(first.element)}
                  </span>
                  <strong>{skill.name}</strong>
                  <small>
                    {specializationName(first.specializationId)} · {triggerName(first.triggerId)}
                  </small>
                </div>
                <details className="gr-skill-numbers">
                  <summary>查看完整數值與融合段</summary>
                  <ol className="gr-skill-components">
                    {skill.components.map((component, index) =>
                      (() => {
                        const element = GUILD_GAME_CONTENT.elements.find(
                          ({ id }) => id === component.element,
                        )!;
                        const specialization = GUILD_GAME_CONTENT.skillSpecializations.find(
                          ({ id }) => id === component.specializationId,
                        )!;
                        const trigger = GUILD_GAME_CONTENT.triggerConditions.find(
                          ({ id }) => id === component.triggerId,
                        )!;
                        return (
                          <li key={component.id}>
                            <strong>
                              {index + 1}. {elementName(component.element)}・
                              {specializationName(component.specializationId)}・
                              {triggerName(component.triggerId)}
                            </strong>
                            <small>
                              基礎 +{component.power}（{specialization.powerRoll.min}–
                              {specialization.powerRoll.max}） · 疊層 +{component.layerStrength}（
                              {element.layerRoll.min}–{element.layerRoll.max}） · 追加 +
                              {component.triggerAddition}（{trigger.additionRoll.min}–
                              {trigger.additionRoll.max}） · 次數 {component.repeatCount}（
                              {specialization.repeatRoll.min}–{specialization.repeatRoll.max}）
                            </small>
                          </li>
                        );
                      })(),
                    )}
                  </ol>
                </details>
                <div className="gr-item-tags">
                  {skill.components.some(({ triggerId }) => !equippedTriggers.has(triggerId)) && (
                    <span>新觸發</span>
                  )}
                  {canFuse && <span>可融合</span>}
                  {fillsChain && <span>可補鏈</span>}
                  {highValue && <span>高數值</span>}
                  <span>
                    相較目前傷害 {power - currentPower >= 0 ? '+' : ''}
                    {power - currentPower}
                  </span>
                </div>
                <button
                  type="button"
                  data-guide-id={guideId}
                  data-guide-active={
                    guideId
                      ? isFirstHuntCoachFocus(
                          state.preferences.tutorial,
                          state.tutorialStep,
                          guideId,
                        )
                      : undefined
                  }
                  aria-pressed={selected}
                  onClick={() => dispatch({ type: 'EQUIP_SKILL', skillId: skill.id })}
                >
                  裝備到第 {state.selectedSkillSlot + 1} 格
                </button>
              </article>
            );
          })}
        </div>
        <nav className="gr-collection-pager" data-pager="skills" aria-label="切換技能頁">
          <button
            type="button"
            disabled={safeLibraryPage === 0}
            onClick={() => setLibraryPage((value) => Math.max(0, value - 1))}
          >
            ←
          </button>
          <span>
            {safeLibraryPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={safeLibraryPage >= pageCount - 1}
            onClick={() => setLibraryPage((value) => Math.min(pageCount - 1, value + 1))}
          >
            →
          </button>
        </nav>
      </section>
    </section>
  );
}
