import { Component } from 'cc';

import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
  RuntimeSkill,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { FusionWorkbench } from './FusionWorkbench';

const elementLabel = (content: RuntimeContent, id: string) =>
  content.elements.find((entry) => entry.id === id)?.name ?? id;
const specializationLabel = (content: RuntimeContent, id: string) =>
  content.skillSpecializations.find((entry) => entry.id === id)?.name ?? id;
const triggerLabel = (content: RuntimeContent, id: string) =>
  content.triggerConditions.find((entry) => entry.id === id)?.name ?? id;

export class SkillsPage extends Component {
  private state?: RuntimeGuildState;
  private content?: RuntimeContent;
  private dispatch?: (action: RuntimeGuildAction) => void;
  private width = 0;
  private height = 0;
  private page = 0;
  private element = 'all';
  private selectedSkillId?: string;

  initialize(
    state: RuntimeGuildState,
    content: RuntimeContent,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
  ): void {
    this.state = state;
    this.content = content;
    this.dispatch = dispatch;
    this.width = width;
    this.height = height;
    this.selectedSkillId = state.tutorialStep === 'equip_skill' ? state.tutorialSkillId : undefined;
    this.render();
  }

  private render(): void {
    this.node.removeAllChildren();
    this.renderHeroTabs();
    this.renderWorkspaceTabs();
    if (this.state!.skillWorkspace === 'fusion') {
      const workbench = createUiNode(
        'FusionWorkbench',
        this.node,
        this.width,
        this.height - 92,
        0,
        -42,
      );
      workbench
        .addComponent(FusionWorkbench)
        .initialize(this.state!, this.content!, this.width, this.height - 92, this.dispatch!);
      return;
    }
    this.renderLoadout();
  }

