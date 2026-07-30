import { Component } from 'cc';

import type { RuntimeGuildAction, RuntimeGuildPage } from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

const DESTINATIONS: readonly { id: RuntimeGuildPage; label: string }[] = [
  { id: 'quest', label: '遠征' },
  { id: 'party', label: '隊伍' },
  { id: 'skills', label: '技能' },
  { id: 'equipment', label: '裝備' },
];

export class GuildNav extends Component {
  initialize(
    activePage: RuntimeGuildPage,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
  ): void {
    const gap = 8;
    const itemWidth = (width - gap * 5) / 4;
    DESTINATIONS.forEach((destination, index) => {
      const node = createUiNode(
        `Nav-${destination.id}`,
        this.node,
        itemWidth,
        height - 10,
        -width / 2 + gap + itemWidth / 2 + index * (itemWidth + gap),
      );
      const selected = destination.id === activePage;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.muted);
      addText(node, destination.label, 22, selected ? COLORS.ink : COLORS.text);
      addButton(node, () => dispatch({ type: 'NAVIGATE', page: destination.id }));
    });
  }
}
