import { Color, Component, HorizontalTextAlignment, Node } from 'cc';

import { formatComboCue } from '../../runtime/expedition-runtime.mjs';
import type { RuntimeSkill } from '../runtime/RuntimeContracts';
import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

export interface SkillTileState {
  skill: RuntimeSkill;
  selected: boolean;
  comboSteps: readonly {
    triggerId: string;
    readiness: 'ready' | 'pending-impact' | 'not-ready';
  }[];
  damage?: number;
  hits?: number;
  chases?: number;
  execution?: boolean;
  echoes?: number;
}

export class SkillDock extends Component {
  private onTap?: (skillId: string) => void;

  initialize(onTap: (skillId: string) => void): void {
    this.onTap = onTap;
  }

  render(skills: readonly SkillTileState[], width: number, height: number): void {
    this.node.removeAllChildren();
    const gap = 8;
    const desktop = width >= 900;
    const columns = desktop ? 6 : 3;
    const rows = desktop ? 1 : 2;
    const tileWidth = (width - gap * (columns + 1)) / columns;
    const tileHeight = (height - gap * (rows + 1)) / rows;
    skills.slice(0, 6).forEach((state, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = -width / 2 + gap + tileWidth / 2 + column * (tileWidth + gap);
      const y = height / 2 - gap - tileHeight / 2 - row * (tileHeight + gap);
      const tile = createUiNode(state.skill.id, this.node, tileWidth, tileHeight, x, y);
      const component = state.skill.components[0];
      const elementColor =
        component?.element === 'fire'
          ? new Color(255, 101, 75, 255)
          : component?.element === 'grass'
            ? new Color(88, 218, 122, 255)
            : new Color(75, 183, 255, 255);
      const panel = addPanel(
        tile,
        state.selected ? new Color(50, 39, 14, 245) : COLORS.panel,
        state.selected ? COLORS.gold : elementColor,
      );
      panel.lineWidth = state.selected ? 5 : 2;
      const name = createUiNode('Name', tile, tileWidth - 18, 42, 0, tileHeight * 0.25);
      const label = addText(name, state.skill.name, 34, elementColor);
      label.horizontalAlign = HorizontalTextAlignment.LEFT;
      if (component) {
        const cue = formatComboCue(state.comboSteps);
        addText(
          createUiNode('Trigger', tile, tileWidth - 18, 30, 0, 0),
          cue.text,
          24,
          cue.state === 'ready'
            ? COLORS.gold
            : cue.state === 'partial'
              ? COLORS.text
              : COLORS.muted,
        );
      }
      if (state.damage !== undefined) {
        this.addMetrics(
          tile,
          tileWidth,
          tileHeight,
          state.damage,
          state.hits ?? 1,
          state.chases ?? 0,
          state.execution ?? false,
          state.echoes ?? 0,
        );
      }
      tile.on(Node.EventType.TOUCH_END, () => this.onTap?.(state.skill.id));
      tile.on(Node.EventType.MOUSE_UP, () => this.onTap?.(state.skill.id));
    });
  }

  private addMetrics(
    tile: Node,
    tileWidth: number,
    tileHeight: number,
    damage: number,
    hits: number,
    chases: number,
    execution: boolean,
    echoes: number,
  ): void {
    const metrics = createUiNode('Metrics', tile, tileWidth - 18, 48, 0, -tileHeight * 0.26);
    addPanel(metrics, new Color(0, 0, 0, 105), COLORS.muted);
    const contentWidth = tileWidth - 26;
    addText(
      createUiNode('Damage', metrics, contentWidth * 0.46, 42, -contentWidth * 0.24),
      execution ? `處刑 +${damage}` : `總傷 ${damage}`,
      29,
      COLORS.gold,
    );
    addText(
      createUiNode('Segments', metrics, contentWidth * 0.5, 42, contentWidth * 0.23),
      execution
        ? `${echoes} 次・OVERKILL`
        : chases > 0
          ? `${hits} 段・追擊 +${chases}`
          : `${hits} 段・無追擊`,
      22,
      COLORS.text,
    );
  }
}
