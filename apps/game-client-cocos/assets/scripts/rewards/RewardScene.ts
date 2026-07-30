import { BlockInputEvents, Component, Node } from 'cc';

import { createLootLayout } from '../../runtime/expedition-runtime.mjs';
import type { RuntimeRewards } from '../runtime/RuntimeContracts';
import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { LootDetailSheet } from './LootDetailSheet';
import { LootGrid } from './LootGrid';
import type { LootEntryViewModel } from './LootItemView';

const RARITY_BY_RANK = ['common', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

export class RewardScene extends Component {
  initialize(rewards: RuntimeRewards, width: number, height: number, onCollect: () => void): void {
    this.node.addComponent(BlockInputEvents);
    addPanel(this.node, COLORS.ink, COLORS.gold);
    addText(
      createUiNode('Victory', this.node, width - 30, 42, 0, height * 0.43),
      '勝利・戰利品爆發',
      38,
      COLORS.gold,
    );
    const materialText = rewards.materials
      .map(({ name, quantity }) => `${name} ×${quantity}`)
      .join('　');
    addText(
      createUiNode('Materials', this.node, width - 30, 30, 0, height * 0.37),
      materialText,
      20,
      COLORS.muted,
    );

    const model = createLootLayout({
      materials: rewards.materials,
      entries: [
        ...rewards.items.map((item) => ({
          id: item.id,
          kind: 'equipment' as const,
          name: item.name,
          rarity: item.rarity,
          summary: `${item.mainStat.stat} +${item.mainStat.value}`,
          detailLines: item.affixes.map(({ label, value }) => `${label ?? '詞綴'} +${value}`),
        })),
        ...rewards.skillDrops.slice(0, 1).map((skill) => {
          const component = skill.components[0]!;
          return {
            id: skill.id,
            kind: 'skill' as const,
            name: skill.name,
            rarity: RARITY_BY_RANK[component.qualityRank] ?? 'common',
            summary: `${component.element}・${component.specializationId}・${component.triggerId}`,
            detailLines: [`威力 ${component.power}`, `層數 ${component.layerStrength}`],
          };
        }),
      ],
    }) as { entries: readonly LootEntryViewModel[] };
    const gridNode = createUiNode(
      'LootGrid',
      this.node,
      width - 20,
      height * 0.68,
      0,
      -height * 0.03,
    );
    const detailNode = createUiNode('LootDetail', this.node, width * 0.82, height * 0.36, 0, 0);
    const detail = detailNode.addComponent(LootDetailSheet);
    detail.initialize(width * 0.82, height * 0.36, () => detail.hide());
    gridNode.addComponent(LootGrid).render(model.entries, width - 20, height * 0.68, (id) => {
      const entry = model.entries.find((candidate) => candidate.id === id);
      if (entry) {
        detail.show(entry);
        this.updateDiagnostics({ selectedLootId: id });
      }
    });
    const collect = createUiNode('Collect', this.node, width * 0.7, 60, 0, -height * 0.43);
    addPanel(collect, COLORS.panel, COLORS.gold);
    const collectLabel = addText(collect, '全部收下', 28, COLORS.gold);
    let collected = false;
    const collectOnce = (): void => {
      if (collected) return;
      collected = true;
      onCollect();
      collectLabel.string = '已收下・本次狩獵完成';
      this.updateDiagnostics({ rewardsCollected: true });
      collect.off(Node.EventType.TOUCH_END, collectOnce);
      collect.off(Node.EventType.MOUSE_UP, collectOnce);
    };
    collect.on(Node.EventType.TOUCH_END, collectOnce);
    collect.on(Node.EventType.MOUSE_UP, collectOnce);
  }

  private updateDiagnostics(update: Record<string, unknown>): void {
    const diagnostics = (
      globalThis as typeof globalThis & {
        __EXPEDITION_DIAGNOSTICS__?: Record<string, unknown>;
      }
    ).__EXPEDITION_DIAGNOSTICS__;
    if (diagnostics) Object.assign(diagnostics, update);
  }
}
