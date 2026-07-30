import { Color, Component } from 'cc';

import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

interface SkillFocus {
  name: string;
  stars: number;
  components: readonly {
    element: string;
    specialization: string;
    trigger: string;
    result: string;
  }[];
}

export class SkillFocusStage extends Component {
  renderSkillFocus(input: SkillFocus, width: number, height: number): void {
    addPanel(this.node, new Color(5, 24, 24, 220), COLORS.line);
    const title = addText(
      createUiNode('SkillFocusName', this.node, width - 20, 28, 0, height / 2 - 17),
      `${input.name} · ${input.stars}★`,
      20,
      COLORS.gold,
    );
    title.isBold = true;
    input.components.slice(0, 3).forEach((component, index) => {
      const rowY = height / 2 - 37 - index * 19;
      const row = createUiNode(`SkillComponent-${index + 1}`, this.node, width - 18, 18, 0, rowY);
      addPanel(row, new Color(10, 35, 33, 220), index === 0 ? COLORS.gold : COLORS.line);
      addText(
        createUiNode('Effect', row, width * 0.33, 18, -width * 0.3),
        `${index + 1}. ${component.element}${component.specialization}`,
        13,
        COLORS.text,
      );
      addText(createUiNode('CausalArrow', row, 14, 18, -width * 0.1), '›', 17, COLORS.gold);
      addText(
        createUiNode('Trigger', row, width * 0.28, 18, width * 0.02),
        component.trigger,
        13,
        COLORS.gold,
      );
      addText(createUiNode('CausalArrow', row, 14, 18, width * 0.18), '›', 17, COLORS.gold);
      addText(
        createUiNode('Result', row, width * 0.25, 18, width * 0.34),
        component.result,
        13,
        COLORS.muted,
      );
    });
  }
}
