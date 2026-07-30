import { BlockInputEvents, Component } from 'cc';

import { createFirstHuntCoach, createLootLayout } from '../../runtime/expedition-runtime.mjs';
import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
  RuntimeRewardItem,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { LootGrid } from './LootGrid';
import type { LootEntryViewModel } from './LootItemView';

const RARITY_BY_RANK = ['common', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

interface RewardInitialization {
  state: RuntimeGuildState;
  content: RuntimeContent;
  width: number;
  height: number;
  dispatch: (action: RuntimeGuildAction) => void;
}

export class RewardScene extends Component {
  private input?: RewardInitialization;
  private selectedHeroId?: string;

  initialize(input: RewardInitialization): void {
    this.input = input;
    this.selectedHeroId = input.state.selectedHeroId;
    const { state, width, height } = input;
    const rewards = state.rewards;
    if (!rewards) throw new Error('Reward screen has no rewards.');
    this.node.addComponent(BlockInputEvents);
    addPanel(this.node, COLORS.ink, COLORS.gold);
    addText(
      createUiNode('Victory', this.node, width - 30, 42, 0, height * 0.45),
      '勝利・戰利品爆發',
      34,
      COLORS.gold,
    );
    addText(
      createUiNode('Materials', this.node, width - 30, 28, 0, height * 0.4),
      rewards.materials.map(({ name, quantity }) => `${name} ×${quantity}`).join('　'),
      17,
      COLORS.muted,
    );
    addText(
      createUiNode('RewardMessage', this.node, width - 30, 30, 0, height * 0.355),
      (() => {
        const coach = createFirstHuntCoach(state.preferences.tutorial, state.tutorialStep, {
          surface: 'rewards',
        });
        return coach ? `${coach.title}・${coach.message}` : state.message;
      })(),
      15,
      COLORS.text,
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
            detailLines: skill.components.map(
              (entry, index) =>
                `${index + 1}段：${entry.power}傷・${entry.layerStrength}層・${entry.repeatCount}擊`,
            ),
          };
        }),
      ],
    }) as { entries: readonly LootEntryViewModel[] };
    const entries = model.entries.slice(0, 20);
    const gridHeight = height * 0.57;
    const gridNode = createUiNode('LootGrid', this.node, width - 20, gridHeight, 0, height * 0.015);
    gridNode.addComponent(LootGrid).render(entries, width - 20, gridHeight, (id) => {
      const entry = entries.find((candidate) => candidate.id === id);
      if (entry) this.openDetail(entry);
    });
    this.renderRoutes();
    this.updateDiagnostics({
      screen: 'rewards',
      rewardVisible: true,
      rewardCount: entries.length,
      rewardCapacity: 20,
      rewardSkillCount: entries.filter(({ kind }) => kind === 'skill').length,
      tutorialStep: state.tutorialStep,
      firstEntryPoint: {
        screenX: 0.5 + (-width / 2 + 10 + (width - 45) / 8) / width,
        screenY: 0.5 - (height * 0.015 + gridHeight / 2 - 5 - (gridHeight - 30) / 10) / height,
      },
      routePoints: {
        keep: { screenX: 0.125, screenY: 1 - 38 / height },
        equipment: { screenX: 0.375, screenY: 1 - 38 / height },
        fusion: { screenX: 0.625, screenY: 1 - 38 / height },
        replay: { screenX: 0.875, screenY: 1 - 38 / height },
      },
    });
  }

  private renderRoutes(): void {
    const { width, height, dispatch } = this.input!;
    const routes = [
      {
        id: 'KeepAll',
        label: '全部保留',
        action: { type: 'RETURN_GUILD', page: 'quest' },
      },
      {
        id: 'GoEquipment',
        label: '前往裝備',
        action: { type: 'GO_TO_EQUIPMENT' },
      },
      {
        id: 'GoFusion',
        label: '前往融合',
        action: { type: 'GO_TO_FUSION' },
      },
      {
        id: 'Replay',
        label: '立即再戰',
        action: { type: 'REPLAY_HUNT' },
      },
    ] as const;
    const buttonWidth = (width - 34) / 4;
    routes.forEach((route, index) => {
      const node = createUiNode(
        route.id,
        this.node,
        buttonWidth - 4,
        54,
        -width / 2 + 17 + buttonWidth / 2 + index * buttonWidth,
        -height / 2 + 38,
      );
      addPanel(node, COLORS.panel, index === 0 ? COLORS.gold : COLORS.line);
      addText(node, route.label, 16, index === 0 ? COLORS.gold : COLORS.text);
      addButton(node, () => dispatch(route.action));
    });
  }

  private openDetail(entry: LootEntryViewModel): void {
    const { state, width, height } = this.input!;
    const sheet = createUiNode('RewardDetail', this.node, width * 0.88, height * 0.5);
    sheet.addComponent(BlockInputEvents);
    addPanel(sheet, COLORS.ink, COLORS.gold);
    addText(
      createUiNode('RewardDetailTitle', sheet, width * 0.8, 48, 0, height * 0.19),
      `${entry.name}・${entry.rarity}`,
      27,
      COLORS.gold,
    );
    addText(
      createUiNode('RewardDetailBody', sheet, width * 0.8, height * 0.19, 0, height * 0.055),
      [entry.summary, ...entry.detailLines].join('\n'),
      18,
    );
    if (entry.kind === 'equipment') {
      const item = state.rewards?.items.find(({ id }) => id === entry.id);
      if (item) this.renderEquipControls(sheet, item);
    }
    const close = createUiNode('CloseRewardDetail', sheet, width * 0.42, 42, 0, -height * 0.205);
    addPanel(close);
    addText(close, '返回掉落清單', 17);
    addButton(close, () => sheet.destroy());
    this.updateDiagnostics({ selectedLootId: entry.id });
    this.updateDiagnostics({
      rewardEquipPoint: { screenX: 0.5, screenY: 0.645 },
      rewardDetailClosePoint: { screenX: 0.5, screenY: 0.705 },
    });
  }

  private renderEquipControls(
    sheet: ReturnType<typeof createUiNode>,
    item: RuntimeRewardItem,
  ): void {
    const { content, width, height, dispatch } = this.input!;
    const heroWidth = (width * 0.78) / 6;
    this.input!.state.profile.defaultOrder.forEach((heroId, index) => {
      const hero = content.adventurers.find(({ id }) => id === heroId);
      const node = createUiNode(
        `RewardHero-${heroId}`,
        sheet,
        heroWidth - 4,
        34,
        -width * 0.39 + heroWidth / 2 + index * heroWidth,
        -height * 0.075,
      );
      const selected = heroId === this.selectedHeroId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.muted);
      addText(node, hero?.name ?? heroId, 13, selected ? COLORS.ink : COLORS.text);
      addButton(node, () => {
        this.selectedHeroId = heroId;
        sheet.destroy();
        const entry = {
          id: item.id,
          kind: 'equipment' as const,
          name: item.name,
          rarity: item.rarity,
          color: '#ffffff',
          summary: `${item.mainStat.stat} +${item.mainStat.value}`,
          detailLines: item.affixes.map(({ label, value }) => `${label ?? '詞綴'} +${value}`),
        };
        this.openDetail(entry);
      });
    });
    const equip = createUiNode('EquipReward', sheet, width * 0.58, 44, 0, -height * 0.145);
    addPanel(equip, COLORS.line, COLORS.gold);
    addText(equip, '立即裝備給所選角色', 18, COLORS.ink);
    addButton(equip, () =>
      dispatch({
        type: 'EQUIP_REWARD_ITEM',
        itemId: item.id,
        adventurerId: this.selectedHeroId!,
      }),
    );
  }

  private updateDiagnostics(update: Record<string, unknown>): void {
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
      ...update,
    };
  }
}
