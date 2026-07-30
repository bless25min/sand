import { Component, Node, UITransform, view } from 'cc';

import {
  projectBattlePlayback,
  resolveBattleFormation,
  resolveBattleLayout,
} from '../../runtime/expedition-runtime.mjs';
import type {
  ExpeditionRuntime,
  RuntimeBattle,
  RuntimeGuildController,
  RuntimeGuildState,
  RuntimeProfile,
  RuntimeSkill,
  RuntimeUnit,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { PlaybackDirector } from '../playback/PlaybackDirector';
import { CommandLens } from './CommandLens';
import { SkillDock, type SkillTileState } from './SkillDock';
import { TurnOrderController } from './TurnOrderController';
import { UnitView } from './UnitView';

interface BattleInitialization {
  runtime: ExpeditionRuntime;
  controller: RuntimeGuildController;
  state: RuntimeGuildState;
}

export class BattleScene extends Component {
  private runtime?: ExpeditionRuntime;
  private controller?: RuntimeGuildController;
  private profile?: RuntimeProfile;
  private battle?: RuntimeBattle;
  private stage?: Node;
  private shell?: Node;
  private lens?: CommandLens;
  private skills?: SkillDock;
  private relayMeter?: Node;
  private playback?: PlaybackDirector;
  private order?: TurnOrderController;
  private actorId?: string;
  private targetId?: string;
  private skillId?: string;
  private busy = false;
  private destroyed = false;
  private executionEpoch = 0;
  private preferences?: RuntimeGuildState['preferences'];
  private diagnosticLayout?: {
    mode: string;
    width: number;
    height: number;
    headerHeight: number;
    battlefieldHeight: number;
    commandLensHeight: number;
    skillDockHeight: number;
    skillColumns: number;
  };
  private skillStates: readonly SkillTileState[] = [];
  private readonly unitNodes = new Map<string, Node>();
  private readonly unitViews = new Map<string, UnitView>();

  initialize(input: BattleInitialization): void {
    this.runtime = input.runtime;
    this.controller = input.controller;
    this.profile = input.state.profile;
    this.battle = input.state.battle;
    this.preferences = input.state.preferences;
    if (!this.battle) throw new Error('Battle screen has no battle state.');
    this.actorId = this.battle.roundOrder.activeAdventurerId;
    this.targetId = this.battle.selectedTargetId;
    this.buildShell();
    this.render();
  }

  reflow(): void {
    if (this.busy || this.battle?.status !== 'active') return;
    this.shell?.destroy();
    this.unitNodes.clear();
    this.unitViews.clear();
    this.buildShell();
    this.render();
  }

  private buildShell(): void {
    const visible = view.getVisibleSize();
    const layout = resolveBattleLayout({ width: visible.width, height: visible.height });
    const root = createUiNode('BattleAppShell', this.node, visible.width, visible.height);
    this.shell = root;
    root.setPosition(-visible.width / 2, -visible.height / 2);
    const header = createUiNode(
      'Header',
      root,
      visible.width,
      layout.header.height,
      visible.width / 2,
      visible.height - layout.header.height / 2,
    );
    addPanel(header, COLORS.ink, COLORS.line);
    addText(
      createUiNode(
        'Quest',
        header,
        visible.width * 0.32,
        layout.header.height,
        -visible.width * 0.33,
      ),
      '邊境狼群',
      28,
      COLORS.gold,
    );
    const orderNode = createUiNode('Order', header, visible.width * 0.58, 40, visible.width * 0.19);
    this.order = orderNode.addComponent(TurnOrderController);
    const heroActors = this.heroes().map(({ id, name }) => ({ id, name }));
    this.order.initialize(heroActors, (actorId) => this.chooseHero(actorId));
    const tactics = createUiNode('BattleTactics', header, 82, 34, visible.width * 0.43);
    addPanel(tactics, COLORS.panel, COLORS.gold);
    addText(tactics, '戰術', 16, COLORS.gold);
    addButton(tactics, () => this.openBattleMenu());

    this.stage = createUiNode(
      'Battlefield',
      root,
      visible.width,
      layout.battlefield.height,
      visible.width / 2,
      visible.height - layout.header.height - layout.battlefield.height / 2,
    );
    this.createUnits(layout.battlefield.height, visible.width);
    this.relayMeter = createUiNode(
      'RelayMeter',
      this.stage,
      Math.min(300, visible.width * 0.46),
      42,
      0,
      layout.battlefield.height / 2 - 25,
    );
    const lensNode = createUiNode(
      'CommandLens',
      root,
      visible.width,
      layout.commandLens.height,
      visible.width / 2,
      layout.skillDock.height + layout.commandLens.height / 2,
    );
    this.lens = lensNode.addComponent(CommandLens);
    this.lens.initialize(visible.width, layout.commandLens.height);
    const dockNode = createUiNode(
      'SkillDock',
      root,
      visible.width,
      layout.skillDock.height,
      visible.width / 2,
      layout.skillDock.height / 2,
    );
    this.skills = dockNode.addComponent(SkillDock);
    this.skills.initialize((skillId) => this.tapSkill(skillId));
    this.playback = root.addComponent(PlaybackDirector);
    this.playback.initialize(this.preferences!);
    this.diagnosticLayout = {
      mode: layout.mode,
      width: visible.width,
      height: visible.height,
      headerHeight: layout.header.height,
      battlefieldHeight: layout.battlefield.height,
      commandLensHeight: layout.commandLens.height,
      skillDockHeight: layout.skillDock.height,
      skillColumns: layout.skillDock.columns,
    };
  }

  private createUnits(height: number, width: number): void {
    const heroes = this.heroes();
    const enemies = this.enemies();
    const formation = resolveBattleFormation({
      width,
      height,
      heroCount: heroes.length,
      enemyCount: enemies.length,
    });
    enemies.forEach((unit, index) => {
      const slot = formation.enemies[index]!;
      this.createUnit(
        unit,
        slot.x,
        slot.y,
        formation.compact,
        formation.tapWidth,
        formation.tapHeight,
      );
    });
    heroes.forEach((unit, index) => {
      const slot = formation.heroes[index]!;
      this.createUnit(
        unit,
        slot.x,
        slot.y,
        formation.compact,
        formation.tapWidth,
        formation.tapHeight,
      );
    });
  }

  private createUnit(
    unit: RuntimeUnit,
    x: number,
    y: number,
    compact: boolean,
    width: number,
    height: number,
  ): void {
    const node = new Node(unit.id);
    this.stage!.addChild(node);
    node.setPosition(x, y);
    const unitView = node.addComponent(UnitView);
    unitView.initialize(unit, (selected) => this.tapUnit(selected), compact, width, height);
    this.unitNodes.set(unit.id, node);
    this.unitViews.set(unit.id, unitView);
  }

  private tapUnit(unit: RuntimeUnit): void {
    if (this.busy || this.battle?.status !== 'active') return;
    if (unit.side === 'heroes') {
      this.chooseHero(unit.id);
      return;
    } else if (this.skillId && this.actorId) {
      this.targetId = unit.id;
      this.applyState(this.controller!.dispatch({ type: 'SELECT_TARGET', targetId: unit.id }));
      void this.execute();
      return;
    } else {
      this.targetId = unit.id;
      this.applyState(this.controller!.dispatch({ type: 'SELECT_TARGET', targetId: unit.id }));
    }
    this.render();
  }

  private tapSkill(skillId: string): void {
    if (this.busy || !this.actorId || this.battle?.status !== 'active') return;
    if (this.skillId === skillId && this.targetId) {
      void this.execute();
      return;
    }
    this.skillId = skillId;
    this.render();
  }

  private async execute(): Promise<void> {
    if (!this.actorId || !this.targetId || !this.skillId || this.busy) return;
    this.busy = true;
    const epoch = ++this.executionEpoch;
    try {
      const relayTier = this.battle!.roundOrder.actedIds.length + 1;
      const next = this.controller!.dispatch({
        type: 'USE_SKILL',
        skillId: this.skillId,
        targetId: this.targetId,
      });
      const before = this.battle!;
      await this.playback!.play(
        next.recentEvents,
        this.unitNodes,
        this.stage!,
        relayTier,
        (visibleCount) => {
          if (!next.battle || this.destroyed || epoch !== this.executionEpoch) return;
          this.battle = projectBattlePlayback(
            before,
            next.battle,
            next.recentEvents,
            visibleCount,
          ) as RuntimeBattle;
          this.renderUnits();
          this.renderRelayMeter(relayTier);
        },
      );
      if (this.destroyed || epoch !== this.executionEpoch) return;
      this.applyState(next);
      this.syncTurnState();
    } catch (error) {
      console.warn('Combat playback recovered after an animation error.', error);
      (
        globalThis as typeof globalThis & {
          __EXPEDITION_PLAYBACK_ERROR__?: string;
        }
      ).__EXPEDITION_PLAYBACK_ERROR__ =
        error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
    } finally {
      if (epoch === this.executionEpoch) this.busy = false;
    }
    if (this.destroyed || epoch !== this.executionEpoch) return;
    if (this.battle?.status === 'victory') {
      this.showVictoryConfirmation();
      return;
    }
    if (this.battle?.status === 'defeat') {
      this.showDefeatConfirmation();
      return;
    }
    this.render();
  }

  onDestroy(): void {
    this.destroyed = true;
    this.executionEpoch += 1;
    this.playback?.cancel();
  }

  private render(): void {
    if (this.battle?.status !== 'active') return;
    this.order?.setOrder(
      this.battle!.roundOrder.currentOrder,
      this.battle!.roundOrder.actedIds,
      this.actorId,
    );
    this.renderUnits();
    this.renderRelayMeter(this.battle!.roundOrder.actedIds.length + 1);
    const actor = this.heroes().find(({ id }) => id === this.actorId);
    const target = this.enemies().find(({ id }) => id === this.targetId);
    const options =
      actor?.skillIds
        .map((id) => this.skillById(id))
        .filter((skill): skill is RuntimeSkill => Boolean(skill)) ?? [];
    const states = options.map((skill): SkillTileState => {
      const preview = target ? this.runtime!.previewSkill(this.actionInput(skill.id)) : undefined;
      return {
        skill,
        selected: skill.id === this.skillId,
        comboSteps:
          preview?.comboSteps.map((step) => ({
            triggerId: step.triggerId,
            readiness: step.readiness,
            eventCount: step.eventIds?.length,
          })) ?? [],
        ...(preview
          ? {
              damage: preview.executionWindow ? preview.overkill : preview.totalDamage,
              hits: preview.damageSegments,
              chases: preview.chaseSegments,
              execution: preview.executionWindow,
              echoes: preview.relayEchoes,
            }
          : {}),
      };
    });
    this.skillStates = states;
    const dockSize = this.skills!.node.getComponent(UITransform)!.contentSize;
    this.skills!.render(states, dockSize.width, dockSize.height);
    const selectedSkill = this.skillId ? this.skillById(this.skillId) : undefined;
    const preview =
      selectedSkill && target
        ? this.runtime!.previewSkill(this.actionInput(selectedSkill.id))
        : undefined;
    this.lens!.render(actor, target, selectedSkill, preview, this.heroes());
    this.publishDiagnostics();
  }

  private actionInput(skillId: string) {
    return {
      profile: this.profile!,
      battle: this.battle!,
      actorId: this.actorId!,
      skillId,
      targetId: this.targetId!,
    };
  }

  private syncTurnState(): void {
    this.actorId = this.battle!.roundOrder.activeAdventurerId;
    this.targetId = this.battle!.selectedTargetId;
    this.skillId = undefined;
  }

  private renderUnits(): void {
    this.battle?.units.forEach((unit) =>
      this.unitViews
        .get(unit.id)
        ?.render(unit, unit.id === (unit.side === 'heroes' ? this.actorId : this.targetId)),
    );
  }

  private renderRelayMeter(tier: number): void {
    if (!this.relayMeter) return;
    this.relayMeter.removeAllChildren();
    const width = this.relayMeter.getComponent(UITransform)!.contentSize.width;
    const ribbon = createUiNode('RelayRibbon', this.relayMeter, width, 38);
    addPanel(ribbon, COLORS.ink, tier >= 6 ? COLORS.gold : COLORS.line);
    addText(
      createUiNode('RelayLabel', ribbon, width * 0.4, 34, -width * 0.28),
      tier >= 6 ? '終結接力' : `接力 ${tier}/6`,
      18 + Math.min(4, tier),
      tier >= 6 ? COLORS.gold : COLORS.text,
    );
    const startX = -width * 0.02;
    for (let index = 0; index < 6; index += 1) {
      const pip = createUiNode(`RelayPip-${index + 1}`, ribbon, 22, 12, startX + index * 31);
      const active = index < tier;
      const panel = addPanel(
        pip,
        active ? COLORS.gold : COLORS.panel,
        active ? COLORS.gold : COLORS.muted,
      );
      panel.lineWidth = active ? 0 : 1;
    }
  }

  private chooseHero(actorId: string): void {
    if (
      this.busy ||
      this.battle?.status !== 'active' ||
      this.battle.roundOrder.actedIds.indexOf(actorId) >= 0
    )
      return;
    this.applyState(this.controller!.dispatch({ type: 'CHOOSE_NEXT_HERO', adventurerId: actorId }));
    this.actorId = this.battle.roundOrder.activeAdventurerId;
    this.skillId = undefined;
    this.render();
  }

  private openBattleMenu(): void {
    const existing = this.node.getChildByName('BattleMenu');
    if (existing) {
      existing.destroy();
      return;
    }
    const size = view.getVisibleSize();
    const menu = createUiNode(
      'BattleMenu',
      this.node,
      Math.min(280, size.width * 0.72),
      190,
      size.width * 0.12,
      size.height * 0.23,
    );
    addPanel(menu, COLORS.ink, COLORS.gold);
    const actions = [
      {
        id: 'ResetOrder',
        label: '恢復預設順序',
        run: () => {
          this.applyState(this.controller!.dispatch({ type: 'RESET_CURRENT_ORDER' }));
          menu.destroy();
          this.render();
        },
      },
      {
        id: 'CarryOrder',
        label: this.battle!.roundOrder.carryCurrentOrder ? '下回合恢復預設' : '沿用目前順序',
        run: () => {
          this.applyState(
            this.controller!.dispatch({
              type: 'SET_CARRY_ORDER',
              enabled: !this.battle!.roundOrder.carryCurrentOrder,
            }),
          );
          menu.destroy();
          this.render();
        },
      },
      {
        id: 'Abandon',
        label: '撤離任務',
        run: () => this.controller?.dispatch({ type: 'ABANDON_HUNT' }),
      },
    ];
    actions.forEach((action, index) => {
      const node = createUiNode(action.id, menu, 240, 46, 0, 57 - index * 57);
      addPanel(node, COLORS.panel, action.id === 'Abandon' ? COLORS.enemy : COLORS.line);
      addText(node, action.label, 18, action.id === 'Abandon' ? COLORS.enemy : COLORS.text);
      addButton(node, action.run);
    });
  }

  private showVictoryConfirmation(): void {
    const size = view.getVisibleSize();
    const overlay = createUiNode('VictoryConfirm', this.node, size.width * 0.82, 180);
    addPanel(overlay, COLORS.ink, COLORS.gold);
    addText(
      createUiNode('VictoryTitle', overlay, size.width * 0.76, 68, 0, 38),
      '遠征勝利・確認戰果',
      32,
      COLORS.gold,
    );
    const confirm = createUiNode('CollectVictory', overlay, size.width * 0.62, 56, 0, -48);
    addPanel(confirm, COLORS.line, COLORS.gold);
    addText(confirm, '開啟戰利品', 24, COLORS.ink);
    addButton(confirm, () => this.controller?.dispatch({ type: 'COLLECT_VICTORY' }));
    this.publishTerminalDiagnostics();
  }

  private showDefeatConfirmation(): void {
    const size = view.getVisibleSize();
    const overlay = createUiNode('DefeatConfirm', this.node, size.width * 0.82, 180);
    addPanel(overlay, COLORS.ink, COLORS.enemy);
    addText(
      createUiNode('DefeatTitle', overlay, size.width * 0.76, 68, 0, 38),
      '遠征受挫・整備後再戰',
      30,
      COLORS.enemy,
    );
    const confirm = createUiNode('ReturnAfterDefeat', overlay, size.width * 0.62, 56, 0, -48);
    addPanel(confirm, COLORS.panel, COLORS.gold);
    addText(confirm, '返回公會', 24, COLORS.gold);
    addButton(confirm, () => this.controller?.dispatch({ type: 'RETURN_GUILD', page: 'quest' }));
  }

  private applyState(state: RuntimeGuildState): void {
    this.profile = state.profile;
    if (state.battle) this.battle = state.battle;
  }

  private publishDiagnostics(): void {
    const layout = this.diagnosticLayout;
    if (!layout || !this.stage || !this.skills) return;
    const units = this.battle?.units.map((unit) => {
      const node = this.unitNodes.get(unit.id)!;
      const transform = node.getComponent(UITransform)!;
      return {
        id: unit.id,
        side: unit.side,
        hp: unit.currentHp,
        x: node.position.x,
        y: node.position.y,
        width: transform.contentSize.width,
        height: transform.contentSize.height,
        screenX: 0.5 + node.position.x / layout.width,
        screenY:
          (layout.headerHeight + layout.battlefieldHeight / 2 - node.position.y) / layout.height,
      };
    });
    const skills = this.skills.node.children.map((node, index) => ({
      id: node.name,
      damage: this.skillStates[index]?.damage ?? 0,
      selected: this.skillStates[index]?.selected ?? false,
      screenX: 0.5 + node.position.x / layout.width,
      screenY:
        (layout.headerHeight +
          layout.battlefieldHeight +
          layout.commandLensHeight +
          layout.skillDockHeight / 2 -
          node.position.y) /
        layout.height,
    }));
    (
      globalThis as typeof globalThis & {
        __EXPEDITION_DIAGNOSTICS__?: Record<string, unknown>;
        __EXPEDITION_PLAYBACK_TRACE__?: Record<string, unknown>;
        __EXPEDITION_PLAYBACK_ERROR__?: string;
      }
    ).__EXPEDITION_DIAGNOSTICS__ = {
      screen: 'battle',
      mode: layout.mode,
      width: layout.width,
      height: layout.height,
      battlefield: { width: layout.width, height: layout.battlefieldHeight },
      skillColumns: layout.skillColumns,
      units,
      skills,
      actorId: this.actorId,
      targetId: this.targetId,
      actedIds: this.battle?.roundOrder.actedIds ?? [],
      relayTier: Math.min(6, (this.battle?.roundOrder.actedIds.length ?? 0) + 1),
      commandLensMode: this.skillId ? 'focus' : 'summary',
      playbackTrace: (
        globalThis as typeof globalThis & {
          __EXPEDITION_PLAYBACK_TRACE__?: Record<string, unknown>;
        }
      ).__EXPEDITION_PLAYBACK_TRACE__,
      playbackError: (
        globalThis as typeof globalThis & {
          __EXPEDITION_PLAYBACK_ERROR__?: string;
        }
      ).__EXPEDITION_PLAYBACK_ERROR__,
      eventCount: this.battle?.events.length ?? 0,
      status: this.battle?.status,
      tutorialStep: this.controller?.getState().tutorialStep,
    };
  }

  private publishTerminalDiagnostics(): void {
    const diagnostics = (
      globalThis as typeof globalThis & {
        __EXPEDITION_DIAGNOSTICS__?: Record<string, unknown>;
      }
    ).__EXPEDITION_DIAGNOSTICS__;
    if (diagnostics) {
      diagnostics.status = this.battle?.status;
      diagnostics.victoryConfirmVisible = true;
      if (this.diagnosticLayout) {
        const { height } = this.diagnosticLayout;
        diagnostics.collectPoint = { screenX: 0.5, screenY: 0.5 + 48 / height };
      }
    }
  }

  private skillById(id: string): RuntimeSkill | undefined {
    return this.profile!.skillInventory.find((skill) => skill.id === id);
  }

  private heroes(): RuntimeUnit[] {
    return this.battle!.units.filter(({ side, currentHp }) => side === 'heroes' && currentHp > 0);
  }

  private enemies(): RuntimeUnit[] {
    return this.battle!.units.filter(({ side }) => side === 'enemies');
  }
}