  private renderHeroTabs(): void {
    const width = (this.width - 26) / 6;
    this.state!.profile.defaultOrder.forEach((heroId, index) => {
      const hero = this.content!.adventurers.find(({ id }) => id === heroId);
      const node = createUiNode(
        `SkillHero-${heroId}`,
        this.node,
        width - 4,
        40,
        -this.width / 2 + 13 + width / 2 + index * width,
        this.height / 2 - 22,
      );
      const selected = heroId === this.state!.selectedHeroId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.muted);
      addText(node, hero?.name ?? heroId, 15, selected ? COLORS.ink : COLORS.text);
      addButton(node, () => this.dispatch?.({ type: 'SELECT_HERO', adventurerId: heroId }));
    });
  }

  private renderWorkspaceTabs(): void {
    (
      [
        ['loadout', '六格配置'],
        ['fusion', '技能融合'],
      ] as const
    ).forEach(([workspace, label], index) => {
      const node = createUiNode(
        `Workspace-${workspace}`,
        this.node,
        this.width * 0.42,
        36,
        (index === 0 ? -1 : 1) * this.width * 0.22,
        this.height / 2 - 64,
      );
      const selected = workspace === this.state!.skillWorkspace;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(node, label, 17, selected ? COLORS.ink : COLORS.text);
      addButton(node, () => this.dispatch?.({ type: 'SELECT_SKILL_WORKSPACE', workspace }));
    });
  }

  private renderLoadout(): void {
    const member = this.state!.profile.party.find(
      ({ definitionId }) => definitionId === this.state!.selectedHeroId,
    );
    if (!member) return;
    const slotWidth = (this.width - 30) / 3;
    member.skillIds.forEach((skillId, index) => {
      const skill = this.skill(skillId);
      const column = index % 3;
      const row = Math.floor(index / 3);
      const node = createUiNode(
        `SkillSlot-${index + 1}`,
        this.node,
        slotWidth - 5,
        58,
        -this.width / 2 + 15 + slotWidth / 2 + column * slotWidth,
        this.height / 2 - 124 - row * 63,
      );
      const selected = index === this.state!.selectedSkillSlot;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(
        node,
        `${index + 1}｜${skill?.name ?? '空格'}\n${skill ? `${skill.stars}★ ${elementLabel(this.content!, skill.components[0]!.element)}` : ''}`,
        15,
        selected ? COLORS.ink : COLORS.text,
      );
      addButton(node, () => this.dispatch?.({ type: 'SELECT_SKILL_SLOT', slotIndex: index }));
    });

    const filters = ['all', 'fire', 'grass', 'water'];
    const filterWidth = (this.width - 30) / filters.length;
    filters.forEach((element, index) => {
      const node = createUiNode(
        `Element-${element}`,
        this.node,
        filterWidth - 5,
        34,
        -this.width / 2 + 15 + filterWidth / 2 + index * filterWidth,
        this.height / 2 - 255,
      );
      const selected = element === this.element;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.muted);
      addText(
        node,
        element === 'all' ? '全部' : elementLabel(this.content!, element),
        15,
        selected ? COLORS.ink : COLORS.text,
      );
      addButton(node, () => {
        this.element = element;
        this.page = 0;
        this.selectedSkillId = undefined;
        this.render();
      });
    });

    const filtered = this.state!.profile.skillInventory.filter(
      (skill) =>
        this.element === 'all' || skill.components.some(({ element }) => element === this.element),
    ).sort((left, right) => {
      if (left.id === this.selectedSkillId) return -1;
      if (right.id === this.selectedSkillId) return 1;
      return 0;
    });
    const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
    this.page = Math.max(0, Math.min(pageCount - 1, this.page));
    const visible = filtered.slice(this.page * 6, this.page * 6 + 6);
    const cardWidth = (this.width - 30) / 3;
    visible.forEach((skill, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const component = skill.components[0]!;
      const node = createUiNode(
        `Library-${skill.id}`,
        this.node,
        cardWidth - 5,
        68,
        -this.width / 2 + 15 + cardWidth / 2 + column * cardWidth,
        this.height / 2 - 310 - row * 73,
      );
      const selected = skill.id === this.selectedSkillId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(
        node,
        `${skill.name}\n${skill.stars}★ ${elementLabel(this.content!, component.element)}・${triggerLabel(this.content!, component.triggerId)}`,
        14,
        selected ? COLORS.ink : COLORS.text,
      );
      addButton(node, () => {
        this.selectedSkillId = skill.id;
        this.render();
      });
    });
    this.renderSelection(visible[0]);
    this.renderPager(pageCount);
  }

  private renderSelection(fallback?: RuntimeSkill): void {
    const skill = this.skill(this.selectedSkillId ?? '') ?? fallback;
    const y = -this.height / 2 + 82;
    const detail = createUiNode(
      'SkillSelection',
      this.node,
      this.width * 0.62,
      92,
      -this.width * 0.17,
      y,
    );
    addPanel(detail);
    if (!skill) {
      addText(detail, '技能庫目前沒有符合條件的技能', 17, COLORS.muted);
      return;
    }
    const segments = skill.components.map(
      (component, index) =>
        `${index + 1}.${elementLabel(this.content!, component.element)} ${specializationLabel(this.content!, component.specializationId)}／${triggerLabel(this.content!, component.triggerId)}：${component.power}傷・${component.repeatCount}擊`,
    );
    addText(detail, `${skill.name} ${skill.stars}★\n${segments.join('\n')}`, 15);
    const equip = createUiNode('EquipSkill', this.node, this.width * 0.3, 92, this.width * 0.32, y);
    addPanel(equip, COLORS.line, COLORS.gold);
    addText(
      equip,
      `裝到第 ${this.state!.selectedSkillSlot + 1} 格\n下一位自動接續`,
      17,
      COLORS.ink,
    );
    addButton(equip, () => this.dispatch?.({ type: 'EQUIP_SKILL', skillId: skill.id }));
  }

  private renderPager(pageCount: number): void {
    const y = -this.height / 2 + 20;
    const previous = createUiNode('SkillPrevious', this.node, 64, 32, -80, y);
    addPanel(previous);
    addText(previous, '←', 20);
    addButton(previous, () => {
      this.page = Math.max(0, this.page - 1);
      this.render();
    });
    addText(
      createUiNode('SkillPage', this.node, 80, 32, 0, y),
      `${this.page + 1}/${pageCount}`,
      16,
    );
    const next = createUiNode('SkillNext', this.node, 64, 32, 80, y);
    addPanel(next);
    addText(next, '→', 20);
    addButton(next, () => {
      this.page = Math.min(pageCount - 1, this.page + 1);
      this.render();
    });
  }

  private skill(id: string): RuntimeSkill | undefined {
    return this.state!.profile.skillInventory.find((skill) => skill.id === id);
  }
}
