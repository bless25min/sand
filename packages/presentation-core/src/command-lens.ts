import type {
  BattleAction,
  BattleUnit,
  GuildElement,
  TriggerCondition,
} from '@expedition/shared-types';

export interface CommandSelection {
  actorId?: string;
  targetId?: string;
  skillId?: string;
}

const TRIGGER_CUE_LABELS: Readonly<Record<TriggerCondition, string>> = {
  battle_open: '開戰',
  round_open: '回合開始',
  first_actor: '首位出手',
  final_actor: '末位出手',
  after_skill: '接在技能後',
  target_burning: '目標燃燒',
  target_poisoned: '目標中毒',
  target_tide: '目標潮湧',
  actor_strengthened: '自身已強化',
  target_weakened: '目標已削弱',
  layer_threshold: '層數達標',
  consume_burn: '消耗燃燒',
  consume_poison: '消耗毒素',
  consume_tide: '消耗潮湧',
  consume_all_burn: '消耗全部燃燒',
  consume_all_poison: '消耗全部毒素',
  consume_all_tide: '消耗全部潮湧',
  consume_mixed: '消耗混合層數',
  on_hit: '命中',
  on_repeat_hit: '連續命中',
  on_bounce: '發生彈射',
  on_echo: '發生迴響',
  on_defeat: '擊敗目標',
  on_overkill: '造成 OVERKILL',
  previous_fire: '前招為火',
  previous_grass: '前招為草',
  previous_water: '前招為水',
  ally_same_element: '同屬隊友接力',
  team_three_elements: '三元素齊備',
  lone_target: '只剩一名敵人',
};

export function formatTriggerCue(
  triggerId: TriggerCondition,
  ready: boolean,
): { state: 'ready' | 'blocked'; text: string } {
  return ready
    ? { state: 'ready', text: `✓ 已觸發・${TRIGGER_CUE_LABELS[triggerId]}` }
    : { state: 'blocked', text: `○ 需要・${TRIGGER_CUE_LABELS[triggerId]}` };
}

export interface ComboCueStep {
  triggerId: TriggerCondition;
  readiness: 'ready' | 'pending-impact' | 'not-ready';
}

export function formatComboCue(steps: readonly ComboCueStep[]): {
  state: 'ready' | 'partial' | 'blocked';
  text: string;
} {
  if (steps.length === 0) return { state: 'ready', text: '必定施放' };
  if (steps.length === 1) {
    const step = steps[0]!;
    const ready = step.readiness !== 'not-ready';
    return {
      state: ready ? 'ready' : 'blocked',
      text: formatTriggerCue(step.triggerId, ready).text,
    };
  }
  const readyCount = steps.filter(({ readiness }) => readiness !== 'not-ready').length;
  const firstBlocked = steps.find(({ readiness }) => readiness === 'not-ready');
  return {
    state: readyCount === steps.length ? 'ready' : readyCount > 0 ? 'partial' : 'blocked',
    text: `連招 ${readyCount}/${steps.length}・${
      firstBlocked ? `缺${TRIGGER_CUE_LABELS[firstBlocked.triggerId]}` : '全部觸發'
    }`,
  };
}

export interface SkillOptionInput {
  id: string;
  name: string;
  element: GuildElement;
  triggerId: TriggerCondition;
  triggerName: string;
  triggerReady: boolean;
  missingCondition?: string;
  baseDamage: number;
  totalDamage: number;
  hitCount: number;
  chaseCount: number;
  statusName?: string;
  statusBefore?: number;
  statusAfter?: number;
  nextRelayNames: readonly string[];
}

export interface CommandLensInput {
  units: readonly BattleUnit[];
  selection: CommandSelection;
  skills: readonly SkillOptionInput[];
}

export interface SkillLensModel {
  id: string;
  name: string;
  element: GuildElement;
  selected: boolean;
  primaryValue: { label: '預計傷害'; value: number };
  hitValue: { label: '命中'; value: number };
  chaseValue: { label: '追擊'; value: number };
  condition: { label: string; state: 'ready' | 'blocked' };
  statusChange?: { label: string; before: number; after: number };
  nextRelayNames: readonly string[];
}

export interface CommandLensModel {
  actor?: BattleUnit;
  target?: BattleUnit;
  skills: readonly SkillLensModel[];
  selectedSkill?: SkillLensModel;
  instruction: string;
}

