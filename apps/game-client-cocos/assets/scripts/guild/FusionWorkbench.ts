import { Component } from 'cc';

import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
  RuntimeSkill,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class FusionWorkbench extends Component {
  private state?: RuntimeGuildState;
  private dispatch?: (action: RuntimeGuildAction) => void;
  private width = 0;
  private height = 0;
  private selectedFusedId?: string;
  private selectedComponent = 0;
  private confirmDismantle = false;
  private candidatePage = 0;
  private fusedPage = 0;

  initialize(
    state: RuntimeGuildState,
    _content: RuntimeContent,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
  ): void {
    this.state = state;
    this.dispatch = dispatch;
    this.width = width;
    this.height = height;
    this.render();
  }

  private render(): void {
    this.node.removeAllChildren();
    const equipped = new Set<string>();
    this.state!.profile.party.forEach(({ skillIds }) => skillIds.forEach((id) => equipped.add(id)));
    const candidates = this.state!.profile.skillInventory.filter(
      (skill) => skill.stars === 1 && !equipped.has(skill.id),
    );
    const fused = this.state!.profile.skillInventory.filter((skill) => skill.stars > 1);
    const candidatePageCount = Math.max(1, Math.ceil(candidates.length / 6));
    const fusedPageCount = Math.max(1, Math.ceil(fused.length / 3));
    this.candidatePage = Math.min(this.candidatePage, candidatePageCount - 1);
    this.fusedPage = Math.min(this.fusedPage, fusedPageCount - 1);
    const visibleCandidates = candidates.slice(this.candidatePage * 6, this.candidatePage * 6 + 6);
    const visibleFused = fused.slice(this.fusedPage * 3, this.fusedPage * 3 + 3);
    addText(
      createUiNode('FusionGuide', this.node, this.width - 24, 40, 0, this.height / 2 - 22),
      '選 2–3 張同屬性一星技能；排列順序就是戰鬥結算順序',
      17,
      COLORS.muted,
    );
    const cardWidth = (this.width - 30) / 3;
    visibleCandidates.forEach((skill, index) => {
      const node = createUiNode(
        `FusionCandidate-${skill.id}`,
        this.node,
        cardWidth - 5,
        58,
        -this.width / 2 + 15 + cardWidth / 2 + (index % 3) * cardWidth,
        this.height / 2 - 80 - Math.floor(index / 3) * 63,
      );
      const selected = this.state!.selectedFusionIds.indexOf(skill.id) >= 0;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(
        node,
        `${skill.name}\n${skill.components[0]!.element}・${skill.components[0]!.triggerId}`,
        14,
        selected ? COLORS.ink : COLORS.text,
      );
      addButton(node, () => this.dispatch?.({ type: 'TOGGLE_FUSION_SKILL', skillId: skill.id }));
    });
    this.pageButton(
      'FusionCandidatePrevious',
      '‹',
      -this.width * 0.44,
      this.height / 2 - 190,
      this.candidatePage > 0,
      () => {
        this.candidatePage -= 1;
        this.render();
      },
    );
    addText(
      createUiNode('FusionCandidatePage', this.node, 100, 30, 0, this.height / 2 - 190),
      `素材 ${this.candidatePage + 1}/${candidatePageCount}`,
      14,
      COLORS.muted,
    );
    this.pageButton(
      'FusionCandidateNext',
      '›',
      this.width * 0.44,
      this.height / 2 - 190,
      this.candidatePage + 1 < candidatePageCount,
      () => {
        this.candidatePage += 1;
        this.render();
      },
    );
    const fuse = createUiNode(
      'FuseSelected',
      this.node,
      this.width * 0.72,
      48,
      0,
      this.height / 2 - 218,
    );
    const canFuse = this.state!.selectedFusionIds.length >= 2;
    addPanel(fuse, canFuse ? COLORS.line : COLORS.panel, canFuse ? COLORS.gold : COLORS.muted);
    addText(
      fuse,
      `融合已選 ${this.state!.selectedFusionIds.length}/3 張`,
      19,
      canFuse ? COLORS.ink : COLORS.muted,
    );
    if (canFuse) addButton(fuse, () => this.dispatch?.({ type: 'FUSE_SELECTED' }));

    const fusedWidth = (this.width - 30) / 3;
    this.pageButton(
      'FusionSkillPrevious',
      '‹',
      -this.width * 0.44,
      this.height / 2 - 265,
      this.fusedPage > 0,
      () => {
        this.fusedPage -= 1;
        this.render();
      },
    );
    addText(
      createUiNode('FusionSkillPage', this.node, 120, 30, 0, this.height / 2 - 265),
      `融合技 ${this.fusedPage + 1}/${fusedPageCount}`,
      14,
      COLORS.muted,
    );
    this.pageButton(
      'FusionSkillNext',
      '›',
      this.width * 0.44,
      this.height / 2 - 265,
      this.fusedPage + 1 < fusedPageCount,
      () => {
        this.fusedPage += 1;
        this.render();
      },
    );
    visibleFused.forEach((skill, index) => {
      const node = createUiNode(
        `Fused-${skill.id}`,
        this.node,
        fusedWidth - 5,
        58,
        -this.width / 2 + 15 + fusedWidth / 2 + index * fusedWidth,
        this.height / 2 - 305,
      );
      const selected = skill.id === (this.selectedFusedId ?? fused[0]?.id);
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(
        node,
        `${skill.name}\n${skill.stars}★ ${skill.components.length} 段`,
        15,
        selected ? COLORS.ink : COLORS.text,
      );
      addButton(node, () => {
        this.selectedFusedId = skill.id;
        this.selectedComponent = 0;
        this.confirmDismantle = false;
        this.render();
      });
    });
    this.renderFusedEditor(visibleFused, candidates);
  }

  private renderFusedEditor(fused: RuntimeSkill[], candidates: RuntimeSkill[]): void {
    const skill = fused.find(({ id }) => id === this.selectedFusedId) ?? fused[0];
    if (!skill) {
      addText(
        createUiNode('NoFused', this.node, this.width - 30, 80, 0, -80),
        '尚無融合技能',
        20,
        COLORS.muted,
      );
      return;
    }
    const editorY = this.height / 2 - 365;
    const componentWidth = (this.width - 30) / skill.components.length;
    skill.components.forEach((component, index) => {
      const node = createUiNode(
        `FusedComponent-${index}`,
        this.node,
        componentWidth - 5,
        66,
        -this.width / 2 + 15 + componentWidth / 2 + index * componentWidth,
        editorY,
      );
      const selected = index === this.selectedComponent;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.line);
      addText(
        node,
        `${index + 1}段\n${component.triggerId}`,
        14,
        selected ? COLORS.ink : COLORS.text,
      );
      addButton(node, () => {
        this.selectedComponent = index;
        this.render();
      });
    });
    const controlsY = editorY - 70;
    this.actionButton('MoveComponentUp', '← 前移', -this.width * 0.32, controlsY, () =>
      this.dispatch?.({
        type: 'MOVE_FUSED_COMPONENT',
        fusedSkillId: skill.id,
        componentIndex: this.selectedComponent,
        direction: -1,
      }),
    );
    this.actionButton('MoveComponentDown', '後移 →', -this.width * 0.1, controlsY, () =>
      this.dispatch?.({
        type: 'MOVE_FUSED_COMPONENT',
        fusedSkillId: skill.id,
        componentIndex: this.selectedComponent,
        direction: 1,
      }),
    );
    const replacement = candidates.find(
      (candidate) =>
        candidate.components[0]!.element === skill.components[this.selectedComponent]?.element,
    );
    if (replacement) {
      this.actionButton(
        'ReplaceComponent',
        `換成 ${replacement.name}`,
        this.width * 0.16,
        controlsY,
        () =>
          this.dispatch?.({
            type: 'REPLACE_FUSED_COMPONENT',
            fusedSkillId: skill.id,
            componentIndex: this.selectedComponent,
            replacementSkillId: replacement.id,
          }),
      );
    }
    this.actionButton(
      'DismantleSkill',
      this.confirmDismantle ? '確認無損拆解' : '拆解',
      this.width * 0.38,
      controlsY,
      () => {
        if (!this.confirmDismantle) {
          this.confirmDismantle = true;
          this.render();
          return;
        }
        this.dispatch?.({ type: 'DISMANTLE_SKILL', skillId: skill.id });
      },
    );
  }

  private actionButton(
    name: string,
    label: string,
    x: number,
    y: number,
    action: () => void,
  ): void {
    const node = createUiNode(name, this.node, this.width * 0.2, 48, x, y);
    addPanel(node);
    addText(node, label, 14);
    addButton(node, action);
  }

  private pageButton(
    name: string,
    label: string,
    x: number,
    y: number,
    enabled: boolean,
    action: () => void,
  ): void {
    const node = createUiNode(name, this.node, 42, 30, x, y);
    addPanel(node, COLORS.panel, enabled ? COLORS.line : COLORS.muted);
    addText(node, label, 18, enabled ? COLORS.text : COLORS.muted);
    if (enabled) addButton(node, action);
  }
}
