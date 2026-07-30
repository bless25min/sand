import { Color, Component, Label, Vec3, tween } from 'cc';
import type { Node } from 'cc';

import { addText, createUiNode } from '../ui/UiFactory';

export class DamageNumberPool extends Component {
  private readonly pool: Node[] = [];

  show(target: Node | undefined, value: number, kind: string, tier: number): void {
    if (!target) return;
    const node = this.pool.pop() ?? createUiNode('DamageNumber', this.node, 120, 48);
    node.setParent(target);
    const text = node.getComponent(Label) ?? addText(node, '', 24);
    text.string =
      kind === 'healing'
        ? `治療 +${value}`
        : kind === 'status'
          ? `層數 +${value}`
          : `傷害 ${value}`;
    text.fontSize = 30 + tier * 3;
    text.color =
      kind === 'healing'
        ? new Color(89, 232, 151, 255)
        : kind === 'overkill'
          ? new Color(255, 196, 54, 255)
          : new Color(255, 241, 221, 255);
    node.active = true;
    node.setPosition(new Vec3(0, 76));
    node.setScale(0.65, 0.65);
    tween(node)
      .to(0.08, { scale: new Vec3(1.1 + tier * 0.04, 1.1 + tier * 0.04, 1) })
      .by(0.36, { position: new Vec3(0, 52) })
      .call(() => {
        node.active = false;
        this.pool.push(node);
      })
      .start();
  }
}
