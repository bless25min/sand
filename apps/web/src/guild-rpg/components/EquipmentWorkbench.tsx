import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem } from '@expedition/shared-types';

import { equipmentSlotName, rarityName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

const coreRolls = (item: EquipmentItem) =>
  item.cores?.length
    ? item.cores
    : item.coreId
      ? [{ id: item.coreId, strength: item.coreStrength ?? 0 }]
      : [];

const coreLabel = (item: EquipmentItem) =>
  coreRolls(item)
    .map(({ id, strength }) => {
      const core = GUILD_GAME_CONTENT.equipmentCores.find((candidate) => candidate.id === id);
      return `${core?.name ?? id} +${strength}`;
    })
    .join(' · ');

const comparisonLabel = (item: EquipmentItem, equipped?: EquipmentItem) => {
  if (!equipped) return '此欄位目前空白';
  if (equipped.mainStat.stat !== item.mainStat.stat) {
    return `${equipped.mainStat.stat} → ${item.mainStat.stat}`;
  }
  const difference = item.mainStat.value - equipped.mainStat.value;
  return `相較目前 ${difference >= 0 ? '+' : ''}${difference}`;
};

export function EquipmentWorkbench({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const member = state.profile.party.find(
    ({ definitionId }) => definitionId === state.selectedHeroId,
  )!;
  const hero = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === member.definitionId)!;
  return (
    <section className="gr-panel" aria-labelledby="equipment-title">
      <header className="gr-panel__header">
        <div>
          <p>GEAR & EMBEDDED CORES</p>
          <h2 id="equipment-title">目前角色：{hero.name}</h2>
        </div>
        <span>裝備直接帶有核心；不再拆成容易混淆的獨立寶石頁</span>
      </header>
      <div className="gr-hero-tabs" aria-label="選擇裝備角色">
        {state.profile.defaultOrder.map((heroId) => (
          <button
            type="button"
            aria-pressed={heroId === hero.id}
            key={heroId}
            onClick={() => dispatch({ type: 'SELECT_HERO', adventurerId: heroId })}
          >
            {GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === heroId)?.name}
          </button>
        ))}
      </div>
      <div className="gr-equipment-slots">
        {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
          const item = member.equipment[slot];
          return (
            <article key={slot}>
              <span>{equipmentSlotName(slot)}</span>
              <strong>{item?.name ?? '尚未裝備'}</strong>
              <small>
                {item
                  ? `${item.mainStat.stat} +${item.mainStat.value} · ${coreLabel(item) || '無核心'}`
                  : '從下方戰利品選擇'}
              </small>
              {item && (
                <div className="gr-forge-actions">
                  <button
                    type="button"
                    data-guide-id="equipment:forge"
                    data-guide-active={isFirstHuntCoachFocus(
                      state.preferences.tutorial,
                      state.tutorialStep,
                      'equipment:forge',
                    )}
                    onClick={() =>
                      dispatch({ type: 'FORGE_ITEM', itemId: item.id, forgeAction: 'calibrate' })
                    }
                  >
                    校準
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'FORGE_ITEM', itemId: item.id, forgeAction: 'reforge' })
                    }
                  >
                    重鑄
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'FORGE_ITEM',
                        itemId: item.id,
                        forgeAction: 'lock',
                        options: { lockField: 'core' },
                      })
                    }
                  >
                    鎖核心
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <header className="gr-subheading">
        <h3>裝備背包</h3>
        <span>{state.profile.inventory.length} 件；不設自動出售上限</span>
      </header>
      <div className="gr-batch-actions">
        <span>批次分解已選 {state.selectedSalvageIds.length} 件</span>
        <button
          type="button"
          disabled={state.selectedSalvageIds.length === 0}
          onClick={() => dispatch({ type: 'SALVAGE_SELECTED' })}
        >
          分解已選安全裝備
        </button>
      </div>
      <div className="gr-equipment-library">
        {state.profile.inventory.length === 0 && <p>完成狩獵後，屬性特化裝備會出現在這裡。</p>}
        {state.profile.inventory.map((item, index) => {
          const equippedTarget = member.equipment[item.slot];
          const rolls = coreRolls(item);
          const base = GUILD_GAME_CONTENT.equipmentBases.find(({ id }) => id === item.baseId);
          const highValue =
            item.rarity === 'epic' ||
            item.rarity === 'legendary' ||
            rolls.some(({ strength }) => strength >= 5);
          const chainGap = rolls.some(({ id }) =>
            ['tide-relay', 'relay-prism', 'lone-king-loop', 'toxic-mist'].includes(id),
          );
          return (
            <article data-selected={state.selectedSalvageIds.includes(item.id)} key={item.id}>
              <div>
                <span>
                  {equipmentSlotName(item.slot)} · {rarityName(item.rarity)}
                </span>
                <strong>{item.name}</strong>
                <small>
                  {item.mainStat.stat} +{item.mainStat.value}
                  {base ? `（${base.mainStatRoll.min}–${base.mainStatRoll.max}）` : ''} ·
                  {comparisonLabel(item, equippedTarget)}
                </small>
              </div>
              <div className="gr-item-tags">
                {rolls.length === 2 && <span>傳奇雙核心</span>}
                {chainGap && <span>可補鏈</span>}
                {highValue && <span>高數值</span>}
                {item.locked && <span>已鎖定</span>}
                {item.favorite && <span>已收藏</span>}
              </div>
              {rolls.map(({ id, strength }) => {
                const core = GUILD_GAME_CONTENT.equipmentCores.find(
                  (candidate) => candidate.id === id,
                );
                return (
                  <p key={id}>
                    {core?.name ?? id} +{strength}
                    {base ? `（${base.coreStrengthRoll.min}–${base.coreStrengthRoll.max}）` : ''}：
                    {core?.description}
                  </p>
                );
              })}
              <div>
                <button
                  type="button"
                  data-guide-id={index === 0 ? 'equipment:equip' : undefined}
                  data-guide-active={
                    index === 0
                      ? isFirstHuntCoachFocus(
                          state.preferences.tutorial,
                          state.tutorialStep,
                          'equipment:equip',
                        )
                      : undefined
                  }
                  onClick={() =>
                    dispatch({
                      type: 'EQUIP_STORED',
                      itemId: item.id,
                      adventurerId: member.definitionId,
                    })
                  }
                >
                  裝備給{hero.name}
                </button>
                {equippedTarget && item.coreId && (
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'FORGE_ITEM',
                        itemId: equippedTarget.id,
                        forgeAction: 'transplant',
                        options: { sourceItemId: item.id },
                      })
                    }
                  >
                    移植到目前{equipmentSlotName(item.slot)}
                  </button>
                )}
                <button
                  type="button"
                  aria-pressed={Boolean(item.locked)}
                  onClick={() =>
                    dispatch({ type: 'TOGGLE_ITEM_FLAG', itemId: item.id, flag: 'locked' })
                  }
                >
                  {item.locked ? '解除鎖定' : '鎖定'}
                </button>
                <button
                  type="button"
                  aria-pressed={Boolean(item.favorite)}
                  onClick={() =>
                    dispatch({ type: 'TOGGLE_ITEM_FLAG', itemId: item.id, flag: 'favorite' })
                  }
                >
                  {item.favorite ? '取消收藏' : '收藏'}
                </button>
                <button
                  type="button"
                  aria-pressed={state.selectedSalvageIds.includes(item.id)}
                  disabled={item.locked || item.favorite}
                  onClick={() => dispatch({ type: 'TOGGLE_SALVAGE_SELECTION', itemId: item.id })}
                >
                  {state.selectedSalvageIds.includes(item.id) ? '移出分解' : '加入分解'}
                </button>
                <button
                  type="button"
                  disabled={item.locked || item.favorite}
                  onClick={() =>
                    dispatch({ type: 'FORGE_ITEM', itemId: item.id, forgeAction: 'salvage' })
                  }
                >
                  主動拆解
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
