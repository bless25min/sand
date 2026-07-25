import type { EquipmentItem } from '@expedition/shared-types';
import type { Dispatch, SetStateAction } from 'react';

import type { ThumbDeckAction } from '../components/ThumbCommandDeck';
import { SLOT_LABEL } from '../presenters';
import type { GuildRpgAction } from '../state/game-reducer';
import { wrapThumbIndex } from './thumb-deck-model';

type IndexSetter = Dispatch<SetStateAction<number>>;

interface InventoryActionsInput {
  visibleItems: readonly EquipmentItem[];
  selectedItem: EquipmentItem | undefined;
  inventoryLength: number;
  inventoryPage: number;
  inventoryPageCount: number;
  equipHeroName: string;
  equipMemberId: string;
  partyLength: number;
  dispatch: React.Dispatch<GuildRpgAction>;
  setItemIndex: IndexSetter;
  setInventoryPage: IndexSetter;
  setEquipHeroIndex: IndexSetter;
}

export function createInventoryThumbActions({
  visibleItems,
  selectedItem,
  inventoryLength,
  inventoryPage,
  inventoryPageCount,
  equipHeroName,
  equipMemberId,
  partyLength,
  dispatch,
  setItemIndex,
  setInventoryPage,
  setEquipHeroIndex,
}: InventoryActionsInput): readonly ThumbDeckAction[] {
  return [
    ...visibleItems.map((item, index) => ({
      id: item.id,
      label: `${index + 1}. ${item.name}`,
      detail: SLOT_LABEL[item.slot],
      slot: index === 0 ? ('choice-a' as const) : ('choice-b' as const),
      selected: selectedItem?.id === item.id,
      onPress: () => setItemIndex(index),
    })),
    {
      id: 'next-inventory-page',
      label: '下一頁',
      detail: `${inventoryPage + 1}/${inventoryPageCount}`,
      slot: 'utility',
      disabled: inventoryLength <= 2,
      onPress: () => {
        setInventoryPage((current) => (current + 1) % inventoryPageCount);
        setItemIndex(0);
      },
    },
    {
      id: 'equip-hero',
      label: equipHeroName,
      detail: '裝備對象',
      slot: 'secondary',
      onPress: () => setEquipHeroIndex((current) => wrapThumbIndex(current, partyLength, 1)),
    },
    {
      id: 'equip-item',
      label: selectedItem ? `裝備給${equipHeroName}` : '尚無裝備',
      detail: selectedItem?.name,
      slot: 'primary',
      tone: 'primary',
      disabled: !selectedItem,
      onPress: () => {
        if (!selectedItem) return;
        dispatch({
          type: 'EQUIP_STORED',
          itemId: selectedItem.id,
          adventurerId: equipMemberId,
        });
        setItemIndex(0);
      },
    },
  ];
}
