import type { SkillOutcomePreview, TriggerReadiness } from '@expedition/simulation-core';
import type { GuildSkillItem, StatusLayer, TriggerCondition } from '@expedition/shared-types';

import { skillIntentName } from './skill-tile-presentation';

const TRIGGER_PHRASES: Readonly<Record<TriggerCondition, string>> = {
  battle_open: '開戰時',
  round_open: '回合開始時',
  first_actor: '本輪第一位出手時',
  final_actor: '本輪最後一位出手時',
  after_skill: '上一位已出手時',
  target_burning: '敵人燃燒時',
  target_poisoned: '敵人中毒時',
  target_tide: '敵人帶有潮勢時',
  actor_strengthened: '自身獲得強化時',
  target_weakened: '敵人破防時',
  layer_threshold: '狀態達到五層時',
  consume_burn: '消耗燃燒時',
  consume_poison: '消耗毒素時',
  consume_tide: '消耗潮勢時',
  consume_all_burn: '引爆全部燃燒時',
  consume_all_poison: '引爆全部毒素時',
  consume_all_tide: '引爆全部潮勢時',
  consume_mixed: '敵人帶有兩種狀態時',
  on_hit: '命中後',
  on_repeat_hit: '第二次命中後',
  on_bounce: '彈射後',
  on_echo: '迴響後',
  on_defeat: '擊破敵人後',
  on_overkill: '造成溢傷後',
  previous_fire: '上一位使用火屬時',
  previous_grass: '上一位使用草屬時',
  previous_water: '上一位使用水屬時',
  ally_same_element: '同屬隊友接棒時',
  team_three_elements: '三種屬性完成接力時',
  lone_target: '場上只剩一名敵人時',
};

const BLOCKING_REASONS: Readonly<Record<TriggerCondition, string>> = {
  battle_open: '只在開戰時追加',
  round_open: '只在回合開始時追加',
  first_actor: '需要安排在本輪第一位',
  final_actor: '需要安排在本輪最後一位',
  after_skill: '需要上一位先出手',
  target_burning: '需要敵人燃燒',
  target_poisoned: '需要敵人中毒',
  target_tide: '需要敵人帶有潮勢',
  actor_strengthened: '需要自身先獲得強化',
  target_weakened: '需要敵人先被削弱',
  layer_threshold: '需要任一狀態達到五層',
  consume_burn: '需要敵人燃燒',
  consume_poison: '需要敵人中毒',
  consume_tide: '需要敵人帶有潮勢',
  consume_all_burn: '需要敵人燃燒',
  consume_all_poison: '需要敵人中毒',
  consume_all_tide: '需要敵人帶有潮勢',
  consume_mixed: '需要敵人同時帶有兩種狀態',
  on_hit: '命中後才會追加',
  on_repeat_hit: '第二次命中後才會追加',
  on_bounce: '彈射後才會追加',
  on_echo: '迴響後才會追加',
  on_defeat: '擊破敵人後才會追加',
  on_overkill: '造成溢傷後才會追加',
  previous_fire: '需要上一位使用火屬',
  previous_grass: '需要上一位使用草屬',
  previous_water: '需要上一位使用水屬',
  ally_same_element: '需要同屬隊友接棒',
  team_three_elements: '需要三種屬性完成接力',
  lone_target: '需要場上只剩一名敵人',
};

const STATUS_NAMES: Readonly<Record<StatusLayer, string>> = {
  burn: '燃燒',
  poison: '毒素',
  tide: '潮勢',
};

const STATUS_SHORT: Readonly<Record<StatusLayer, string>> = {
  burn: '燃',
  poison: '毒',
  tide: '潮',
};

export interface SkillActionPresentation {
  name: string;
  damageLabel?: string | undefined;
  healingLabel?: string | undefined;
  hitLabel?: string | undefined;
  statusLabel?: string | undefined;
  baseLabel: string;
  conditionLabel?: string | undefined;
  conditionState?: TriggerReadiness | undefined;
  addedLabel?: string | undefined;
  nextRelay?: { actorId: string; skillId: string } | undefined;
  sentence: string;
  blockingReason?: string | undefined;
  ready: boolean;
  execution: boolean;
}

