import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem } from '@expedition/shared-types';
import type { ReactNode } from 'react';

import { RARITY_LABEL, SLOT_LABEL, STAT_LABEL } from '../presenters';

interface InventoryItemCardProps {
  item: EquipmentItem;
  selected?: boolean;
  children?: ReactNode;
}

export function InventoryItemCard({ item, selected = false, children }: InventoryItemCardProps) {
  return (
    <article
      className={`gr-item gr-rarity--${item.rarity} ${selected ? 'is-mobile-selected' : ''}`}
      aria-current={selected ? 'true' : undefined}
    >
      <p>
        {RARITY_LABEL[item.rarity]} · {SLOT_LABEL[item.slot]}
      </p>
      <h3>{item.name}</h3>
      <strong>
        {STAT_LABEL[item.mainStat.stat]} +{item.mainStat.value}
      </strong>
      <span>
        {item.affixes.length
          ? item.affixes
              .map(
                (affix) =>
                  `${affix.label ? `${affix.label} · ` : ''}${STAT_LABEL[affix.stat]} +${affix.value}`,
              )
              .join(' · ')
          : '無附加屬性'}
      </span>
      {item.ruleIds && item.ruleIds.length > 0 && (
        <span>
          規則節點：
          {item.ruleIds
            .map((ruleId) => GUILD_GAME_CONTENT.rules[ruleId]?.name ?? ruleId)
            .join(' · ')}
        </span>
      )}
      {children}
    </article>
  );
}
