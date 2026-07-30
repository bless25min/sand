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
    this.renderOutcome(target, preview, heroes);
  }

  private renderChain(skill: RuntimeSkill, preview?: RuntimePreview): void {
    const width = this.width * 0.63;
    const height = this.height - 54;
    const root = createUiNode('Chain', this.contentRoot!, width, height, -this.width * 0.18);
    const element = skill.components[0]?.element ?? 'fire';
    const color = ELEMENT_COLORS[element];
    const title = addText(
      createUiNode('SkillName', root, width - 18, 28, 0, height / 2 - 15),
      skill.name,
      24,
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
    const visible = track.length > 0 ? track.slice(0, 3) : [this.openingStep()];
    const gap = 6;
    const stepWidth = (width - 12 - gap * (visible.length - 1)) / visible.length;
    visible.forEach((step, index) => {
      const node = createUiNode(
        `Step-${step.index}`,
        root,
        stepWidth,
        height - 34,
        -width / 2 + 6 + stepWidth / 2 + index * (stepWidth + gap),
        -17,
      );
      const active = step.state !== 'blocked';
      addPanel(
        node,
        active ? new Color(color.r, color.g, color.b, 38) : new Color(20, 25, 25, 210),
        active ? color : COLORS.muted,
      );
      addText(
        createUiNode('Phase', node, stepWidth - 10, 22, 0, 16),
        `${step.index}. ${step.phaseLabel}`,
        18,
        active ? color : COLORS.muted,
      );
      addText(
        createUiNode('Condition', node, stepWidth - 10, 24, 0, -5),
        step.triggerLabel,
        19,
        active ? COLORS.text : COLORS.muted,
      );
      addText(
        createUiNode('Hint', node, stepWidth - 10, 20, 0, -27),
        step.hint,
        15,
        active ? COLORS.gold : COLORS.muted,
      );
    });
  }

  private renderOutcome(
    target: RuntimeUnit | undefined,
    preview: RuntimePreview | undefined,
    heroes: readonly RuntimeUnit[],
  ): void {
    const width = this.width * 0.34;
    const height = this.height - 58;
    const root = createUiNode('Outcome', this.contentRoot!, width, height, this.width * 0.32);
    addPanel(root, new Color(0, 0, 0, 86), preview?.executionWindow ? COLORS.gold : COLORS.line);
    if (!preview) {
      addText(root, '先選目標\n即可預覽結果', 20, COLORS.muted);
      return;
    }
    const primary = addText(
      createUiNode('Primary', root, width - 12, 32, 0, height / 2 - 18),
      preview.executionWindow ? `OVERKILL ${preview.overkill}` : `總傷 ${preview.totalDamage}`,
      preview.executionWindow ? 25 : 28,
      COLORS.gold,
    );
    primary.isBold = true;
    addText(
      createUiNode('Segments', root, width - 12, 24, 0, 5),
      `${preview.damageSegments} 段攻擊 · 額外追擊 ${preview.chaseSegments} 次`,
      17,
      COLORS.text,
    );
    const status = target ? this.statusChange(preview, target.id) : undefined;
    const relay = preview.nextRelays.find(
      ({ newlyReadySkillIds }) => newlyReadySkillIds.length > 0,
    );
    const relayName = heroes.find(({ id }) => id === relay?.actorId)?.name;
    addText(
      createUiNode('Consequences', root, width - 12, 34, 0, -height / 2 + 20),
      [
        status,
        relay && relayName
          ? `接力：${relayName}亮起 ${relay.newlyReadySkillIds.length} 招`
          : undefined,
      ]
        .filter(Boolean)
        .join('　') || '本次沒有額外狀態',
      16,
      status || relay ? COLORS.gold : COLORS.muted,
    );
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
