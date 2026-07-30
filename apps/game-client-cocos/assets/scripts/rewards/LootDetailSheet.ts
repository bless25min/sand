import { Component, Node } from 'cc';
import type { Label } from 'cc';

import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';
import type { LootEntryViewModel } from './LootItemView';

export class LootDetailSheet extends Component {
  private title?: Label;
  private details?: Label;
  private onClose?: () => void;

  initialize(width: number, height: number, onClose: () => void): void {
    this.onClose = onClose;
    addPanel(this.node);
    this.title = addText(
      createUiNode('Title', this.node, width - 36, 34, 0, height * 0.3),
      '',
      30,
      COLORS.gold,
    );
    this.details = addText(
      createUiNode('Details', this.node, width - 36, height * 0.48, 0, -8),
      '',
      24,
    );
    const close = createUiNode('Close', this.node, 96, 34, width * 0.3, -height * 0.34);
    addPanel(close);
    addText(close, '收起', 22);
    close.on(Node.EventType.TOUCH_END, () => this.onClose?.());
    close.on(Node.EventType.MOUSE_UP, () => this.onClose?.());
    this.node.active = false;
  }

  show(model: LootEntryViewModel): void {
    this.title!.string = `${model.name}・${model.rarity}`;
    this.details!.string = [model.summary, ...model.detailLines].join('\n');
    this.node.active = true;
  }

  hide(): void {
    this.node.active = false;
  }
}