const strongestStatusChange = (preview: SkillOutcomePreview) => {
  const target = preview.units.find(({ id }) => id === preview.targetId);
  if (!target) return undefined;
  return (['burn', 'poison', 'tide'] as const)
    .map((kind) => ({ kind, amount: target.afterStatus[kind] - target.beforeStatus[kind] }))
    .filter(({ amount }) => amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
};

const potentialAddedLabel = (skill: GuildSkillItem, componentId: string): string | undefined => {
  const component = skill.components.find(({ id }) => id === componentId);
  if (!component) return undefined;
  const layer = component.element === 'fire' ? '燃' : component.element === 'grass' ? '毒' : '潮';
  if (component.specializationId === 'stack') return `可${layer}+${component.layerStrength}`;
  if (component.specializationId === 'weaken') return `可破防+${component.layerStrength}`;
  if (component.specializationId === 'empower') return `可強化+${component.layerStrength}`;
  if (component.specializationId === 'multistrike') {
    return `可追加${Math.max(1, component.repeatCount)}擊`;
  }
  if (component.specializationId === 'chain') return `可彈射傷${component.triggerAddition}`;
  if (component.specializationId === 'blast') return `可爆發傷${component.triggerAddition}`;
  return `可追加傷${component.triggerAddition}`;
};

export function createSkillActionPresentation(
  skill: GuildSkillItem,
  preview: SkillOutcomePreview,
): SkillActionPresentation {
  const status = strongestStatusChange(preview);
  const activeSteps = preview.comboSteps.filter(({ readiness }) => readiness !== 'not-ready');
  const chaseDamage = activeSteps.reduce((sum, step) => sum + step.chaseDamage, 0);
  const baseDamage = Math.max(0, preview.totalDamage - chaseDamage);
  const causeStep =
    preview.comboSteps.find(({ readiness }) => readiness === 'ready') ??
    preview.comboSteps.find(({ readiness }) => readiness === 'pending-impact') ??
    preview.comboSteps[0];
  const relay = preview.nextRelays[0];
  const relaySkillId = relay?.newlyReadySkillIds[0] ?? relay?.readySkillIds[0];
  const sentence: string[] = [];

  if (preview.executionWindow) {
    sentence.push(
      preview.finisherPower > 0
        ? `釋放本輪累積力量，形成${preview.finisherPower}點終結爆發。`
        : `保留既有${preview.overkill}點溢傷，不產生額外傷害。`,
    );
  } else {
    if (baseDamage > 0) sentence.push(`造成${baseDamage}傷。`);
    if (preview.totalHealing > 0) sentence.push(`恢復${preview.totalHealing}生命。`);
    for (const step of activeSteps) {
      if (step.chaseDamage > 0) {
        sentence.push(`${TRIGGER_PHRASES[step.triggerId]}再造成${step.chaseDamage}傷。`);
      }
    }
    if (status) {
      sentence.push(
        status.amount > 0
          ? `附加${status.amount}${STATUS_NAMES[status.kind]}。`
          : `消耗${Math.abs(status.amount)}${STATUS_NAMES[status.kind]}。`,
      );
    }
  }

  const blocked = preview.comboSteps.find(({ readiness }) => readiness === 'not-ready');
  const baseParts = [
    baseDamage > 0
      ? `先傷${baseDamage}`
      : preview.totalHealing > 0
        ? `先療${preview.totalHealing}`
        : '先改變狀態',
    status
      ? `${STATUS_SHORT[status.kind]}${status.amount > 0 ? '+' : ''}${status.amount}`
      : undefined,
  ].filter((value): value is string => Boolean(value));
  const addedLabel = causeStep
    ? causeStep.readiness === 'not-ready'
      ? potentialAddedLabel(skill, causeStep.componentId)
      : causeStep.chaseDamage > 0
        ? `追加傷${causeStep.chaseDamage}`
        : potentialAddedLabel(skill, causeStep.componentId)
            ?.replace(/^可(?=追加)/, '')
            .replace(/^可/, '追加')
    : undefined;
  return {
    name: skillIntentName(skill),
    ...(preview.totalDamage > 0 ? { damageLabel: `傷${preview.totalDamage}` } : {}),
    ...(preview.totalHealing > 0 ? { healingLabel: `療${preview.totalHealing}` } : {}),
    ...(preview.damageSegments > 1 ? { hitLabel: `${preview.damageSegments}擊` } : {}),
    ...(status
      ? {
          statusLabel: `${STATUS_SHORT[status.kind]}${status.amount > 0 ? '+' : ''}${status.amount}`,
        }
      : {}),
    baseLabel: preview.executionWindow
      ? preview.finisherPower > 0
        ? `終結${preview.finisherPower}`
        : `溢傷${preview.overkill}`
      : baseParts.join('·'),
    ...(causeStep
      ? {
          conditionLabel: TRIGGER_PHRASES[causeStep.triggerId],
          conditionState: causeStep.readiness,
        }
      : {}),
    ...(addedLabel ? { addedLabel } : {}),
    ...(relay && relaySkillId
      ? { nextRelay: { actorId: relay.actorId, skillId: relaySkillId } }
      : {}),
    sentence: sentence.join('') || '改變目前戰場狀態。',
    ...(blocked ? { blockingReason: BLOCKING_REASONS[blocked.triggerId] } : {}),
    ready: activeSteps.length > 0,
    execution: preview.executionWindow,
  };
}
