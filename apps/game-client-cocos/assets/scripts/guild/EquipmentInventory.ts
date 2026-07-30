import { Color, Component } from 'cc';

import type { RuntimeRewardItem } from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

const RARITY_COLOR: Readonly<Record<RuntimeRewardItem['rarity'], Color>> = {
  common: new Color(129, 145, 140, 255),
  uncommon: new Color(82, 203, 126, 255),
  rare: new Color(74, 157, 255, 255),
  epic: new Color(184, 99, 255, 255),
  legendary: new Color(255, 176, 53, 255),
};

export class EquipmentInventory extends Component {
  render(
    items: readonly RuntimeRewardItem[],
    width: number,
    height: number,
    selectedIds: readonly string[],
    onSelect: (item: RuntimeRewardItem) => void,
  ): void {
    this.node.removeAllChildren();
    const cardWidth = (width - 16) / 3;
    const cardHeight = (height - 8) / 2;
    items.forEach((item, index) => {
      const node = createUiNode(
        `Equipment-${item.id}`,
        this.node,
        cardWidth - 5,
        cardHeight - 5,
        -width / 2 + 8 + cardWidth / 2 + (index % 3) * cardWidth,
        height / 2 - cardHeight / 2 - Math.floor(index / 3) * cardHeight,
      );
      const color = RARITY_COLOR[item.rarity];
      addPanel(node, COLORS.panel, color);
      addText(
        node,
        `${item.name}\n${item.mainStat.stat} +${item.mainStat.value}${selectedIds.indexOf(item.id) >= 0 ? '\n待分解' : ''}`,
        15,
        color,
      );
      addButton(node, () => onSelect(item));
    });
  }
}
