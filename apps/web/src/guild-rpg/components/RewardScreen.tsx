import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import {
  elementName,
  equipmentSlotName,
  rarityName,
  specializationName,
  triggerName,
} from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function RewardScreen({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const rewards = state.rewards!;
  const coach = createFirstHuntCoach(state.preferences.tutorial, state.tutorialStep, {
    surface: 'rewards',
  });
  return (
    <main className="gr-rewards">
      <header className="gr-reward-hero">
        <span>HUNT COMPLETE · ALL LOOT SECURED</span>
        <h1>接力殲滅完成</h1>
        <p>
          {rewards.items.length + rewards.skillDrops.length} 份主要掉落已自動安全收入，
          沒有背包滿而自動出售。
        </p>
      </header>
      {coach && (
        <aside className="gr-coach" role="status">
          <div>
            <span>
              實戰引導 {coach.stepNumber}/{coach.stepTotal}
            </span>
            <strong>{coach.title}</strong>
            <p>{coach.message}</p>
          </div>
        </aside>
      )}
      <section className="gr-reward-grid" aria-label="本次戰利品">
        <div>
          <h2>技能掉落</h2>
          {rewards.skillDrops.map((skill) => (
            <article data-element={skill.components[0].element} key={skill.id}>
              <span>
                {skill.stars}★ · {elementName(skill.components[0].element)}
              </span>
              <strong>{skill.name}</strong>
              <small>
                {specializationName(skill.components[0].specializationId)} ·
                {triggerName(skill.components[0].triggerId)} · 傷害 +{skill.components[0].power}
              </small>
            </article>
          ))}
        </div>
        <div>
          <h2>屬性裝備與核心</h2>
          {rewards.items.map((item) => {
            const base = GUILD_GAME_CONTENT.equipmentBases.find(({ id }) => id === item.baseId);
            const coreRolls = item.cores?.length
              ? item.cores
              : item.coreId
                ? [{ id: item.coreId, strength: item.coreStrength ?? 0 }]
                : [];
            return (
              <article key={item.id}>
                <span>
                  {rarityName(item.rarity)} · {equipmentSlotName(item.slot)}
                </span>
                <strong>{item.name}</strong>
                <small>
                  {item.mainStat.stat} +{item.mainStat.value}
                  {base ? `（${base.mainStatRoll.min}–${base.mainStatRoll.max}）` : ''}
                </small>
                {coreRolls.map(({ id, strength }) => {
                  const core = GUILD_GAME_CONTENT.equipmentCores.find(
                    (candidate) => candidate.id === id,
                  );
                  return (
                    <small key={id}>
                      {core?.name ?? id} +{strength}
                      {base
                        ? `（${base.coreStrengthRoll.min}–${base.coreStrengthRoll.max}）`
                        : ''}{' '}
                      ·{core?.description}
                    </small>
                  );
                })}
              </article>
            );
          })}
        </div>
        <div>
          <h2>素材</h2>
          {rewards.materials.map((material) => (
            <article key={material.id}>
              <strong>{material.name}</strong>
              <small>+{material.quantity}</small>
            </article>
          ))}
        </div>
      </section>
      <div className="gr-reward-actions">
        <button
          type="button"
          className="gr-primary-action"
          data-guide-id="reward:equipment"
          data-guide-active={isFirstHuntCoachFocus(
            state.preferences.tutorial,
            state.tutorialStep,
            'reward:equipment',
          )}
          onClick={() => dispatch({ type: 'GO_TO_EQUIPMENT' })}
        >
          先穿上新裝備
        </button>
        <button
          type="button"
          disabled={state.preferences.tutorial === 'active' && state.tutorialStep === 'equip_loot'}
          onClick={() => dispatch({ type: 'GO_TO_FUSION' })}
        >
          {state.preferences.tutorial === 'active' && state.tutorialStep === 'equip_loot'
            ? '完成裝備教學後開放融合'
            : '直接前往技能融合'}
        </button>
      </div>
      <p className="gr-status-line" role="status">
        {state.message}
      </p>
    </main>
  );
}
