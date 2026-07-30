import { Color, Component } from 'cc';

import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

interface EquipmentFocus {
  heroName: string;
  slots: readonly { label: string; itemName?: string }[];
}

export class EquipmentFocusStage extends Component {
  renderEquipmentFocus(input: EquipmentFocus, width: number, height: number): void {
    addPanel(this.node, new Color(5, 24, 24, 220), COLORS.line);
    const title = addText(
      createUiNode('FocusTitle', this.node, width - 24, 34, 0, height / 2 - 19),
      `${input.heroName}・裝備構築`,
      24,
      COLORS.gold,
    );
    title.isBold = true;
    const socketWidth = (width - 42) / 3;
    input.slots.forEach((slot, index) => {
      const socket = createUiNode(
        `EquipmentSocket-${index + 1}`,
        this.node,
        socketWidth,
        height - 52,
        (index - 1) * (socketWidth + 8),
        -14,
      );
      const equipped = Boolean(slot.itemName);
      addPanel(
        socket,
        equipped ? new Color(76, 55, 19, 174) : new Color(10, 31, 30, 218),
        equipped ? COLORS.gold : COLORS.muted,
      );
      addText(
        createUiNode('Slot', socket, socketWidth - 8, 20, 0, 19),
        slot.label,
        14,
        COLORS.muted,
      );
      addText(
        createUiNode('Item', socket, socketWidth - 8, 42, 0, -10),
        slot.itemName ?? '＋',
        equipped ? 16 : 27,
        equipped ? COLORS.text : COLORS.muted,
      );
    });
  }
}
