import type {
  BattleAction,
  BattleUnit,
  GuildBattleEvent,
  GuildBattleState,
  GuildSkillDefinition,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';

function concludeBattle(battle: GuildBattleState): GuildBattleState {
  const heroesAlive = battle.units.some((unit) => unit.side === 'heroes' && unit.currentHp > 0);
  const enemiesAlive = battle.units.some((unit) => unit.side === 'enemies' && unit.currentHp > 0);
  if (heroesAlive && enemiesAlive) return battle;

  const status = heroesAlive ? 'victory' : 'defeat';
  const event: GuildBattleEvent = {
    id: battle.sequence,
    kind: status,
    message: status === 'victory' ? '遠征勝利！' : '隊伍失去戰鬥能力。',
  };
  return {
    ...battle,
    status,
    pendingLeaderId: undefined,
    sequence: battle.sequence + 1,
    events: [...battle.events, event],
  };
}

function validateTarget(actor: BattleUnit, target: BattleUnit, skill: GuildSkillDefinition) {
  if (target.currentHp <= 0) throw new Error(`Target is defeated: ${target.id}`);
  if (skill.target === 'enemy' && target.side === actor.side)
    throw new Error('Expected enemy target');
  if (skill.target === 'ally' && target.side !== actor.side)
    throw new Error('Expected ally target');
  if (skill.target === 'self' && target.id !== actor.id) throw new Error('Expected self target');
}

export function resolveGuildBattleAction(
  battle: GuildBattleState,
  action: BattleAction,
  skills: Readonly<Record<string, GuildSkillDefinition>>,
  random: RandomSource,
): GuildBattleState {
  if (battle.status !== 'active') return battle;
  const skill = skills[action.skillId];
  const actor = battle.units.find((unit) => unit.id === action.actorId);
  const target = battle.units.find((unit) => unit.id === action.targetId);
  if (!skill || !actor || !target) throw new Error('Invalid battle action');
  if (actor.currentHp <= 0 || actor.gauge < 100) throw new Error('Actor is not ready');
  if (!actor.skillIds.includes(skill.id)) throw new Error(`Skill unavailable: ${skill.id}`);
  validateTarget(actor, target, skill);

  let amount = 0;
  let eventKind: GuildBattleEvent['kind'];
  let message: string;
  const updated = battle.units.map((unit) =>
    unit.id === actor.id ? { ...unit, gauge: 0, guarding: false } : { ...unit },
  );
  const nextActor = updated.find((unit) => unit.id === actor.id)!;
  const nextTarget = updated.find((unit) => unit.id === target.id)!;

  if (skill.kind === 'attack') {
    const variance = random.nextInt(-2, 2);
    const mitigation = nextTarget.stats.defense * (nextTarget.guarding ? 0.8 : 0.5);
    amount = Math.max(1, Math.round(nextActor.stats.attack * skill.power - mitigation + variance));
    nextTarget.currentHp = Math.max(0, nextTarget.currentHp - amount);
    if (nextActor.side === 'heroes') nextActor.threat += Math.round(amount * skill.threat);
    eventKind = 'damage';
    message = `${nextActor.name}施放${skill.name}，對${nextTarget.name}造成 ${amount} 傷害。`;
  } else if (skill.kind === 'heal') {
    amount = Math.max(1, Math.round(nextActor.stats.healing * skill.power + random.nextInt(0, 3)));
    amount = Math.min(amount, nextTarget.stats.hp - nextTarget.currentHp);
    nextTarget.currentHp += amount;
    nextActor.threat += Math.round(amount * skill.threat);
    eventKind = 'healing';
    message = `${nextActor.name}施放${skill.name}，為${nextTarget.name}回復 ${amount} 生命。`;
  } else {
    nextActor.guarding = true;
    nextActor.threat += skill.threat;
    eventKind = 'guard';
    message = `${nextActor.name}展開${skill.name}，吸引敵軍火力。`;
  }

  const event: GuildBattleEvent = {
    id: battle.sequence,
    kind: eventKind,
    message,
    actorId: actor.id,
    targetId: target.id,
    amount,
  };
  let next: GuildBattleState = {
    ...battle,
    units: updated,
    selectedTargetId:
      nextTarget.side === 'enemies' && nextTarget.currentHp === 0
        ? updated.find((unit) => unit.side === 'enemies' && unit.currentHp > 0)?.id
        : battle.selectedTargetId,
    pendingLeaderId: undefined,
    sequence: battle.sequence + 1,
    events: [...battle.events, event].slice(-18),
  };

  if (nextTarget.currentHp === 0) {
    const defeatedEvent: GuildBattleEvent = {
      id: next.sequence,
      kind: 'unit_defeated',
      message: `${nextTarget.name}被擊倒。`,
      targetId: nextTarget.id,
    };
    next = {
      ...next,
      sequence: next.sequence + 1,
      events: [...next.events, defeatedEvent].slice(-18),
    };
  }

  return concludeBattle(next);
}

export function submitLeaderAction(
  battle: GuildBattleState,
  action: BattleAction,
  skills: Readonly<Record<string, GuildSkillDefinition>>,
  random: RandomSource,
) {
  if (battle.pendingLeaderId !== action.actorId) throw new Error('Leader is not awaiting an order');
  return resolveGuildBattleAction(battle, action, skills, random);
}
