import { Component } from 'cc';
import type { Label } from 'cc';

import { formatTriggerCue } from '../../runtime/expedition-runtime.mjs';
import type { RuntimePreview, RuntimeSkill, RuntimeUnit } from '../runtime/RuntimeContracts';
import { COLORS, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class CommandLens extends Component {
  private title?: Label;
  private condition?: Label;
  private outcome?: Label;

  initialize(width: number, height: number): void {
    addPanel(this.node);
    this.title = addText(
      createUiNode('Title', this.node, width * 0.3, height, -width * 0.34),
      '選擇技能',
      29,
    );
    this.condition = addText(
      createUiNode('Condition', this.node, width * 0.34, height, -width * 0.02),
      '觸發條件',
      24,
      COLORS.muted,
    );
    this.outcome = addText(
      createUiNode('Outcome', this.node, width * 0.34, height, width * 0.32),
      '預計結果',
      24,
      COLORS.gold,
    );
  }

  render(
    actor?: RuntimeUnit,
    target?: RuntimeUnit,
    skill?: RuntimeSkill,
    preview?: RuntimePreview,
  ): void {
    this.title!.string = actor
      ? `${actor.name} 攻${actor.stats.attack} → ${target?.name ?? '選目標'} 防${target?.stats.defense ?? '—'}`
      : '點我方角色';
    if (!skill) {
      this.condition!.string = '點技能查看觸發';
      this.outcome!.string = '';
      return;
    }
    const steps = preview?.comboSteps ?? [];
    this.condition!.string =
      steps.length > 0
        ? steps
            .slice(0, 3)
            .map((step, index) => {
              const ready = step.readiness === 'ready';
              const cue = formatTriggerCue(step.triggerId, ready)
                .text.replace('已觸發・', '')
                .replace('需要・', '');
              return `${index + 1}${ready ? '✓' : '○'}${cue}`;
            })
            .join(' › ')
        : '1✓必定施放';
    this.outcome!.string = preview
      ? preview.executionWindow
        ? `OVERKILL +${preview.overkill}｜${preview.relayEchoes} 次處刑迴響`
        : `傷害 ${preview.totalDamage}｜${preview.damageSegments} 段｜追擊 ${
            preview.chaseSegments > 0 ? `+${preview.chaseSegments}` : '無'
          }`
      : '點敵人預覽';
  }
}
