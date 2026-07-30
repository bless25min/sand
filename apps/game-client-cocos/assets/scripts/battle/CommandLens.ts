import { Color, Component, HorizontalTextAlignment } from 'cc';
import type { Label, Node } from 'cc';

import { createComboTrack } from '../../runtime/expedition-runtime.mjs';
import type { RuntimePreview, RuntimeSkill, RuntimeUnit } from '../runtime/RuntimeContracts';
import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

const ELEMENT_COLORS = {
  fire: new Color(255, 101, 75, 255),
  grass: new Color(88, 218, 122, 255),
  water: new Color(75, 183, 255, 255),
};

const STATUS_LABELS = {
  burn: '燃燒',
  poison: '毒素',
  tide: '潮湧',
};

const compactSkillName = (name: string): string => name.split('・')[1] ?? name;

interface TrackStep {
  index: number;
  triggerLabel: string;
  state: 'opening' | 'ready' | 'pending' | 'blocked';
  phaseLabel: '起手' | '接招' | '跳過';
  hint: string;
}

export class CommandLens extends Component {
  private actorTarget?: Label;
  private instruction?: Label;
  private contentRoot?: Node;
  private width = 0;
  private height = 0;
  private triggerLabel = '';
  private triggerState = '';

  initialize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    addPanel(this.node, new Color(4, 18, 19, 248), COLORS.line);
    this.actorTarget = addText(
      createUiNode('ActorTarget', this.node, width * 0.64, 40, -width * 0.17, height / 2 - 22),
      '點戰場上的我方角色',
      22,
    );
    this.actorTarget.horizontalAlign = HorizontalTextAlignment.LEFT;
    this.instruction = addText(
      createUiNode('Instruction', this.node, width * 0.32, 40, width * 0.33, height / 2 - 22),
      '選擇行動',
      20,
      COLORS.gold,
    );
    this.contentRoot = createUiNode('Focus', this.node, width, height - 44, 0, -21);
  }

  render(
    actor?: RuntimeUnit,
    target?: RuntimeUnit,
    skill?: RuntimeSkill,
    preview?: RuntimePreview,
    heroes: readonly RuntimeUnit[] = [],
  ): void {
    this.actorTarget!.string = actor
      ? `${actor.name}  攻 ${actor.stats.attack}   →   ${target?.name ?? '選擇敵人'}  防 ${
          target?.stats.defense ?? '—'
        }`
      : '點戰場上的我方角色';
    this.instruction!.string = !actor
      ? '先選角色'
      : !skill
        ? '選一個技能'
        : !target
          ? '再點敵人'
          : `點「${target.name}」出招`;
    this.contentRoot!.removeAllChildren();
    if (!skill) {
      addText(
        createUiNode('EmptyFocus', this.contentRoot!, this.width - 32, this.height - 54),
        actor ? '技能格只顯示快速比較；點一下後在這裡看完整連技。' : '直接點戰場上的角色開始。',
        22,
        COLORS.muted,
      );
      return;
    }
    this.renderChain(skill, preview);
    this.renderOutcome(preview);
    this.renderConsequenceStrip(target, preview, heroes);
  }

  private renderChain(skill: RuntimeSkill, preview?: RuntimePreview): void {
    const width = this.width * 0.63;
    const height = this.height - 54;
    const root = createUiNode('Chain', this.contentRoot!, width, height, -this.width * 0.18);
    const element = skill.components[0]?.element ?? 'fire';
    const color = ELEMENT_COLORS[element];
    const title = addText(
      createUiNode('SkillName', root, width - 18, 28, 0, height / 2 - 15),
      compactSkillName(skill.name),
      27,
      color,
    );
    title.isBold = true;
    title.horizontalAlign = HorizontalTextAlignment.LEFT;
    const track = createComboTrack(
      (preview?.comboSteps ?? []).map((step) => ({
        triggerId: step.triggerId,
        readiness: step.readiness,
        eventCount: step.eventIds?.length,
      })),
    ) as readonly TrackStep[];
    const visible = track.length > 0 ? track : [this.openingStep()];
    const rawSteps = preview?.comboSteps ?? [];
    const cueIndex = Math.max(
      0,
      rawSteps.findIndex(({ readiness }) => readiness === 'not-ready') >= 0
        ? rawSteps.findIndex(({ readiness }) => readiness === 'not-ready')
        : rawSteps.findIndex(({ readiness }) => readiness === 'pending-impact') >= 0
          ? rawSteps.findIndex(({ readiness }) => readiness === 'pending-impact')
          : rawSteps.findIndex(({ readiness }) => readiness === 'ready'),
    );
    const cue = rawSteps[cueIndex];
    const readiness =
      cue?.readiness === 'not-ready'
        ? '未滿足'
        : cue?.readiness === 'pending-impact'
          ? '命中後'
          : cue
            ? '可觸發'
            : '選目標';
    const triggerText = visible[cueIndex]?.triggerLabel ?? visible[0]!.triggerLabel;
    this.triggerLabel = triggerText;
    this.triggerState = readiness;
    const status = this.firstStatusChange(preview);
    const relayReady = preview?.nextRelays.some(
      ({ newlyReadySkillIds }) => newlyReadySkillIds.length > 0,
    );
    const cards = [
      { phase: '起手', value: '技能本體', state: '必定' },
      { phase: '觸發', value: triggerText || '命中判定', state: readiness },
      {
        phase: '爆發',
        value: status ? `${status}變化` : relayReady ? '點亮接力' : '造成傷害',
        state: preview?.executionWindow ? 'OVERKILL' : preview ? '已預覽' : '選目標',
      },
    ] as const;
    const gap = 9;
    const stepWidth = (width - 12 - gap * 2) / 3;
    cards.forEach((step, index) => {
      const node = createUiNode(
        `Step-${index + 1}`,
        root,
        stepWidth,
        height - 46,
        -width / 2 + 6 + stepWidth / 2 + index * (stepWidth + gap),
        -11,
      );
      const active = step.state !== '未滿足';
      addPanel(
        node,
        active ? new Color(color.r, color.g, color.b, 38) : new Color(20, 25, 25, 210),
        active ? color : COLORS.muted,
      );
      addText(
        createUiNode('Phase', node, stepWidth - 10, 22, 0, 16),
        step.phase,
        16,
        active ? color : COLORS.muted,
      );
      addText(
        createUiNode('Condition', node, stepWidth - 10, 24, 0, -5),
        step.value,
        16,
        active ? COLORS.text : COLORS.muted,
      );
      addText(
        createUiNode('Hint', node, stepWidth - 10, 20, 0, -27),
        step.state,
        14,
        active ? COLORS.gold : COLORS.muted,
      );
      if (index < 2) {
        addText(
          createUiNode('ChainArrow', root, gap, 28, node.position.x + stepWidth / 2 + gap / 2, -11),
          '›',
          22,
          COLORS.gold,
        );
      }
    });
  }

  private renderOutcome(preview: RuntimePreview | undefined): void {
    const width = this.width * 0.34;
    const height = this.height - 58;
    const root = createUiNode('Outcome', this.contentRoot!, width, height, this.width * 0.32);
    addPanel(root, new Color(0, 0, 0, 86), preview?.executionWindow ? COLORS.gold : COLORS.line);
    if (!preview) {
      addText(root, '先選目標\n即可預覽結果', 20, COLORS.muted);
      return;
    }
    addText(
      createUiNode('PreviewLabel', root, width - 12, 20, 0, height / 2 - 12),
      preview.executionWindow ? `OVERKILL ${preview.overkill}` : '結果預覽',
      14,
      COLORS.gold,
    );
    const outcomes = [
      { label: '總傷', value: preview.totalDamage },
      { label: '命中', value: preview.damageSegments },
      { label: '追擊', value: preview.chaseSegments },
    ] as const;
    const badgeWidth = (width - 10) / 3;
    outcomes.forEach(({ label, value }, index) => {
      const badge = createUiNode(
        `Outcome-${label}`,
        root,
        badgeWidth - 3,
        50,
        -width / 2 + 5 + badgeWidth / 2 + index * badgeWidth,
        2,
      );
      addPanel(badge, new Color(17, 38, 36, 235), label === '總傷' ? COLORS.gold : COLORS.line);
      addText(
        createUiNode('BadgeLabel', badge, badgeWidth - 8, 16, 0, 14),
        label,
        12,
        COLORS.muted,
      );
      const number = addText(
        createUiNode('BadgeValue', badge, badgeWidth - 8, 29, 0, -7),
        String(value),
        label === '總傷' ? 23 : 20,
        label === '總傷' ? COLORS.gold : COLORS.text,
      );
      number.isBold = true;
    });
  }

  private renderConsequenceStrip(
    target: RuntimeUnit | undefined,
    preview: RuntimePreview | undefined,
    heroes: readonly RuntimeUnit[],
  ): void {
    if (!preview) return;
    const status = target ? this.statusChange(preview, target.id) : undefined;
    const relay = preview.nextRelays.find(
      ({ newlyReadySkillIds }) => newlyReadySkillIds.length > 0,
    );
    const relayName = heroes.find(({ id }) => id === relay?.actorId)?.name;
    const consequences = [
      status,
      relay && relayName ? `${relayName}接力＋${relay.newlyReadySkillIds.length}` : undefined,
    ].filter(Boolean);
    addText(
      createUiNode(
        'ConsequenceStrip',
        this.contentRoot!,
        this.width - 24,
        19,
        0,
        -(this.height - 44) / 2 + 11,
      ),
      consequences.join(' · ') || '純傷害',
      15,
      consequences.length > 0 ? COLORS.gold : COLORS.muted,
    );
  }

  triggerDiagnostic(): { label: string; state: string } | undefined {
    return this.triggerLabel ? { label: this.triggerLabel, state: this.triggerState } : undefined;
  }

  private statusChange(preview: RuntimePreview, targetId: string): string | undefined {
    const unit = preview.units.find(({ id }) => id === targetId);
    if (!unit) return undefined;
    const change = (Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[])
      .map((key) => ({
        key,
        before: unit.beforeStatus[key],
        after: unit.afterStatus[key],
      }))
      .find(({ before, after }) => before !== after);
    return change ? `${STATUS_LABELS[change.key]} ${change.before}→${change.after}` : undefined;
  }

  private firstStatusChange(preview?: RuntimePreview): string | undefined {
    if (!preview) return undefined;
    for (const unit of preview.units) {
      for (const key of Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]) {
        if (unit.beforeStatus[key] !== unit.afterStatus[key]) return STATUS_LABELS[key];
      }
    }
    return undefined;
  }

  private openingStep(): TrackStep {
    return {
      index: 1,
      triggerLabel: '技能本體',
      state: 'opening',
      phaseLabel: '起手',
      hint: '必定施放',
    };
  }
}
