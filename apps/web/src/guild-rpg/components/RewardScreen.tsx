import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildItemRarity, GuildSkillItem, HuntEquipmentItem } from '@expedition/shared-types';
import { useState } from 'react';

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

const skillRarity = (stars: number): GuildItemRarity =>
  stars >= 3 ? 'legendary' : stars === 2 ? 'rare' : 'common';

type LootEntry =
  | { kind: 'equipment'; id: string; item: HuntEquipmentItem }
  | { kind: 'skill'; id: string; skill: GuildSkillItem };

const equipmentCores = (item: HuntEquipmentItem) =>
  item.cores?.length
    ? item.cores
    : item.coreId
      ? [{ id: item.coreId, strength: item.coreStrength ?? 0 }]
      : [];

export function RewardScreen({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const rewards = state.rewards!;
  const entries: readonly LootEntry[] = [
    ...rewards.items.map((item) => ({ kind: 'equipment' as const, id: item.id, item })),
    ...rewards.skillDrops.map((skill) => ({ kind: 'skill' as const, id: skill.id, skill })),
  ];
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
  const recommendedIds = new Set([recommendedItem?.id, recommendedSkill?.id]);
  const [selectedId, setSelectedId] = useState<string>();
  const selected = entries.find(({ id }) => id === selectedId);
  const coach = createFirstHuntCoach(state.preferences.tutorial, state.tutorialStep, {
    surface: 'rewards',
  });
  const completedChallenges = state.newChallengeIds
    .map((id) => GUILD_GAME_CONTENT.challenges.find((challenge) => challenge.id === id))
    .filter((challenge) => challenge !== undefined);
  const showAchievements =
    completedChallenges.length > 0 ||
    state.recordHighlights.length > 0 ||
    Boolean(state.battle?.ascension);
  const density = entries.length > 14 ? 'max' : entries.length > 8 ? 'dense' : 'normal';

  return (
    <main
      className="gr-rewards"
      data-shell="single-screen"
      data-loot-count={entries.length}
      data-loot-density={density}
    >
      <header className="gr-reward-hero">
        <div>
          <span>HUNT COMPLETE</span>
          <h1>戰利品入袋</h1>
        </div>
        <strong>
          {rewards.items.length} 裝備 · {rewards.skillDrops.length} 技能
        </strong>
      </header>

      {(coach || showAchievements) && (
        <div className="gr-reward-feedback">
          {coach && (
            <aside className="gr-reward-coach" role="status">
              <b>
                {coach.stepNumber}/{coach.stepTotal}
              </b>
              <span>{coach.title}</span>
              <small>{coach.message}</small>
            </aside>
          )}
          {showAchievements && (
            <aside className="gr-reward-achievements" data-reward-achievements="true">
              {state.battle?.ascension && <strong>昇華制霸 · {state.battle.ascension.name}</strong>}
              {completedChallenges.length > 0 && (
                <span>
                  新完成 ·{' '}
                  {completedChallenges
                    .map((challenge) => challenge.name.split(' · ').at(-1))
                    .join(' / ')}
                </span>
              )}
              {state.recordHighlights.map((highlight) => (
                <b key={highlight}>{highlight}</b>
              ))}
            </aside>
          )}
        </div>
      )}

      <section className="gr-loot-showcase" aria-label="本次全部戰利品">
        <header>
          <h2>全部掉落</h2>
          <span>點一下查看詳情</span>
        </header>
        <div className="gr-loot-grid">
          {entries.map((entry, index) => {
            const equipment = entry.kind === 'equipment' ? entry.item : undefined;
            const skill = entry.kind === 'skill' ? entry.skill : undefined;
            const first = skill?.components[0];
            const selectedEntry = entry.id === selected?.id;
            return (
              <button
                type="button"
                data-loot-item={entry.id}
                data-loot-kind={entry.kind}
                data-loot-active={selectedEntry}
                data-rarity={equipment?.rarity ?? skillRarity(skill!.stars)}
                aria-pressed={selectedEntry}
                aria-label={`查看${equipment?.name ?? skill?.name}詳情`}
                key={entry.id}
                style={{ '--reveal-order': index } as React.CSSProperties}
                onClick={() => setSelectedId(entry.id)}
              >
                <b aria-hidden="true">
                  {equipment
                    ? equipmentSlotName(equipment.slot).slice(0, 1)
                    : elementName(first!.element).slice(0, 1)}
                </b>
                <strong>{equipment?.name ?? skill?.name}</strong>
                <small>
                  {equipment
                    ? `${rarityName(equipment.rarity)} · ${equipment.mainStat.value}`
                    : `${skill!.stars}★ · ${first!.power}`}
                </small>
                {recommendedIds.has(entry.id) && <i aria-label="推薦">★</i>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="gr-material-strip" data-material-count={rewards.materials.length}>
        <span>素材</span>
        {rewards.materials.map((material) => (
          <b key={material.id}>
            {material.name} +{material.quantity}
          </b>
        ))}
      </div>

      {selected && (
        <aside className="gr-loot-detail-drawer" aria-live="polite">
          <button
            type="button"
            aria-label="收起戰利品詳情"
            onClick={() => setSelectedId(undefined)}
          >
            ×
          </button>
          {selected.kind === 'equipment' ? (
            <>
              <span>
                {rarityName(selected.item.rarity)} · {equipmentSlotName(selected.item.slot)}
              </span>
              <strong>{selected.item.name}</strong>
              <p>
                {selected.item.mainStat.stat} +{selected.item.mainStat.value}
              </p>
              <div>
                {equipmentCores(selected.item).map(({ id, strength }) => {
                  const core = GUILD_GAME_CONTENT.equipmentCores.find(
                    (candidate) => candidate.id === id,
                  );
                  return (
                    <small key={id}>
                      {core?.name ?? id} +{strength} · {core?.description}
                    </small>
                  );
                })}
              </div>
              <button
                type="button"
                className="gr-drawer-action"
                data-guide-id="reward:equipment"
                data-guide-active={isFirstHuntCoachFocus(
                  state.preferences.tutorial,
                  state.tutorialStep,
                  'reward:equipment',
                )}
                onClick={() =>
                  dispatch({
                    type: 'EQUIP_REWARD_ITEM',
                    itemId: selected.item.id,
                    adventurerId: state.selectedHeroId,
                  })
                }
              >
                立即裝給目前角色
              </button>
            </>
          ) : (
            <>
              <span>
                {selected.skill.stars}★ · {elementName(selected.skill.components[0].element)}
              </span>
              <strong>{selected.skill.name}</strong>
              <p>
                {specializationName(selected.skill.components[0].specializationId)} →{' '}
                {triggerName(selected.skill.components[0].triggerId)}
              </p>
              <div>
                {selected.skill.components.map((component) => (
                  <small key={component.id}>
                    威力 {component.power} · 疊層 {component.layerStrength} · 追加{' '}
                    {component.triggerAddition}
                  </small>
                ))}
              </div>
              <button
                type="button"
                className="gr-drawer-action"
                disabled={
                  state.preferences.tutorial === 'active' && state.tutorialStep === 'equip_loot'
                }
                onClick={() => dispatch({ type: 'GO_TO_FUSION' })}
              >
                前往配置技能
              </button>
            </>
          )}
        </aside>
      )}

      <div className="gr-reward-actions">
        <button type="button" onClick={() => dispatch({ type: 'GO_TO_EQUIPMENT' })}>
          整理裝備
        </button>
        <button
          type="button"
          disabled={state.preferences.tutorial === 'active' && state.tutorialStep === 'equip_loot'}
          onClick={() => dispatch({ type: 'GO_TO_FUSION' })}
        >
          配置技能
        </button>
        <button
          type="button"
          disabled={state.preferences.tutorial === 'active' && state.tutorialStep !== 'complete'}
          onClick={() => dispatch({ type: 'REPLAY_HUNT' })}
        >
          再刷一次
        </button>
      </div>
      <p className="gr-status-line gr-sr-only" role="status">
        {state.message}
      </p>
    </main>
  );
}
