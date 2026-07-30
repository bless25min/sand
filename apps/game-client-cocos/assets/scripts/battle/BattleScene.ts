import { Component, Node, UITransform, view } from 'cc';

import { resolveBattleFormation, resolveBattleLayout } from '../../runtime/expedition-runtime.mjs';
import type {
  ExpeditionRuntime,
  RuntimeBattle,
  RuntimeProfile,
  RuntimeSkill,
  RuntimeUnit,
} from '../runtime/RuntimeContracts';
import { RewardScene } from '../rewards/RewardScene';
import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { PlaybackDirector } from '../playback/PlaybackDirector';
import { CommandLens } from './CommandLens';
import { SkillDock, type SkillTileState } from './SkillDock';
import { TurnOrderController } from './TurnOrderController';
import { UnitView } from './UnitView';

interface BattleInitialization {
  runtime: ExpeditionRuntime;
  profile: RuntimeProfile;
  battle: RuntimeBattle;
}

export class BattleScene extends Component {
  private runtime?: ExpeditionRuntime;
  private profile?: RuntimeProfile;
  private battle?: RuntimeBattle;
  private stage?: Node;
  private shell?: Node;
  private lens?: CommandLens;
  private skills?: SkillDock;
  private playback?: PlaybackDirector;
  private order?: TurnOrderController;
  private actorId?: string;
  private targetId?: string;
  private skillId?: string;
  private busy = false;
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
    this.profile = input.profile;
    this.battle = input.battle;
    this.actorId = this.battle.roundOrder.activeAdventurerId;
    this.targetId = this.battle.selectedTargetId ?? this.enemies()[0]?.id;
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

    this.stage = createUiNode(
      'Battlefield',
      root,
      visible.width,
      layout.battlefield.height,
      visible.width / 2,
      visible.height - layout.header.height - layout.battlefield.height / 2,
    );
    this.createUnits(layout.battlefield.height, visible.width);
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
    this.playback.initialize();
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
      void this.execute();
      return;
    } else {
      this.targetId = unit.id;
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
    const relayTier = this.battle!.roundOrder.actedIds.length + 1;
    const action = this.actionInput(this.skillId);
    const resolved = this.runtime!.resolveAction(action);
    await this.playback!.play(resolved.events, this.unitNodes, this.stage!, relayTier);
    this.battle = resolved.battle;
    this.syncTurnState();
    this.busy = false;
    if (this.battle.status === 'victory') {
      this.showRewards();
      return;
    }
    this.render();
  }

  private render(): void {
    if (this.battle?.status !== 'active') return;
    this.order?.setOrder(
      this.battle!.roundOrder.currentOrder,
      this.battle!.roundOrder.actedIds,
      this.actorId,
    );
    this.battle!.units.forEach((unit) =>
      this.unitViews
        .get(unit.id)
        ?.render(unit, unit.id === (unit.side === 'heroes' ? this.actorId : this.targetId)),
    );
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
        comboSteps: preview?.comboSteps ?? [],
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
    this.lens!.render(actor, target, selectedSkill, preview);
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
    this.targetId = this.battle!.selectedTargetId ?? this.enemies()[0]?.id;
    this.skillId = undefined;
  }

  private chooseHero(actorId: string): void {
    if (
      this.busy ||
      this.battle?.status !== 'active' ||
      this.battle.roundOrder.actedIds.indexOf(actorId) >= 0
    )
      return;
    this.battle = this.runtime!.chooseNextHero(this.battle!, actorId);
    this.actorId = this.battle.roundOrder.activeAdventurerId;
    this.skillId = undefined;
    this.render();
  }

  private showRewards(): void {
    const rewards = this.runtime!.calculateRewards(this.profile!, this.battle!);
    if (!rewards) return;
    const size = view.getVisibleSize();
    const overlay = createUiNode('Rewards', this.node, size.width, size.height);
    overlay.addComponent(RewardScene).initialize(rewards, size.width, size.height, () => {
      this.busy = true;
    });
    this.publishTerminalDiagnostics(
      rewards.items.length + Math.min(1, rewards.skillDrops.length),
      Math.min(1, rewards.skillDrops.length),
    );
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
      }
    ).__EXPEDITION_DIAGNOSTICS__ = {
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
      eventCount: this.battle?.events.length ?? 0,
      status: this.battle?.status,
    };
  }

  private publishTerminalDiagnostics(rewardCount: number, skillCount: number): void {
    const diagnostics = (
      globalThis as typeof globalThis & {
        __EXPEDITION_DIAGNOSTICS__?: Record<string, unknown>;
      }
    ).__EXPEDITION_DIAGNOSTICS__;
    if (diagnostics) {
      diagnostics.status = this.battle?.status;
      diagnostics.rewardVisible = true;
      diagnostics.rewardCount = rewardCount;
      diagnostics.rewardCapacity = 20;
      diagnostics.rewardSkillCount = skillCount;
      if (this.diagnosticLayout) {
        const { width, height } = this.diagnosticLayout;
        const gridWidth = width - 20;
        const gridHeight = height * 0.68;
        const cellWidth = (gridWidth - 25) / 4;
        const cellHeight = (gridHeight - 30) / 5;
        const firstX = -gridWidth / 2 + 5 + cellWidth / 2;
        const firstY = -height * 0.03 + gridHeight / 2 - 5 - cellHeight / 2;
        diagnostics.rewardFirstPoint = {
          screenX: 0.5 + firstX / width,
          screenY: 0.5 - firstY / height,
        };
        diagnostics.collectPoint = { screenX: 0.5, screenY: 0.93 };
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
