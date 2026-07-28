import type { SkillOutcomePreview, TriggerReadiness } from '@expedition/simulation-core';
import type {
  GuildElement,
  GuildSkillItem,
  SkillSpecialization,
  StatusLayer,
  TriggerCondition,
} from '@expedition/shared-types';

const INTENT_NAMES: Readonly<Record<GuildElement, Readonly<Record<SkillSpecialization, string>>>> =
  {
    fire: {
      blast: '燃爆',
      stack: '引火',
      weaken: '熔甲',
      chain: '火鏈',
      empower: '火勢',
      multistrike: '連焚',
    },
    grass: {
      blast: '毒爆',
      stack: '施毒',
      weaken: '蝕甲',
      chain: '毒鏈',
      empower: '毒勢',
      multistrike: '連蝕',
    },
    water: {
      blast: '潮爆',
      stack: '蓄潮',
      weaken: '沖甲',
      chain: '潮鏈',
      empower: '潮勢',
      multistrike: '連潮',
    },
  };

const TRIGGER_LABELS: Readonly<Record<TriggerCondition, string>> = {
  battle_open: '開戰',
  round_open: '回合開幕',
  first_actor: '先鋒位',
  final_actor: '壓軸位',
  after_skill: '技能結束',
  target_burning: '目標燃燒',
  target_poisoned: '目標中毒',
  target_tide: '目標蓄潮',
  actor_strengthened: '自身強化',
  target_weakened: '目標破防',
  layer_threshold: '狀態5層',
  consume_burn: '消耗燃燒',
  consume_poison: '消耗毒素',
  consume_tide: '消耗蓄潮',
  consume_all_burn: '燃燒全爆',
  consume_all_poison: '毒素全爆',
  consume_all_tide: '蓄潮全爆',
  consume_mixed: '雙屬狀態',
  on_hit: '命中後',
  on_repeat_hit: '第2段起',
  on_bounce: '彈射後',
  on_echo: '迴響後',
  on_defeat: '擊破後',
  on_overkill: '溢傷後',
  previous_fire: '上一棒火',
  previous_grass: '上一棒草',
  previous_water: '上一棒水',
  ally_same_element: '同屬接力',
  team_three_elements: '三相接力',
  lone_target: '孤王單體',
};

const MISSING_LABELS: Readonly<Record<TriggerCondition, string>> = {
  battle_open: '缺開戰時機',
  round_open: '缺回合開幕',
  first_actor: '缺先鋒位',
  final_actor: '缺壓軸位',
  after_skill: '缺前一位出手',
  target_burning: '缺燃燒',
  target_poisoned: '缺毒素',
  target_tide: '缺蓄潮',
  actor_strengthened: '缺強化',
  target_weakened: '缺破防',
  layer_threshold: '缺5層狀態',
  consume_burn: '缺燃燒',
  consume_poison: '缺毒素',
  consume_tide: '缺蓄潮',
  consume_all_burn: '缺燃燒',
  consume_all_poison: '缺毒素',
  consume_all_tide: '缺蓄潮',
  consume_mixed: '缺雙屬狀態',
  on_hit: '出招時判定',
  on_repeat_hit: '出招時判定',
  on_bounce: '出招時判定',
  on_echo: '出招時判定',
  on_defeat: '出招時判定',
  on_overkill: '出招時判定',
  previous_fire: '缺上一棒火屬',
  previous_grass: '缺上一棒草屬',
  previous_water: '缺上一棒水屬',
  ally_same_element: '缺同屬隊友',
  team_three_elements: '缺三種屬性',
  lone_target: '缺單一敵人',
};

interface SkillComboStepPresentation {
  componentId: string;
  conditionLabel: string;
  readiness: TriggerReadiness;
  readinessLabel: string;
  effectLabel: string;
}

export interface SkillTilePresentation {
  intentName: string;
  primaryKind: 'damage' | 'healing' | 'effect' | 'finisher';
  primaryValue: number;
  segments: number;
  chases: number;
  statusDelta?: { kind: StatusLayer; amount: number } | undefined;
  execution: boolean;
  readiness: TriggerReadiness;
  readyCount: number;
  stepCount: number;
  triggerSummary: string;
  comboSteps: readonly SkillComboStepPresentation[];
}