const livingUnit = (
  units: readonly BattleUnit[],
  id: string | undefined,
  side: BattleUnit['side'],
) => units.find((unit) => unit.id === id && unit.side === side && unit.currentHp > 0);

const targetUnit = (units: readonly BattleUnit[], id: string | undefined) =>
  units.find((unit) => unit.id === id && unit.side === 'enemies');

const toSkillModel = (skill: SkillOptionInput, selectedSkillId?: string): SkillLensModel => ({
  id: skill.id,
  name: skill.name,
  element: skill.element,
  selected: skill.id === selectedSkillId,
  primaryValue: { label: '預計傷害', value: Math.max(0, skill.totalDamage) },
  hitValue: { label: '命中', value: Math.max(0, skill.hitCount) },
  chaseValue: { label: '追擊', value: Math.max(0, skill.chaseCount) },
  condition: {
    label: skill.triggerReady
      ? skill.triggerName
      : (skill.missingCondition ?? `未滿足：${skill.triggerName}`),
    state: skill.triggerReady ? 'ready' : 'blocked',
  },
  ...(skill.statusName !== undefined &&
  skill.statusBefore !== undefined &&
  skill.statusAfter !== undefined
    ? {
        statusChange: {
          label: skill.statusName,
          before: skill.statusBefore,
          after: skill.statusAfter,
        },
      }
    : {}),
  nextRelayNames: skill.nextRelayNames,
});

export function createCommandLens(input: CommandLensInput): CommandLensModel {
  const actor = livingUnit(input.units, input.selection.actorId, 'heroes');
  const target = targetUnit(input.units, input.selection.targetId);
  const skills = input.skills.map((skill) => toSkillModel(skill, input.selection.skillId));
  const selectedSkill = skills.find(({ selected }) => selected);

  let instruction = '點戰場上的我方角色';
  if (actor && !selectedSkill) instruction = '選一個技能查看效果';
  if (actor && selectedSkill && !target) instruction = '點戰場上的敵人設定目標';
  if (actor && selectedSkill && target) instruction = '點敵人出招・再點技能也可出招';

  return {
    ...(actor ? { actor } : {}),
    ...(target ? { target } : {}),
    skills,
    ...(selectedSkill ? { selectedSkill } : {}),
    instruction,
  };
}

export type CommandIntent =
  | { kind: 'select-actor'; actorId: string }
  | { kind: 'tap-target'; targetId: string }
  | { kind: 'tap-skill'; skillId: string }
  | {
      kind: 'reorder';
      actorId: string;
      beforeActorId: string;
      currentOrder: readonly string[];
      actedIds: readonly string[];
    };

export interface CommandSelectionResult {
  selection: CommandSelection;
  execute?: BattleAction;
  nextOrder?: readonly string[];
}

const toAction = (selection: CommandSelection): BattleAction | undefined =>
  selection.actorId && selection.skillId && selection.targetId
    ? {
        actorId: selection.actorId,
        skillId: selection.skillId,
        targetId: selection.targetId,
      }
    : undefined;

export function reduceCommandSelection(
  selection: CommandSelection,
  intent: CommandIntent,
): CommandSelectionResult {
  if (intent.kind === 'select-actor') {
    return { selection: { actorId: intent.actorId } };
  }

  if (intent.kind === 'tap-target') {
    const nextSelection = { ...selection, targetId: intent.targetId };
    const execute = toAction(nextSelection);
    return { selection: nextSelection, ...(execute ? { execute } : {}) };
  }

  if (intent.kind === 'tap-skill') {
    const repeated = selection.skillId === intent.skillId;
    const nextSelection = { ...selection, skillId: intent.skillId };
    const execute = repeated ? toAction(nextSelection) : undefined;
    return { selection: nextSelection, ...(execute ? { execute } : {}) };
  }

  if (
    intent.actedIds.includes(intent.actorId) ||
    !intent.currentOrder.includes(intent.actorId) ||
    !intent.currentOrder.includes(intent.beforeActorId) ||
    intent.actorId === intent.beforeActorId
  ) {
    return { selection };
  }

  const nextOrder = intent.currentOrder.filter((id) => id !== intent.actorId);
  const insertionIndex = nextOrder.indexOf(intent.beforeActorId);
  nextOrder.splice(insertionIndex, 0, intent.actorId);
  return { selection, nextOrder };
}
