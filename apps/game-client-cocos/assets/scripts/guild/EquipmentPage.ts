import { Component } from 'cc';

import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
  RuntimeRewardItem,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { EquipmentInventory } from './EquipmentInventory';
import { ForgeSheet } from './ForgeSheet';

export class EquipmentPage extends Component {
  private state?: RuntimeGuildState;
  private dispatch?: (action: RuntimeGuildAction) => void;
  private width = 0;
  private height = 0;
  private page = 0;
  private confirmBatch = false;

  initialize(
    state: RuntimeGuildState,
    content: RuntimeContent,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
  ): void {
    this.state = state;
    this.dispatch = dispatch;
    this.width = width;
    this.height = height;
    this.render(content);
  }

  private render(content: RuntimeContent): void {
    this.node.removeAllChildren();
    const heroWidth = (this.width - 26) / 6;
    this.state!.profile.defaultOrder.forEach((heroId, index) => {
      const hero = content.adventurers.find(({ id }) => id === heroId);
      const node = createUiNode(
        `EquipmentHero-${heroId}`,
        this.node,
        heroWidth - 4,
        40,
        -this.width / 2 + 13 + heroWidth / 2 + index * heroWidth,
        this.height / 2 - 22,
      );
      const selected = heroId === this.state!.selectedHeroId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.muted);
      addText(node, hero?.name ?? heroId, 15, selected ? COLORS.ink : COLORS.text);
      addButton(node, () => this.dispatch?.({ type: 'SELECT_HERO', adventurerId: heroId }));
    });

    const member = this.state!.profile.party.find(
      ({ definitionId }) => definitionId === this.state!.selectedHeroId,
    );
    if (!member) return;
    const slots = ['weapon', 'armor', 'accessory'] as const;
    const slotWidth = (this.width - 30) / 3;
    slots.forEach((slot, index) => {
      const item = member.equipment[slot];
      const node = createUiNode(
        `EquipmentSlot-${slot}`,
        this.node,
        slotWidth - 5,
        68,
        -this.width / 2 + 15 + slotWidth / 2 + index * slotWidth,
        this.height / 2 - 84,
      );
      addPanel(node, COLORS.panel, item ? COLORS.gold : COLORS.muted);
      addText(
        node,
        `${slot}\n${item ? `${item.name}・${item.mainStat.value}` : '尚未裝備'}`,
        15,
        item ? COLORS.text : COLORS.muted,
      );
      if (item) addButton(node, () => this.openItem(item));
    });

    const pageCount = Math.max(1, Math.ceil(this.state!.profile.inventory.length / 6));
    this.page = Math.max(0, Math.min(pageCount - 1, this.page));
    const visible = this.state!.profile.inventory.slice(this.page * 6, this.page * 6 + 6);
    const inventoryNode = createUiNode(
      'EquipmentInventory',
      this.node,
      this.width - 16,
      Math.min(250, this.height - 250),
      0,
      8,
    );
    inventoryNode
      .addComponent(EquipmentInventory)
      .render(
        visible,
        this.width - 16,
        Math.min(250, this.height - 250),
        this.state!.selectedSalvageIds,
        (item) => this.openItem(item),
      );
    addText(
      createUiNode(
        'InventoryCount',
        this.node,
        this.width * 0.48,
        34,
        -this.width * 0.23,
        -this.height / 2 + 94,
      ),
      `背包 ${this.state!.profile.inventory.length} 件・${this.page + 1}/${pageCount}`,
      16,
      COLORS.muted,
    );
    const previous = createUiNode(
      'EquipmentPrevious',
      this.node,
      54,
      34,
      38,
      -this.height / 2 + 94,
    );
    addPanel(previous);
    addText(previous, '←', 18);
    addButton(previous, () => {
      this.page = Math.max(0, this.page - 1);
      this.render(content);
    });
    const next = createUiNode('EquipmentNext', this.node, 54, 34, 100, -this.height / 2 + 94);
    addPanel(next);
    addText(next, '→', 18);
    addButton(next, () => {
      this.page = Math.min(pageCount - 1, this.page + 1);
      this.render(content);
    });
    const batch = createUiNode(
      'BatchSalvage',
      this.node,
      this.width * 0.72,
      50,
      0,
      -this.height / 2 + 38,
    );
    const count = this.state!.selectedSalvageIds.length;
    addPanel(batch, count > 0 ? COLORS.line : COLORS.panel, count > 0 ? COLORS.gold : COLORS.muted);
    addText(
      batch,
      count === 0
        ? '點裝備詳情加入批次分解'
        : this.confirmBatch
          ? `確認分解 ${count} 件`
          : `批次分解已選 ${count} 件`,
      18,
      count > 0 ? COLORS.ink : COLORS.muted,
    );
    if (count > 0) {
      addButton(batch, () => {
        if (!this.confirmBatch) {
          this.confirmBatch = true;
          this.render(content);
          return;
        }
        this.dispatch?.({ type: 'SALVAGE_SELECTED' });
      });
    }
  }

  private openItem(item: RuntimeRewardItem): void {
    const sheet = createUiNode('ForgeSheet', this.node, this.width * 0.9, this.height * 0.86);
    sheet
      .addComponent(ForgeSheet)
      .initialize(this.state!, item, this.width * 0.9, this.height * 0.86, this.dispatch!, () =>
        sheet.destroy(),
      );
  }
}
