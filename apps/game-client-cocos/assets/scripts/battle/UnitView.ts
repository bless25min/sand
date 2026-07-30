import { Color, Component, Graphics, Node, UIOpacity, UITransform, Vec3 } from 'cc';
import type { Label } from 'cc';

import type { RuntimeUnit } from '../runtime/RuntimeContracts';
import { COLORS, addText, createUiNode } from '../ui/UiFactory';

const UNIT_COLORS: Readonly<Record<string, Color>> = {
  brann: new Color(206, 80, 52, 255),
  lyra: new Color(80, 189, 116, 255),
  elin: new Color(72, 165, 211, 255),
  seph: new Color(145, 188, 59, 255),
  lorne: new Color(91, 104, 198, 255),
  kyro: new Color(228, 112, 48, 255),
};

export class UnitView extends Component {
  private unit?: RuntimeUnit;
  private selected = false;
  private nameLabel?: Label;
  private onTap?: (unit: RuntimeUnit) => void;
  private compact = false;
  private compactScale = 1;
  private width = 154;
  private height = 190;

  initialize(
    unit: RuntimeUnit,
    onTap: (unit: RuntimeUnit) => void,
    compact = false,
    width = compact ? 112 : 154,
    height = compact ? 120 : 190,
  ): void {
    this.unit = unit;
    this.onTap = onTap;
    this.compact = compact;
    this.width = width;
    this.height = height;
    this.compactScale = compact ? Math.min(width / 112, height / 120) : 1;
    const scale = this.compactScale;
    this.node.addComponent(UITransform).setContentSize(this.width, this.height);
    this.node.addComponent(UIOpacity);
    this.drawBody();
    const badge = addText(
      createUiNode(
        'Badge',
        this.node,
        compact ? 38 * scale : 54,
        compact ? 38 * scale : 54,
        0,
        compact ? 16 * scale : 21,
      ),
      unit.name.slice(0, 1),
      compact ? Math.round(23 * scale) : 32,
    );
    badge.color = new Color(255, 246, 211, 255);
    const nameNode = createUiNode(
      'Name',
      this.node,
      this.width,
      compact ? 28 * scale : 42,
      0,
      compact ? -37 * scale : -65,
    );
    this.nameLabel = addText(nameNode, unit.name, compact ? Math.round(19 * scale) : 28);
    this.node.on(Node.EventType.TOUCH_END, this.handleTap, this);
    this.node.on(Node.EventType.MOUSE_UP, this.handleTap, this);
    this.render(unit, false);
  }

  render(unit: RuntimeUnit, selected: boolean): void {
    this.unit = unit;
    this.selected = selected;
    this.nameLabel!.string =
      unit.side === 'enemies' && unit.currentHp <= 0
        ? `${unit.name}・處刑`
        : `${unit.name}  ${unit.currentHp}/${unit.stats.hp}`;
    this.drawHp();
    this.drawSelection();
    this.node.getComponent(UIOpacity)!.opacity =
      unit.side === 'enemies' && unit.currentHp <= 0 ? (selected ? 220 : 105) : 255;
    this.node.active = unit.side === 'enemies' || unit.currentHp > 0;
  }

  private drawBody(): void {
    const body = this.node.addComponent(Graphics);
    const hero = this.unit?.side === 'heroes';
    const scale = this.compactScale;
    const radius = this.compact ? 33 * scale : 44;
    const centerY = this.compact ? 15 * scale : 22;
    const shoulder = this.compact ? 34 * scale : 44;
    const footY = this.compact ? -31 * scale : -48;
    body.fillColor = hero
      ? (UNIT_COLORS[this.unit?.id ?? ''] ?? new Color(58, 148, 113, 255))
      : new Color(190, 69, 46, 255);
    body.circle(0, centerY, radius);
    body.fill();
    body.moveTo(-shoulder, centerY - 5);
    body.lineTo(-shoulder - (this.compact ? 8 : 14), footY);
    body.lineTo(shoulder + (this.compact ? 8 : 14), footY);
    body.lineTo(shoulder, centerY - 5);
    body.fill();
    body.strokeColor = hero ? COLORS.hero : COLORS.enemy;
    body.lineWidth = this.compact ? 4 * scale : 4;
    body.circle(0, centerY, radius);
    body.stroke();
    this.drawRoleSilhouette(body, hero);
  }

