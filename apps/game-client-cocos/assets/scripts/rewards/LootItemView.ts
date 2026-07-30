import { Color, Component, Graphics, UITransform } from 'cc';

import { addButton, addText, createUiNode } from '../ui/UiFactory';

export interface LootEntryViewModel {
  id: string;
  kind: 'equipment' | 'skill';
  name: string;
  rarity: string;
  color: string;
  summary: string;
  detailLines: readonly string[];
}

const colorFromHex = (hex: string): Color => {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return new Color((value >> 16) & 255, (value >> 8) & 255, value & 255, 255);
};

export class LootItemView extends Component {
  initialize(model: LootEntryViewModel, width: number, height: number, onTap: () => void): void {
    (this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform)).setContentSize(
      width,
      height,
    );
    const graphics = this.node.addComponent(Graphics);
    const rarity = colorFromHex(model.color);
    graphics.fillColor = new Color(7, 24, 25, 245);
    graphics.roundRect(-width / 2, -height / 2, width, height, 7);
    graphics.fill();
    graphics.strokeColor = rarity;
    graphics.lineWidth = model.rarity === 'legendary' ? 4 : 2;
    graphics.roundRect(-width / 2, -height / 2, width, height, 7);
    graphics.stroke();
    addText(
      createUiNode('Kind', this.node, width - 8, 18, 0, height * 0.25),
      model.kind === 'skill' ? '技能' : model.rarity,
      18,
      rarity,
    );
    addText(createUiNode('Name', this.node, width - 8, 34, 0, -2), model.name, 24);
    addText(
      createUiNode('Summary', this.node, width - 8, 18, 0, -height * 0.28),
      model.summary,
      18,
      new Color(240, 234, 210, 255),
    );
    addButton(this.node, onTap);
  }
}
