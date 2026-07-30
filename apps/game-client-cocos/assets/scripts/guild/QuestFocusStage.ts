import { Color, Component, Graphics } from 'cc';

import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

interface QuestFocus {
  name: string;
  description: string;
  clearCount: number;
  challengeCount: number;
}

export class QuestFocusStage extends Component {
  renderQuestFocus(input: QuestFocus, width: number, height: number): void {
    addPanel(this.node, new Color(5, 24, 24, 220), COLORS.line);
    const title = addText(
      createUiNode('FocusTitle', this.node, width - 24, 34, 0, height / 2 - 19),
      input.name,
      24,
      COLORS.gold,
    );
    title.isBold = true;
    const route = createUiNode('ExpeditionRoute', this.node, width - 24, height * 0.45, 0, -4);
    const line = route.addComponent(Graphics);
    line.strokeColor = new Color(255, 199, 83, 120);
    line.lineWidth = 3;
    line.moveTo(-width * 0.3, -12);
    line.bezierCurveTo(-width * 0.14, 24, width * 0.1, -24, width * 0.3, 12);
    line.stroke();
    ['出發', '遭遇', '戰利品'].forEach((label, index) => {
      const x = (index - 1) * width * 0.3;
      const node = createUiNode(`RouteNode-${index + 1}`, route, 54, 54, x, index === 1 ? 7 : -7);
      const ring = node.addComponent(Graphics);
      ring.fillColor = index === 1 ? new Color(255, 101, 75, 210) : new Color(17, 55, 50, 240);
      ring.circle(0, 0, index === 1 ? 20 : 15);
      ring.fill();
      ring.strokeColor = index === 1 ? COLORS.gold : COLORS.hero;
      ring.lineWidth = 3;
      ring.circle(0, 0, index === 1 ? 24 : 19);
      ring.stroke();
      addText(createUiNode('NodeLabel', node, 62, 20, 0, -31), label, 14, COLORS.muted);
    });
    addText(
      createUiNode('QuestSummary', this.node, width - 28, 30, 0, -height / 2 + 20),
      `${input.description} · 制霸 ${input.clearCount} · 挑戰 ${input.challengeCount}`,
      15,
      COLORS.muted,
    );
  }
}
