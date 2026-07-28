import type {
  GuildBattleEvent,
  GuildBattleState,
  GuildElementDefinition,
  GuildSkillItem,
  SkillFormDefinition,
  SkillSpecializationDefinition,
  TriggerConditionDefinition,
} from '@expedition/shared-types';

import { completeTurn } from '../round-order/complete-turn';
import { resolveDeliveryPassive } from './resolve-delivery-passive';
import { resolveSkillComponent } from './resolve-skill-component';

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
  const drafts: Omit<GuildBattleEvent, 'id'>[] = [
    {
      kind: 'skill_cast',
      message: `${actor.name}立即施放「${skill.name}」。`,
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
  if (relayIndex > 1) {
    drafts.push({
      kind: 'relay',
      message: `RELAY ×${relayIndex}：第 ${relayIndex} 棒效果超越前一擊。`,
      actorId: actor.id,
      amount: relayIndex,
      skillId: skill.id,
    });
  }

  let units = input.battle.units.map((unit) => ({ ...unit }));
  let componentBattle = input.battle;
  for (const component of skill.components) {
    const result = resolveSkillComponent({
      battle: componentBattle,
      units,
      actorId: actor.id,
      preferredTargetId: input.targetId,
      component,
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

  let relayDamage = 0;
  for (let echoIndex = 0; echoIndex < relayIndex - 1; echoIndex += 1) {
    const target =
      units.find(
        (unit) => unit.id === input.targetId && unit.side === 'enemies' && unit.currentHp > 0,
      ) ?? units.find((unit) => unit.side === 'enemies' && unit.currentHp > 0);
    const amount = relayIndex + echoIndex;
    relayDamage += amount;
    if (!target) {
      drafts.push({
        kind: 'overkill',
        message: `接力餘震 ${echoIndex + 1}/${relayIndex - 1} 轉為 OVERKILL +${amount}。`,
        actorId: actor.id,
        amount,
        skillId: skill.id,
      });
      continue;
    }
    const nextHp = Math.max(0, target.currentHp - amount);
    const overflow = Math.max(0, amount - target.currentHp);
    units = units.map((unit) => (unit.id === target.id ? { ...unit, currentHp: nextHp } : unit));
    drafts.push({
      kind: 'damage',
      message: `接力餘震 ${echoIndex + 1}/${relayIndex - 1} 對${target.name}追加 ${amount} 點傷害。`,
      actorId: actor.id,
      targetId: target.id,
      amount,
      skillId: skill.id,
    });
    if (nextHp === 0) {
      drafts.push({
        kind: 'unit_defeated',
        message: `${target.name}被接力餘震擊破。`,
        actorId: actor.id,
        targetId: target.id,
      });
    }
    if (overflow > 0) {
      drafts.push({
        kind: 'overkill',
        message: `接力餘震 OVERKILL +${overflow}。`,
        actorId: actor.id,
        targetId: target.id,
        amount: overflow,
      });
    }
  }
  if (relayIndex === input.battle.roundOrder?.currentOrder.length) {
    drafts.push({
      kind: 'finisher',
      message: `第六棒終結：五次接力餘震完成，累積追加 ${relayDamage} 點。`,
      actorId: actor.id,
      targetId: input.targetId,
      amount: relayDamage,
      skillId: skill.id,
      element: closingComponent.element,
      specializationId: closingComponent.specializationId,
      triggerId: closingComponent.triggerId,
    });
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

  const roundOrder = completeTurn(input.battle.roundOrder, actor.id);
  const startedNewRound = roundOrder.actedIds.length === 0;
  const livingEnemy = units.find((unit) => unit.side === 'enemies' && unit.currentHp > 0);
  const victory = !livingEnemy && startedNewRound;
  if (victory) {
    drafts.push({ kind: 'victory', message: '六人接力結算完成，敵軍全滅。' });
  }
  const firstId = input.battle.events.length;
  const events = drafts.map((event, index) => ({ ...event, id: firstId + index }));
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
