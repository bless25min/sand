import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem, HuntEquipmentItem } from '@expedition/shared-types';
import { equipmentPower } from '@expedition/simulation-core';
import { useState } from 'react';

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
  const [internalAdventurerId, setInternalAdventurerId] = useState(state.profile.leaderId);
  const adventurerId = selectedAdventurerId ?? internalAdventurerId;
  const setAdventurerId = onAdventurerChange ?? setInternalAdventurerId;
  const member = state.profile.party.find((candidate) => candidate.definitionId === adventurerId)!;
  const equipped = member.equipment[item.slot];
  const difference = equipmentPower(item) - equipmentPower(equipped);
  const resolved = state.resolvedItemIds.includes(item.id);

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
        <p className="gr-reward-quality">
          OVERKILL QUALITY {Math.round(item.qualityScore)}
          {item.jackpot ? ' · ANNIHILATION CHEST' : ''}
        </p>
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
      {item.ruleIds && item.ruleIds.length > 0 && (
        <p>
          規則節點：
          {item.ruleIds
            .map((ruleId) => GUILD_GAME_CONTENT.rules[ruleId]?.name ?? ruleId)
            .join(' · ')}
        </p>
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