const statusDelta = (preview: SkillOutcomePreview): SkillTilePresentation['statusDelta'] => {
  const target = preview.units.find(({ id }) => id === preview.targetId);
  if (!target) return undefined;
  const changes = (['burn', 'poison', 'tide'] as const)
    .map((kind) => ({ kind, amount: target.afterStatus[kind] - target.beforeStatus[kind] }))
    .filter(({ amount }) => amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return changes[0];
};

export function createSkillTilePresentation(
  skill: GuildSkillItem,
  preview: SkillOutcomePreview,
): SkillTilePresentation {
  const first = skill.components[0];
  const primaryKind =
    preview.totalDamage > 0 ? 'damage' : preview.totalHealing > 0 ? 'healing' : 'effect';
  const components = new Map(skill.components.map((component) => [component.id, component]));
  const comboSteps = preview.comboSteps.map((step): SkillComboStepPresentation => {
    const component = components.get(step.componentId)!;
    const effectValue = step.chaseDamage || component.triggerAddition;
    const effectLabel = (
      ['consume_all_burn', 'consume_all_poison', 'consume_all_tide'] as TriggerCondition[]
    ).includes(step.triggerId)
      ? `每層爆發${component.triggerAddition}`
      : step.triggerId === 'on_repeat_hit'
        ? `每段追傷${component.triggerAddition}`
        : step.triggerId === 'on_bounce' || step.triggerId === 'on_echo'
          ? `每跳追傷${component.triggerAddition}`
          : `追傷${effectValue}`;
    return {
      componentId: step.componentId,
      conditionLabel: TRIGGER_LABELS[step.triggerId],
      readiness: step.readiness,
      readinessLabel:
        step.readiness === 'ready'
          ? '已成立'
          : step.readiness === 'pending-impact'
            ? '出招時判定'
            : MISSING_LABELS[step.triggerId],
      effectLabel,
    };
  });
  const readyCount = comboSteps.filter(({ readiness }) => readiness === 'ready').length;
  const summaryStep = (comboSteps.find(({ readiness }) => readiness === 'ready') ?? comboSteps[0])!;
  if (preview.executionWindow) {
    const finalExecution = preview.finisherPower > 0;
    return {
      intentName: INTENT_NAMES[first.element][first.specializationId],
      primaryKind: finalExecution ? 'finisher' : 'effect',
      primaryValue: finalExecution ? preview.finisherPower : preview.overkill,
      segments: preview.relayEchoes,
      chases: 0,
      execution: true,
      readiness: 'ready',
      readyCount: 1,
      stepCount: 1,
      triggerSummary: finalExecution
        ? '第六棒✓ → 全軍終結'
        : `第${preview.relayEchoes + 1}棒✓ → 餘震回收`,
      comboSteps,
    };
  }
  const mark =
    summaryStep.readiness === 'ready'
      ? '✓'
      : summaryStep.readiness === 'pending-impact'
        ? '•'
        : '缺';
  return {
    intentName: INTENT_NAMES[first.element][first.specializationId],
    primaryKind,
    primaryValue:
      primaryKind === 'damage'
        ? preview.totalDamage
        : primaryKind === 'healing'
          ? preview.totalHealing
          : 0,
    segments: preview.damageSegments,
    chases: preview.chaseSegments,
    statusDelta: statusDelta(preview),
    execution: false,
    readiness:
      readyCount > 0
        ? 'ready'
        : comboSteps.some(({ readiness }) => readiness === 'pending-impact')
          ? 'pending-impact'
          : 'not-ready',
    readyCount,
    stepCount: comboSteps.length,
    triggerSummary:
      comboSteps.length === 1
        ? `${summaryStep.conditionLabel}${mark} → ${summaryStep.effectLabel}`
        : `連招 ${readyCount}/${comboSteps.length} 已亮`,
    comboSteps,
  };
}
