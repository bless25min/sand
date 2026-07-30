import { Color, Component, HorizontalTextAlignment, Node } from 'cc';

import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class TurnOrderController extends Component {
  private order: string[] = [];
  private names = new Map<string, string>();
  private acted = new Set<string>();
  private activeId?: string;
  private onChoose?: (actorId: string) => void;

  initialize(
    actors: readonly { id: string; name: string }[],
    onChoose: (actorId: string) => void,
  ): void {
    this.order = actors.map(({ id }) => id);
    this.names = new Map(actors.map(({ id, name }) => [id, name]));
    this.onChoose = onChoose;
    this.render();
  }

  setOrder(
    order: readonly string[],
    actedIds: readonly string[],
    actorId: string | undefined,
  ): void {
    this.order = [...order];
    this.acted = new Set(actedIds);
    this.activeId = actorId;
    this.render();
  }

  private render(): void {
    this.node.removeAllChildren();
    this.order.forEach((actorId, index) => {
      const active = actorId === this.activeId;
      const x = (index - (this.order.length - 1) / 2) * 54;
      const chip = createUiNode(actorId, this.node, 48, 34, x, 0);
      addPanel(
        chip,
        active ? new Color(55, 42, 11, 250) : COLORS.panel,
        active ? COLORS.gold : COLORS.muted,
      );
      const label = addText(
        chip,
        `${index + 1}${this.names.get(actorId)?.slice(0, 1) ?? ''}`,
        23,
        this.acted.has(actorId) ? COLORS.muted : COLORS.gold,
      );
      label.horizontalAlign = HorizontalTextAlignment.CENTER;
      chip.on(Node.EventType.TOUCH_END, () => {
        if (!this.acted.has(actorId)) this.onChoose?.(actorId);
      });
    });
  }
}
