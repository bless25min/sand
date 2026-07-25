import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem, GuildStatKey, HuntEquipmentItem } from '@expedition/shared-types';
import { useState } from 'react';

import { createEquipmentSensationModel } from '../presentation/equipment-sensation-model';
import { RARITY_LABEL, SLOT_LABEL, STAT_LABEL } from '../presenters';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface EquipmentCardProps {
  item: EquipmentItem;
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  selectedAdventurerId?: string;
  onAdventurerChange?: (adventurerId: string) => void;
  hideActions?: boolean;
}

function isHuntEquipment(item: EquipmentItem): item is HuntEquipmentItem {
  return 'qualityScore' in item && 'sourceEnemyId' in item;
}

export function EquipmentCard({
  item,
  state,
  dispatch,
  selectedAdventurerId,
  onAdventurerChange,
  hideActions = false,
}: EquipmentCardProps) {
  const sensation = createEquipmentSensationModel(item, state.profile, GUILD_GAME_CONTENT);
  const [internalAdventurerId, setInternalAdventurerId] = useState(sensation.bestAdventurer.id);
  const adventurerId = selectedAdventurerId ?? internalAdventurerId;
  const setAdventurerId = onAdventurerChange ?? setInternalAdventurerId;
  const comparison = sensation.comparisons.find(
    (candidate) => candidate.adventurerId === adventurerId,
  )!;
  const difference = comparison.powerDifference;
  const resolved = state.resolvedItemIds.includes(item.id);
  const statDiff = Object.entries(comparison.statDiff) as readonly [GuildStatKey, number][];

  return (
    <article
      className={`gr-reward-card gr-rarity--${item.rarity} ${resolved ? 'is-resolved' : ''}`}
    >
      <header>
        <div>
          <p>
            {RARITY_LABEL[item.rarity]} · {SLOT_LABEL[item.slot]}
          </p>
          <h3>{item.name}</h3>
        </div>
        <span>{resolved ? '已處理' : 'NEW'}</span>
      </header>
      <div className="gr-reward-stat">
        <span>{STAT_LABEL[item.mainStat.stat]}</span>
        <strong>+{item.mainStat.value}</strong>
      </div>
      {isHuntEquipment(item) && (
        <>
          <p className="gr-reward-quality">
            OVERKILL QUALITY {Math.round(item.qualityScore)}
            {item.jackpot ? ' · ANNIHILATION CHEST' : ''}
          </p>
          <div className="gr-reward-linkage">
            <span>來源敵人：{sensation.sourceEnemyName ?? item.sourceEnemyId}</span>
            <span>適配 Build：{sensation.recommendedBuildNames.join('、') || '泛用引擎'}</span>
            <strong>最佳裝備者：{sensation.bestAdventurer.name}</strong>
          </div>
        </>
      )}
      <ul>
        {item.affixes.length ? (
          item.affixes.map((affix, index) => (
            <li key={`${affix.stat}-${index}`}>
              {affix.label && <b>{affix.label} · </b>}
              {STAT_LABEL[affix.stat]} +{affix.value}
            </li>
          ))
        ) : (
          <li>無附加屬性</li>
        )}
      </ul>
      {sensation.rules.length > 0 && (
        <div className="gr-reward-rules">
          <strong>規則上線預覽</strong>
          {sensation.rules.map((rule) => (
            <span key={rule.id}>
              <b>{rule.name}</b> · {rule.description}
            </span>
          ))}
        </div>
      )}
      <label>
        比較對象
        <select value={adventurerId} onChange={(event) => setAdventurerId(event.target.value)}>
          {state.profile.party.map((candidate) => {
            const hero = GUILD_GAME_CONTENT.adventurers.find(
              (definition) => definition.id === candidate.definitionId,
            )!;
            return (
              <option value={candidate.definitionId} key={candidate.definitionId}>
                {hero.name}
                {hero.id === sensation.bestAdventurer.id ? ' · BEST' : ''}
              </option>
            );
          })}
        </select>
      </label>
      <div className={`gr-compare ${difference >= 0 ? 'is-up' : 'is-down'}`}>
        <span>對比目前{SLOT_LABEL[item.slot]}</span>
        <strong>
          {difference >= 0 ? '+' : ''}
          {difference} 綜合值
        </strong>
      </div>
      <dl className="gr-stat-diff" aria-label="完整屬性差異">
        {statDiff.map(([stat, value]) => (
          <div key={stat}>
            <dt>{STAT_LABEL[stat]}</dt>
            <dd>
              {value >= 0 ? '+' : ''}
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {!hideActions && (
        <div className="gr-reward-actions">
          <button
            type="button"
            disabled={resolved}
            onClick={() =>
              dispatch({ type: 'CHOOSE_ITEM', itemId: item.id, choice: 'equip', adventurerId })
            }
          >
            立即裝備
          </button>
          <button
            type="button"
            disabled={resolved || state.profile.inventory.length >= 20}
            title={state.profile.inventory.length >= 20 ? '背包已滿' : undefined}
            onClick={() =>
              dispatch({ type: 'CHOOSE_ITEM', itemId: item.id, choice: 'keep', adventurerId })
            }
          >
            放入背包
          </button>
          <button
            type="button"
            disabled={resolved}
            onClick={() =>
              dispatch({ type: 'CHOOSE_ITEM', itemId: item.id, choice: 'sell', adventurerId })
            }
          >
            售出 +{item.sellValue}G
          </button>
        </div>
      )}
    </article>
  );
}
