import { BlockInputEvents, Component, Label } from 'cc';

import { previewForge } from '../../runtime/expedition-runtime.mjs';
import type {
  RuntimeGuildAction,
  RuntimeGuildState,
  RuntimeRewardItem,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class ForgeSheet extends Component {
  private confirmSalvage = false;

  initialize(
    state: RuntimeGuildState,
    item: RuntimeRewardItem,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
    onClose: () => void,
  ): void {
    this.node.addComponent(BlockInputEvents);
    addPanel(this.node, COLORS.ink, COLORS.gold);
    addText(
      createUiNode('ItemTitle', this.node, width - 36, 54, 0, height / 2 - 38),
      `${item.name}・${item.rarity}`,
      27,
      COLORS.gold,
    );
    const cores = item.cores?.length
      ? item.cores
      : item.coreId
        ? [{ id: item.coreId, strength: item.coreStrength ?? 0 }]
        : [];
    addText(
      createUiNode('ItemStats', this.node, width - 40, 92, 0, height / 2 - 112),
      `${item.slot}｜${item.mainStat.stat} +${item.mainStat.value}\n${cores.length ? cores.map(({ id, strength }) => `${id} +${strength}`).join('・') : '無核心'}\n鍛造階級 ${item.forgeRank ?? 0} · 售價 ${item.sellValue}`,
      18,
    );
    const hero = state.profile.party.find(
      ({ definitionId }) => definitionId === state.selectedHeroId,
    );
    const equipped = hero?.equipment[item.slot];
    const stored = state.profile.inventory.some(({ id }) => id === item.id);
    const isCurrentEquipment = equipped?.id === item.id;
    const difference =
      equipped?.mainStat.stat === item.mainStat.stat
        ? item.mainStat.value - equipped.mainStat.value
        : undefined;
    addText(
      createUiNode('Comparison', this.node, width - 40, 42, 0, height / 2 - 180),
      equipped
        ? difference === undefined
          ? `${equipped.mainStat.stat} → ${item.mainStat.stat}`
          : `相較目前 ${difference >= 0 ? '+' : ''}${difference}`
        : '目前欄位空白',
      18,
      COLORS.muted,
    );
    const actions: readonly {
      id: string;
      label: string;
      run: () => void;
      enabled?: boolean;
    }[] = [
      {
        id: 'equip',
        label: isCurrentEquipment ? '目前裝備' : stored ? '裝備' : '無法裝備',
        enabled: stored && !isCurrentEquipment,
        run: () =>
          dispatch({
            type: 'EQUIP_STORED',
            itemId: item.id,
            adventurerId: state.selectedHeroId,
          }),
      },
      {
        id: 'calibrate',
        label: this.forgeLabel(state, item, 'calibrate', '校準'),
        run: () => dispatch({ type: 'FORGE_ITEM', itemId: item.id, forgeAction: 'calibrate' }),
      },
      {
        id: 'reforge',
        label: this.forgeLabel(state, item, 'reforge', '重鑄'),
        run: () => dispatch({ type: 'FORGE_ITEM', itemId: item.id, forgeAction: 'reforge' }),
      },
      {
        id: 'core-lock',
        label:
          state.profile.forgeLocks[item.id]?.indexOf('core') >= 0 ? '解除核心保護' : '保護核心',
        run: () =>
          dispatch({
            type: 'FORGE_ITEM',
            itemId: item.id,
            forgeAction: 'lock',
            options: { lockField: 'core' },
          }),
      },
      {
        id: 'flag-lock',
        label: item.locked ? '解除鎖定' : '鎖定裝備',
        run: () => dispatch({ type: 'TOGGLE_ITEM_FLAG', itemId: item.id, flag: 'locked' }),
      },
      {
        id: 'favorite',
        label: item.favorite ? '取消收藏' : '收藏',
        run: () => dispatch({ type: 'TOGGLE_ITEM_FLAG', itemId: item.id, flag: 'favorite' }),
      },
      {
        id: 'salvage-select',
        label: state.selectedSalvageIds.indexOf(item.id) >= 0 ? '移出批次分解' : '加入批次分解',
        enabled: !item.locked && !item.favorite,
        run: () => dispatch({ type: 'TOGGLE_SALVAGE_SELECTION', itemId: item.id }),
      },
      {
        id: 'salvage',
        label: this.confirmSalvage ? '確認拆解' : '單件拆解',
        enabled: !item.locked && !item.favorite,
        run: () => {
          if (!this.confirmSalvage) {
            this.confirmSalvage = true;
            const label = this.node.getChildByName('Forge-salvage')?.getComponentInChildren(Label);
            if (label) label.string = '確認拆解';
            return;
          }
          dispatch({ type: 'FORGE_ITEM', itemId: item.id, forgeAction: 'salvage' });
        },
      },
    ];
    actions.forEach((action, index) => {
      const buttonWidth = (width - 42) / 2;
      const node = createUiNode(
        `Forge-${action.id}`,
        this.node,
        buttonWidth,
        48,
        (index % 2 === 0 ? -1 : 1) * (buttonWidth / 2 + 5),
        height / 2 - 236 - Math.floor(index / 2) * 55,
      );
      addPanel(node, COLORS.panel, action.enabled === false ? COLORS.muted : COLORS.line);
      addText(node, action.label, 16, action.enabled === false ? COLORS.muted : COLORS.text);
      if (action.enabled !== false) addButton(node, action.run);
    });
    if (equipped && equipped.id !== item.id && cores.length > 0) {
      const transplant = createUiNode('Transplant', this.node, width - 40, 46, 0, -height / 2 + 78);
      addPanel(transplant, COLORS.panel, COLORS.gold);
      addText(transplant, `移植核心至 ${equipped.name}`, 17, COLORS.gold);
      addButton(transplant, () =>
        dispatch({
          type: 'FORGE_ITEM',
          itemId: equipped.id,
          forgeAction: 'transplant',
          options: { sourceItemId: item.id },
        }),
      );
    }
    const close = createUiNode('CloseForge', this.node, width * 0.52, 44, 0, -height / 2 + 28);
    addPanel(close);
    addText(close, '返回背包', 18);
    addButton(close, onClose);
    (
      globalThis as typeof globalThis & {
        __EXPEDITION_DIAGNOSTICS__?: Record<string, unknown>;
      }
    ).__EXPEDITION_DIAGNOSTICS__ = {
      ...((
        globalThis as typeof globalThis & {
          __EXPEDITION_DIAGNOSTICS__?: Record<string, unknown>;
        }
      ).__EXPEDITION_DIAGNOSTICS__ ?? {}),
      forgeVisible: true,
      calibratePoint: {
        screenX: 0.5 + ((width - 42) / 4 + 5) / Math.max(width / 0.9, width),
        screenY: 0.5 - (height / 2 - 236) / Math.max(height / 0.86, height),
      },
    };
  }

  private forgeLabel(
    state: RuntimeGuildState,
    item: RuntimeRewardItem,
    action: 'calibrate' | 'reforge',
    fallback: string,
  ): string {
    const preview = previewForge(state.profile, item.id, action);
    return preview ? `${fallback} ${preview.cost}G` : fallback;
  }
}
