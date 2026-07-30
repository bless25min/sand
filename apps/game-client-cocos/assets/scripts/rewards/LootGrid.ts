import { Component, Vec3 } from 'cc';

import { createUiNode } from '../ui/UiFactory';
import { LootItemView, type LootEntryViewModel } from './LootItemView';

export class LootGrid extends Component {
  render(
    entries: readonly LootEntryViewModel[],
    width: number,
    height: number,
    onTap: (id: string) => void,
  ): void {
    this.node.removeAllChildren();
    const columns = 4;
    const rows = 5;
    const gap = 5;
    const cellWidth = (width - gap * (columns + 1)) / columns;
    const cellHeight = (height - gap * (rows + 1)) / rows;
    entries.slice(0, columns * rows).forEach((entry, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = -width / 2 + gap + cellWidth / 2 + column * (cellWidth + gap);
      const y = height / 2 - gap - cellHeight / 2 - row * (cellHeight + gap);
      const node = createUiNode(entry.id, this.node, cellWidth, cellHeight);
      node.setPosition(new Vec3(x, y));
      node
        .addComponent(LootItemView)
        .initialize(entry, cellWidth, cellHeight, () => onTap(entry.id));
    });
  }
}
