import { Component } from 'cc';

import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { HeroFocusStage } from './HeroFocusStage';

export class PartyPage extends Component {
  initialize(
    state: RuntimeGuildState,
    content: RuntimeContent,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
  ): void {
    const cardWidth = (width - 38) / 3;
    const cardHeight = 68;
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
        height / 2 - cardHeight / 2 - 8 - row * (cardHeight + 6),
      );
      const selected = heroId === state.selectedHeroId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(
        node,
        `${index + 1}・${definition.name}\n技能 ${member.skillIds.length}/6`,
        16,
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
    const focusHeight = Math.min(205, height * 0.4);
    const detail = createUiNode('HeroDetail', this.node, width - 28, focusHeight, 0, -22);
    detail.addComponent(HeroFocusStage).renderHeroFocus(
      {
        name: selected?.name ?? selectedId,
        title: selected?.title ?? '',
        role: selected?.role ?? '',
        order: state.profile.defaultOrder.indexOf(selectedId) + 1,
        skillCount: member?.skillIds.length ?? 0,
        equipmentCount,
      },
      width - 28,
      focusHeight,
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
