import type {
  GuildBattleEvent,
  GuildBattleState,
  GuildElementDefinition,
  GuildSkillItem,
  SkillFormDefinition,
  SkillSpecializationDefinition,
  TriggerConditionDefinition,
} from '@expedition/shared-types';

import { isExecutionWindow } from '../battle/is-execution-window';
import { completeTurn } from '../round-order/complete-turn';
import { previewTriggerReadiness, type TriggerReadiness } from './preview-trigger-readiness';
import { resolveDeliveryPassive } from './resolve-delivery-passive';
import { resolveSkillComponent } from './resolve-skill-component';

const impactTriggerReady = (
  triggerId: GuildSkillItem['components'][number]['triggerId'],
  events: readonly Omit<GuildBattleEvent, 'id'>[],
) => {
  const damage = events.filter(({ kind }) => kind === 'damage' || kind === 'reaction');
  if (triggerId === 'after_skill' || triggerId === 'on_hit') return damage.length > 0;
  if (triggerId === 'on_repeat_hit') return damage.length > 1;
  if (triggerId === 'on_bounce') return events.some(({ kind }) => kind === 'bounce');
  if (triggerId === 'on_echo') return events.some(({ kind }) => kind === 'echo');
  if (triggerId === 'on_defeat') return events.some(({ kind }) => kind === 'unit_defeated');
  if (triggerId === 'on_overkill') return events.some(({ kind }) => kind === 'overkill');
  return false;
};

const SELF_CONTAINED_TRIGGERS = new Set<GuildSkillItem['components'][number]['triggerId']>([
  'battle_open',
  'round_open',
  'first_actor',
  'final_actor',
  'after_skill',
  'on_hit',
  'on_repeat_hit',
  'on_bounce',
  'on_echo',
  'on_defeat',
  'on_overkill',
  'lone_target',
]);

export interface SkillEngineContent {
  skills: Readonly<Record<string, GuildSkillItem>>;
  elements: readonly GuildElementDefinition[];
  specializations: readonly SkillSpecializationDefinition[];
  triggers: readonly TriggerConditionDefinition[];
  forms: readonly SkillFormDefinition[];
}

export interface ResolveSkillInput {
  battle: GuildBattleState;
  actorId: string;
  skillId: string;
  targetId: string;
  content: SkillEngineContent;
}

