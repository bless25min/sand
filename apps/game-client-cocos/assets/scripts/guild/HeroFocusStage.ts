import { Color, Component, Graphics, HorizontalTextAlignment } from 'cc';

import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

interface HeroFocus {
  name: string;
  title: string;
  role: string;
  order: number;
  skillCount: number;
  equipmentCount: number;
}

export class HeroFocusStage extends Component {
  renderHeroFocus(input: HeroFocus, width: number, height: number): void {
    addPanel(this.node, new Color(5, 24, 24, 220), COLORS.line);
    const silhouette = createUiNode(
      'HeroSilhouette',
      this.node,
      width * 0.33,
      height - 18,
      -width * 0.3,
    );
    const figure = silhouette.addComponent(Graphics);
    figure.fillColor = new Color(88, 218, 162, 72);
    figure.circle(0, height * 0.2, height * 0.1);
    figure.fill();
    figure.roundRect(-height * 0.11, -height * 0.24, height * 0.22, height * 0.34, 12);
    figure.fill();
    figure.strokeColor = COLORS.hero;
    figure.lineWidth = 3;
    figure.circle(0, height * 0.2, height * 0.13);
    figure.roundRect(-height * 0.14, -height * 0.27, height * 0.28, height * 0.4, 15);
    figure.stroke();
    const name = addText(
      createUiNode('HeroName', this.node, width * 0.55, 34, width * 0.17, height * 0.3),
      `${input.order}棒・${input.name}`,
      27,
      COLORS.gold,
    );
    name.horizontalAlign = HorizontalTextAlignment.LEFT;
    addText(
      createUiNode('HeroRole', this.node, width * 0.55, 25, width * 0.17, height * 0.12),
      `${input.title}・${input.role}`,
      17,
      COLORS.text,
    ).horizontalAlign = HorizontalTextAlignment.LEFT;
    this.pips('SkillPip', input.skillCount, 6, width * 0.02, -height * 0.13, COLORS.hero);
    this.pips('EquipmentPip', input.equipmentCount, 3, width * 0.19, -height * 0.31, COLORS.gold);
    addText(
      createUiNode('HeroReadout', this.node, width * 0.45, 24, width * 0.26, -height * 0.32),
      `技能 ${input.skillCount}/6 · 裝備 ${input.equipmentCount}/3`,
      15,
      COLORS.muted,
    );
  }

  private pips(
    name: string,
    activeCount: number,
    total: number,
    x: number,
    y: number,
    color: Color,
  ): void {
    for (let index = 0; index < total; index += 1) {
      const pip = createUiNode(`${name}-${index + 1}`, this.node, 18, 18, x + index * 25, y);
      const graphic = pip.addComponent(Graphics);
      graphic.fillColor = index < activeCount ? color : new Color(42, 58, 55, 255);
      graphic.circle(0, 0, 7);
      graphic.fill();
    }
  }
}