  private drawHp(): void {
    const barNode = this.node.getChildByName('HpBar') ?? new Node('HpBar');
    if (!barNode.parent) this.node.addChild(barNode);
    const hpBar = barNode.getComponent(Graphics) ?? barNode.addComponent(Graphics);
    hpBar.clear();
    const ratio = Math.max(0, this.unit!.currentHp / this.unit!.stats.hp);
    hpBar.fillColor = new Color(30, 42, 40, 255);
    const barWidth = this.width * 0.86;
    const barY = -this.height / 2 + (this.compact ? 4 : 5);
    const barHeight = this.compact ? 9 * this.compactScale : 13;
    hpBar.roundRect(-barWidth / 2, barY, barWidth, barHeight, 6);
    hpBar.fill();
    hpBar.fillColor = this.unit!.side === 'heroes' ? COLORS.hero : COLORS.enemy;
    hpBar.roundRect(-barWidth / 2, barY, barWidth * ratio, barHeight, 6);
    hpBar.fill();
  }

  private drawSelection(): void {
    const ring = this.node.getChildByName('Selection') ?? new Node('Selection');
    if (!ring.parent) this.node.addChild(ring);
    ring.setPosition(Vec3.ZERO);
    const graphics = ring.getComponent(Graphics) ?? ring.addComponent(Graphics);
    graphics.clear();
    if (!this.selected) return;
    graphics.strokeColor = COLORS.gold;
    graphics.lineWidth = 4;
    graphics.ellipse(
      0,
      this.compact ? -2 * this.compactScale : -5,
      this.width * 0.49,
      this.height * 0.49,
    );
    graphics.stroke();
  }

  private drawRoleSilhouette(body: Graphics, hero: boolean): void {
    body.strokeColor = new Color(255, 242, 191, 230);
    const scale = this.compactScale;
    body.lineWidth = this.compact ? 3 * scale : 5;
    if (!hero) {
      body.moveTo(-18 * scale, 25 * scale);
      body.lineTo(-30 * scale, 43 * scale);
      body.moveTo(18 * scale, 25 * scale);
      body.lineTo(30 * scale, 43 * scale);
      body.moveTo(-23 * scale, -7 * scale);
      body.lineTo(23 * scale, -7 * scale);
      body.stroke();
      return;
    }
    const id = this.unit?.id ?? '';
    const reach = this.compact ? 45 * scale : 67;
    if (id === 'lyra') {
      body.arc(reach * 0.38, 2, reach * 0.45, -1.35, 1.35, false);
      body.moveTo(reach * 0.48, this.compact ? -39 * scale : -39);
      body.lineTo(reach * 0.48, this.compact ? 43 * scale : 43);
    } else if (id === 'elin') {
      body.moveTo(reach * 0.55, this.compact ? -38 * scale : -38);
      body.lineTo(reach * 0.55, this.compact ? 43 * scale : 43);
      body.circle(reach * 0.55, this.compact ? 47 * scale : 47, this.compact ? 7 * scale : 10);
    } else if (id === 'seph') {
      body.roundRect(
        -reach * 0.72,
        this.compact ? -24 * scale : -24,
        this.compact ? 25 * scale : 38,
        this.compact ? 47 * scale : 68,
        8,
      );
    } else if (id === 'lorne') {
      body.moveTo(-reach * 0.68, this.compact ? -36 * scale : -36);
      body.lineTo(-reach * 0.2, this.compact ? 25 * scale : 25);
      body.moveTo(reach * 0.68, this.compact ? -36 * scale : -36);
      body.lineTo(reach * 0.2, this.compact ? 25 * scale : 25);
    } else if (id === 'kyro') {
      body.moveTo(reach * 0.6, this.compact ? -35 * scale : -35);
      body.lineTo(reach * 0.6, this.compact ? 32 * scale : 32);
      body.rect(
        reach * 0.35,
        this.compact ? 29 * scale : 29,
        this.compact ? 28 * scale : 42,
        this.compact ? 17 * scale : 24,
      );
    } else {
      body.moveTo(reach * 0.55, this.compact ? -39 * scale : -39);
      body.lineTo(reach * 0.55, this.compact ? 38 * scale : 38);
      body.lineTo(reach * 0.32, this.compact ? 22 * scale : 22);
    }
    body.stroke();
  }

  private handleTap(): void {
    if (this.unit && (this.unit.side === 'enemies' || this.unit.currentHp > 0)) {
      this.onTap?.(this.unit);
    }
  }
}
