import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import {
  elementName,
  equipmentSlotName,
  rarityName,
  specializationName,
  triggerName,
} from '../content-labels';
import { createFirstHuntCoach, isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

const RARITY_SCORE = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
} as const;

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
  const recommendedItem = [...rewards.items].sort(
    (left, right) =>
      RARITY_SCORE[right.rarity] - RARITY_SCORE[left.rarity] ||
      right.qualityScore - left.qualityScore,
  )[0];
  const recommendedSkill = [...rewards.skillDrops].sort(
    (left, right) =>
      right.components.reduce(
        (sum, component) => sum + component.power + component.triggerAddition,
        0,
      ) -
      left.components.reduce(
        (sum, component) => sum + component.power + component.triggerAddition,
        0,
      ),
  )[0];
  const recommendedCore = recommendedItem
    ? GUILD_GAME_CONTENT.equipmentCores.find(
        ({ id }) => id === (recommendedItem.cores?.[0]?.id ?? recommendedItem.coreId),
      )
    : undefined;

  return (
    <main className="gr-rewards">
      <header className="gr-reward-hero">
        <span>HUNT COMPLETE · LOOT SECURED</span>
        <h1>接力殲滅完成</h1>
        <p>
          {rewards.items.length} 件裝備、{rewards.skillDrops.length} 張技能已安全收入。
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

      <section className="gr-loot-showcase" aria-label="本次主要戰利品">
        <header>
          <div>
            <span>DROP REVEAL</span>
            <h2>本次主要掉落</h2>
          </div>
          <strong>{rewards.items.length + rewards.skillDrops.length} 份</strong>
        </header>
        <div className="gr-loot-grid">
          {rewards.items.map((item, index) => {
            const coreRolls = item.cores?.length
              ? item.cores
              : item.coreId
                ? [{ id: item.coreId, strength: item.coreStrength ?? 0 }]
                : [];
            return (
              <article
                data-loot-reveal={item.id}
                data-rarity={item.rarity}
                key={item.id}
                style={{ '--reveal-order': index } as React.CSSProperties}
              >
                <b aria-hidden="true">{equipmentSlotName(item.slot).slice(0, 1)}</b>
                <span>
                  {rarityName(item.rarity)} · {equipmentSlotName(item.slot)}
                </span>
                <strong>{item.name}</strong>
                <small>
                  {item.mainStat.stat} +{item.mainStat.value}
                </small>
                {coreRolls.slice(0, 2).map(({ id, strength }) => {
                  const core = GUILD_GAME_CONTENT.equipmentCores.find(
                    (candidate) => candidate.id === id,
                  );
                  return (
                    <em key={id}>
                      {core?.name ?? id} +{strength}
                    </em>
                  );
                })}
              </article>
            );
          })}
          {rewards.skillDrops.map((skill, index) => {
            const first = skill.components[0];
            return (
              <article
                data-loot-reveal={skill.id}
                data-element={first.element}
                data-rarity="skill"
                key={skill.id}
                style={{ '--reveal-order': rewards.items.length + index } as React.CSSProperties}
              >
                <b aria-hidden="true">{elementName(first.element).slice(0, 1)}</b>
                <span>
                  {skill.stars}★ · {elementName(first.element)}技能
                </span>
                <strong>{skill.name}</strong>
                <small>
                  {specializationName(first.specializationId)} · {triggerName(first.triggerId)}
                </small>
                <em>
                  基礎 {first.power} · 追加 {first.triggerAddition} · {first.repeatCount} 擊
                </em>
              </article>
            );
          })}
        </div>
      </section>

      <section className="gr-loot-recommendation" data-loot-recommendation="true">
        <header>
          <span>NEXT POWER SPIKE</span>
          <h2>這次最值得先試</h2>
        </header>
        <div>
          <b>裝備</b>
          <strong>{recommendedItem?.name ?? '本次裝備'}</strong>
          <small>
            {recommendedItem
              ? `${equipmentSlotName(recommendedItem.slot)} · ${rarityName(recommendedItem.rarity)} · ${recommendedCore?.name ?? '屬性核心'}`
              : '完成下一場狩獵取得裝備'}
          </small>
        </div>
        <div>
          <b>技能</b>
          <strong>{recommendedSkill?.name ?? '本次技能'}</strong>
          <small>
            {recommendedSkill
              ? `${specializationName(recommendedSkill.components[0].specializationId)}接上${triggerName(recommendedSkill.components[0].triggerId)}`
              : '完成下一場狩獵取得技能'}
          </small>
        </div>
        <p>
          <strong>為什麼有用：</strong>
          {recommendedCore?.description ??
            '先把新裝備穿上，再到技能頁比較新觸發，最快看見下一場的連鎖差異。'}
        </p>
      </section>

      <details className="gr-material-rewards">
        <summary>素材與完整數量 · {rewards.materials.length} 種</summary>
        <div>
          {rewards.materials.map((material) => (
            <span key={material.id}>
              {material.name} <strong>+{material.quantity}</strong>
            </span>
          ))}
        </div>
      </details>

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
          先穿上推薦裝備
        </button>
        <button
          type="button"
          disabled={state.preferences.tutorial === 'active' && state.tutorialStep === 'equip_loot'}
          onClick={() => dispatch({ type: 'GO_TO_FUSION' })}
        >
          {state.preferences.tutorial === 'active' && state.tutorialStep === 'equip_loot'
            ? '穿裝後開放技能融合'
            : '前往技能融合'}
        </button>
      </div>
      <p className="gr-status-line" role="status">
        {state.message}
      </p>
    </main>
  );
}
