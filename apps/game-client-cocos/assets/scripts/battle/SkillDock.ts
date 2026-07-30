import { Color, Component, HorizontalTextAlignment } from 'cc';

import { createComboTrack } from '../../runtime/expedition-runtime.mjs';
import type { RuntimeSkill } from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

export interface SkillTileState {
  skill: RuntimeSkill;
  selected: boolean;
  comboSteps: readonly {
    triggerId: string;
    readiness: 'ready' | 'pending-impact' | 'not-ready';
    eventCount?: number;
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
      const badge = createUiNode('Element', tile, 42, 42, -tileWidth / 2 + 30, tileHeight * 0.25);
      const badgePanel = addPanel(badge, elementColor, elementColor);
      badgePanel.lineWidth = 0;
      addText(
        badge,
        component?.element === 'fire' ? '火' : component?.element === 'grass' ? '草' : '水',
        23,
        COLORS.ink,
      );
      const name = createUiNode(
        'Name',
        tile,
        tileWidth - 106,
        42,
        -tileWidth * 0.04,
        tileHeight * 0.25,
      );
      const label = addText(name, state.skill.name, 29, COLORS.text);
      label.horizontalAlign = HorizontalTextAlignment.LEFT;
      const track = createComboTrack(state.comboSteps) as readonly {
        state: 'opening' | 'ready' | 'pending' | 'blocked';
        hint: string;
      }[];
      const playable = track.filter(({ state }) => state !== 'blocked').length;
      const full = track.length > 0 && playable === track.length;
      const cue =
        track.length <= 1
          ? track[0]?.hint.includes('基礎')
            ? '只打基礎'
            : track[0]?.hint.includes('判定')
              ? '命中判定'
              : '加成可用'
          : full
            ? '完整連技'
            : `可接 ${playable}/${track.length} 段`;
      const cueNode = createUiNode('Trigger', tile, tileWidth - 18, 38, 0, -tileHeight * 0.04);
      addPanel(cueNode, new Color(0, 0, 0, 88), full ? COLORS.gold : COLORS.muted);
      addText(cueNode, cue, 22, full ? COLORS.gold : COLORS.text);
      if (state.damage !== undefined) {
        const damage = createUiNode('Damage', tile, tileWidth - 20, 44, 0, -tileHeight * 0.31);
        const damageLabel = addText(
          damage,
          state.execution ? `OVERKILL ${state.damage}` : `總傷 ${state.damage}`,
          state.execution ? 25 : 27,
          state.execution ? COLORS.gold : COLORS.text,
        );
        damageLabel.isBold = true;
      }
      addButton(tile, () => this.onTap?.(state.skill.id));
    });
  }
}
