import { Color, Component, Graphics } from 'cc';

import { createUiNode } from '../ui/UiFactory';

export class BattleBackdrop extends Component {
  render(width: number, height: number): void {
    const canvas = this.node.addComponent(Graphics);
    canvas.fillColor = new Color(3, 20, 22, 255);
    canvas.rect(-width / 2, -height / 2, width, height);
    canvas.fill();

    canvas.fillColor = new Color(33, 66, 59, 155);
    canvas.moveTo(-width / 2, height * 0.12);
    canvas.lineTo(-width * 0.32, height * 0.33);
    canvas.lineTo(-width * 0.18, height * 0.16);
    canvas.lineTo(0, height * 0.39);
    canvas.lineTo(width * 0.18, height * 0.15);
    canvas.lineTo(width * 0.36, height * 0.3);
    canvas.lineTo(width / 2, height * 0.12);
    canvas.lineTo(width / 2, -height * 0.04);
    canvas.lineTo(-width / 2, -height * 0.04);
    canvas.close();
    canvas.fill();

    this.drawTerritory('EnemyTerritory', height * 0.22, width, height, new Color(255, 92, 58, 23));
    this.drawTerritory('HeroTerritory', -height * 0.25, width, height, new Color(72, 235, 166, 24));

    const horizon = createUiNode('HorizonGlow', this.node, width, 1, 0, height * 0.08);
    const horizonLine = horizon.addComponent(Graphics);
    horizonLine.strokeColor = new Color(255, 198, 84, 72);
    horizonLine.lineWidth = 2;
    horizonLine.moveTo(-width * 0.42, 0);
    horizonLine.lineTo(width * 0.42, 0);
    horizonLine.stroke();

    const clash = createUiNode('ClashLine', this.node, 2, height * 0.66);
    const clashLine = clash.addComponent(Graphics);
    clashLine.strokeColor = new Color(255, 199, 83, 74);
    clashLine.lineWidth = 2;
    for (let y = -height * 0.27; y < height * 0.27; y += 18) {
      clashLine.moveTo(0, y);
      clashLine.lineTo(0, Math.min(y + 9, height * 0.27));
    }
    clashLine.stroke();

    const ground = createUiNode('GroundRings', this.node, width, height);
    const rings = ground.addComponent(Graphics);
    rings.strokeColor = new Color(101, 168, 134, 43);
    rings.lineWidth = 2;
    [-0.36, -0.12, 0.17].forEach((vertical, index) => {
      rings.ellipse(0, height * vertical, width * (0.3 + index * 0.12), height * 0.065);
    });
    rings.stroke();
  }

  private drawTerritory(
    name: string,
    y: number,
    width: number,
    height: number,
    color: Color,
  ): void {
    const territory = createUiNode(name, this.node, width, height * 0.42, 0, y);
    const graphic = territory.addComponent(Graphics);
    graphic.fillColor = color;
    graphic.ellipse(0, 0, width * 0.46, height * 0.18);
    graphic.fill();
  }
}
