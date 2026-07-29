import type { TriggerCondition } from '@expedition/shared-types';

import type { CombatBeat } from './combat-beats';

export interface CombatBeatCue {
  tone: 'opening' | 'hit' | 'chain' | 'status' | 'total' | 'relay' | 'finisher' | 'enemy';
  eyebrow: string;
  label: string;
}

const TRIGGER_CUES: Readonly<Partial<Record<TriggerCondition, string>>> = {
  battle_open: '開戰觸發',
  round_open: '回合觸發',
  first_actor: '首位觸發',
  final_actor: '末位觸發',
  after_skill: '出招觸發',
  target_burning: '燃燒觸發',
  target_poisoned: '毒素觸發',
  target_tide: '潮勢觸發',
  actor_strengthened: '強化觸發',
  target_weakened: '削弱觸發',
  layer_threshold: '疊層觸發',
  consume_burn: '消耗燃燒',
  consume_poison: '消耗毒素',
  consume_tide: '消耗潮勢',
  consume_all_burn: '燃燒爆發',
  consume_all_poison: '毒素爆發',
  consume_all_tide: '潮勢爆發',
  consume_mixed: '混合爆發',
  on_hit: '命中觸發',
  on_repeat_hit: '命中觸發',
  on_bounce: '彈射觸發',
  on_echo: '迴響觸發',
  on_defeat: '擊破觸發',
  on_overkill: '溢傷觸發',
  previous_fire: '火棒接力',
  previous_grass: '草棒接力',
  previous_water: '水棒接力',
  ally_same_element: '同屬接力',
  team_three_elements: '三屬共鳴',
  lone_target: '孤敵迴響',
};

const STATUS_LABELS = {
  burn: '燃燒疊層',
  poison: '毒素疊層',
  tide: '潮勢疊層',
  weaken: '防禦削弱',
  strengthen: '我方強化',
} as const;

export function createCombatBeatCue(beat: CombatBeat): CombatBeatCue {
  if (beat.kind === 'chain') {
    return {
      tone: 'chain',
      eyebrow: beat.visual.triggerId
        ? (TRIGGER_CUES[beat.visual.triggerId] ?? '條件觸發')
        : '條件觸發',
      label: `追擊第 ${beat.comboIndex ?? beat.visual.comboIndex ?? 2} 擊`,
    };
  }
  if (beat.kind === 'status') {
    return {
      tone: 'status',
      eyebrow: '效果成立',
      label: beat.visual.status ? STATUS_LABELS[beat.visual.status] : '狀態生效',
    };
  }
  if (beat.kind === 'total') {
    return { tone: 'total', eyebrow: '本次結果', label: '本棒合計' };
  }
  if (beat.kind === 'relay') {
    return { tone: 'relay', eyebrow: '下一位更強', label: `接力 ${beat.relay} / 6` };
  }
  if (beat.kind === 'finisher') {
    return { tone: 'finisher', eyebrow: '條件爆發', label: '終結處決' };
  }
  if (beat.kind === 'enemy') {
    return { tone: 'enemy', eyebrow: '敵軍反擊', label: beat.visual.headline };
  }
  if (beat.kind === 'cast') {
    return { tone: 'opening', eyebrow: '技能起手', label: beat.visual.headline };
  }
  return {
    tone: 'hit',
    eyebrow: beat.comboIndex ? `連擊第 ${beat.comboIndex} 擊` : '直接命中',
    label: beat.comboIndex ? `第 ${beat.comboIndex} 擊` : '命中',
  };
}