export function resolveSkill(input: ResolveSkillInput): {
  battle: GuildBattleState;
  events: readonly GuildBattleEvent[];
} {
  if (input.battle.status !== 'active') throw new Error('Battle is not active.');
  const skill = input.content.skills[input.skillId];
  if (!skill) throw new Error(`Unknown skill: ${input.skillId}`);
  const actor = input.battle.units.find(
    (unit) => unit.id === input.actorId && unit.side === 'heroes',
  );
  if (!actor || actor.currentHp <= 0) throw new Error(`Actor cannot act: ${input.actorId}`);
  if (input.battle.roundOrder?.activeAdventurerId !== input.actorId) {
    throw new Error(`It is not ${input.actorId}'s turn.`);
  }

  const openingComponent = skill.components[0]!;
  const closingComponent = skill.components.at(-1)!;
  const executionWindow = isExecutionWindow(input.battle);
  const drafts: Omit<GuildBattleEvent, 'id'>[] = [
    {
      kind: 'skill_cast',
      message: executionWindow
        ? `${actor.name}選定「${skill.name}」作為第六棒處刑。`
        : `${actor.name}立即施放「${skill.name}」。`,
      actorId: actor.id,
      targetId: input.targetId,
      skillId: skill.id,
      element: openingComponent.element,
      specializationId: openingComponent.specializationId,
      triggerId: openingComponent.triggerId,
    },
  ];
  const roundIndex = input.battle.roundIndex ?? 1;
  const history = [...(input.battle.skillHistory ?? [])];
  const relayIndex = (input.battle.roundOrder?.actedIds.length ?? 0) + 1;

  const readiness = new Map<string, TriggerReadiness>(
    previewTriggerReadiness({
      battle: input.battle,
      actorId: actor.id,
      targetId: input.targetId,
      skill,
    }).map((entry) => [entry.componentId, entry.readiness]),
  );
  let units = input.battle.units.map((unit) => ({ ...unit }));
  let componentBattle = input.battle;
  for (const [componentIndex, component] of skill.components.entries()) {
    const componentReadiness = readiness.get(component.id) ?? 'not-ready';
    const priorComponentEvents = drafts.filter(({ componentId }) => componentId !== undefined);
    const pendingReady =
      componentReadiness === 'pending-impact' &&
      impactTriggerReady(component.triggerId, priorComponentEvents);
    if (componentIndex > 0 && componentReadiness !== 'ready' && !pendingReady) continue;
    const triggerReady =
      componentReadiness === 'ready'
        ? true
        : componentReadiness === 'not-ready'
          ? false
          : pendingReady
            ? true
            : undefined;
    const result = resolveSkillComponent({
      battle: componentBattle,
      units,
      actorId: actor.id,
      preferredTargetId: input.targetId,
      component,
      isOpeningComponent: componentIndex === 0,
      ...(triggerReady === undefined ? {} : { triggerReady }),
    });
    units = result.units;
    drafts.push(...result.events);
    history.push({
      actorId: actor.id,
      skillId: skill.id,
      element: component.element,
      roundIndex,
    });
    componentBattle = { ...componentBattle, units, skillHistory: history };
  }

  const passive = resolveDeliveryPassive({
    battle: input.battle,
    units,
    actorId: actor.id,
    targetId: input.targetId,
    element: closingComponent.element,
    relayIndex,
  });
  units = [...passive.units];
  drafts.push(...passive.events);

  const priorCausalDepth = input.battle.events
    .filter(({ roundIndex: eventRound }) => eventRound === roundIndex)
    .reduce((maximum, { causalDepth = 0 }) => Math.max(maximum, causalDepth), 0);
  const readsPriorCondition = skill.components.some(
    (component) =>
      readiness.get(component.id) === 'ready' && !SELF_CONTAINED_TRIGGERS.has(component.triggerId),
  );
  const continuesPriorCause =
    priorCausalDepth > 0 &&
    (readsPriorCondition ||
      (actor.strengthened ?? 0) > 0 ||
      drafts.some(({ kind }) => kind === 'reaction'));
  const causalDepth = continuesPriorCause ? Math.min(6, priorCausalDepth + 1) : 1;
  const roundCausalDepth = Math.max(priorCausalDepth, causalDepth);
  if (causalDepth > 1) {
    drafts.splice(1, 0, {
      kind: 'relay',
      message: `因果接力提升至第 ${causalDepth} 層。`,
      actorId: actor.id,
      amount: causalDepth,
      skillId: skill.id,
      causalDepth,
    });
  }

  if (relayIndex === input.battle.roundOrder?.currentOrder.length) {
    const priorRoundDamage = input.battle.events
      .filter(
        ({ kind, roundIndex: eventRound }) =>
          eventRound === roundIndex && (kind === 'damage' || kind === 'reaction'),
      )
      .reduce((sum, event) => sum + (event.amount ?? 0), 0);
    const resolvedDamage = drafts
      .filter(({ kind }) => kind === 'damage' || kind === 'reaction')
      .reduce((sum, event) => sum + (event.amount ?? 0), 0);
    const roundDamage = priorRoundDamage + resolvedDamage;
    drafts.push({
      kind: 'finisher',
      message: `第六棒終結：本輪因果鏈累積 ${roundDamage} 點傷害。`,
      actorId: actor.id,
      targetId: input.targetId,
      amount: roundDamage,
      skillId: skill.id,
      element: closingComponent.element,
      specializationId: closingComponent.specializationId,
      triggerId: closingComponent.triggerId,
      causalDepth: roundCausalDepth,
    });
  }

  const roundOrder = completeTurn(input.battle.roundOrder, actor.id);
  const startedNewRound = roundOrder.actedIds.length === 0;
  const livingEnemy = units.find((unit) => unit.side === 'enemies' && unit.currentHp > 0);
  const victory = !livingEnemy && startedNewRound;
  if (victory) {
    drafts.push({
      kind: 'victory',
      message: '六人接力結算完成，敵軍全滅。',
      causalDepth: roundCausalDepth,
    });
  }
  const firstId = input.battle.events.length;
  const events = drafts.map((event, index) => ({
    ...event,
    id: firstId + index,
    roundIndex,
    causalDepth: event.causalDepth ?? causalDepth,
  }));
  return {
    battle: {
      ...input.battle,
      units,
      status: victory ? 'victory' : 'active',
      sequence: input.battle.sequence + events.length,
      events: [...input.battle.events, ...events],
      roundOrder,
      skillHistory: history,
      roundIndex: startedNewRound ? roundIndex + 1 : roundIndex,
      selectedTargetId: livingEnemy?.id ?? input.targetId,
    },
    events,
  };
}
