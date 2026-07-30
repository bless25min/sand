import { Component, Tween, UIOpacity, Vec3, tween } from 'cc';

import { COLORS, addText, createUiNode } from '../ui/UiFactory';

const compactSkillName = (name: string): string => name.split('・')[1] ?? name;

export class ActionBanner extends Component {
  private opacity?: UIOpacity;

  initialize(width: number): void {
    this.opacity = this.node.addComponent(UIOpacity);
    this.opacity.opacity = 0;
    createUiNode('BannerContent', this.node, width, 52);
  }

  show(skillName: string, relayTier: number): string {
    const content = this.node.getChildByName('BannerContent')!;
    content.removeAllChildren();
    const finisher = relayTier >= 6;
    const tierLabel = finisher ? 'FINISHER' : relayTier >= 2 ? `CHAIN ${relayTier}` : 'STRIKE';
    addText(
      createUiNode('ActionTier', content, 112, 24, -76, 18),
      tierLabel,
      finisher ? 19 : 16,
      finisher ? COLORS.gold : COLORS.muted,
    );
    const title = addText(
      createUiNode('ActionName', content, 190, 38, 36, -4),
      compactSkillName(skillName),
      29 + Math.min(4, relayTier),
      finisher ? COLORS.gold : COLORS.text,
    );
    title.isBold = true;
    this.node.setScale(new Vec3(0.78, 0.78, 1));
    this.opacity!.opacity = 0;
    Tween.stopAllByTarget(this.node);
    Tween.stopAllByTarget(this.opacity!);
    tween(this.node)
      .to(0.14, { scale: new Vec3(1.06, 1.06, 1) })
      .to(0.08, { scale: Vec3.ONE })
      .start();
    tween(this.opacity!).to(0.08, { opacity: 255 }).start();
    return tierLabel;
  }

  hide(): void {
    if (!this.opacity) return;
    tween(this.opacity).to(0.12, { opacity: 0 }).start();
  }
}
