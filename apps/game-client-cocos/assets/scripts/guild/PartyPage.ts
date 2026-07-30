import { Component } from 'cc';

import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class PartyPage extends Component {
  initialize(
    state: RuntimeGuildState,
    content: RuntimeContent,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
  ): void {
    const cardWidth = (width - 38) / 3;
    const cardHeight = Math.min(116, (height - 180) / 2);
    state.profile.defaultOrder.forEach((heroId, index) => {
      const definition = content.adventurers.find(({ id }) => id === heroId);
      const member = state.profile.party.find(({ definitionId }) => definitionId === heroId);
      if (!definition || !member) return;
      const column = index % 3;
      const row = Math.floor(index / 3);
      const node = createUiNode(
        `Hero-${heroId}`,
        this.node,
        cardWidth,
        cardHeight,
        -width / 2 + 14 + cardWidth / 2 + column * (cardWidth + 5),
        height / 2 - cardHeight / 2 - 10 - row * (cardHeight + 8),
      );
      const selected = heroId === state.selectedHeroId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(
        node,
        `${index + 1}棒・${definition.name}\n${definition.title}\n技能 ${member.skillIds.length}/6`,
        18,
        selected ? COLORS.ink : COLORS.text,
      );
      addButton(node, () => dispatch({ type: 'SELECT_HERO', adventurerId: heroId }));
    });

    const selectedId = state.selectedHeroId;
    const selected = content.adventurers.find(({ id }) => id === selectedId);
    const member = state.profile.party.find(({ definitionId }) => definitionId === selectedId);
    const equipmentCount = member
      ? ['weapon', 'armor', 'accessory'].filter((slot) => Boolean(member.equipment[slot])).length
      : 0;
    const detail = createUiNode('HeroDetail', this.node, width - 28, 112, 0, -height / 2 + 116);
    addPanel(detail);
    addText(
      detail,
      `${selected?.name ?? selectedId}・${selected?.role ?? ''}\n六格技能 ${member?.skillIds.length ?? 0}/6 · 裝備 ${equipmentCount}/3\n拖曳不適合行動裝置，使用左右鍵調整接力順位`,
      19,
    );
    const left = createUiNode(
      'MoveEarlier',
      this.node,
      width * 0.32,
      48,
      -width * 0.18,
      -height / 2 + 42,
    );
    addPanel(left);
    addText(left, '← 提前', 20);
    addButton(left, () =>
      dispatch({ type: 'MOVE_DEFAULT_HERO', adventurerId: selectedId, direction: -1 }),
    );
    const right = createUiNode(
      'MoveLater',
      this.node,
      width * 0.32,
      48,
      width * 0.18,
      -height / 2 + 42,
    );
    addPanel(right);
    addText(right, '延後 →', 20);
    addButton(right, () =>
      dispatch({ type: 'MOVE_DEFAULT_HERO', adventurerId: selectedId, direction: 1 }),
    );
  }
}
