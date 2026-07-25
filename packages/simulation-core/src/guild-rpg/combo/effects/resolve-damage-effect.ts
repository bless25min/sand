import type { BattleUnit, ComboEvent } from '@expedition/shared-types';

import { applyComboDamage } from '../apply-combo-damage';
import type { RuleEffectContext, RuleEffectResult } from '../rule-effect';

function livingEnemies(units: readonly BattleUnit[]) {
  return units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0);
}

function selectTargets(context: RuleEffectContext, units: readonly BattleUnit[]) {
  const enemies = livingEnemies(units);
  if (['all', 'adjacent', 'marked'].includes(context.rule.selector)) return enemies;
  if (context.rule.selector === 'lowest_hp') {
    return [...enemies].sort((left, right) => left.currentHp - right.currentHp).slice(0, 1);
  }
  if (context.rule.selector === 'highest_hp') {
    return [...enemies].sort((left, right) => right.currentHp - left.currentHp).slice(0, 1);
  }
  return [enemies.find((unit) => unit.id === context.battle.selectedTargetId) ?? enemies[0]].filter(
    (unit): unit is BattleUnit => Boolean(unit),
  );
}

export function resolveDamageEffect(context: RuleEffectContext): RuleEffectResult {
  const runtime = context.battle.combo;
  if (!runtime) return { battle: context.battle, events: [] };
  const amount = Math.max(0, context.effect.amount ?? 0);
  const units = context.battle.units.map((unit) => ({ ...unit }));
  const targets = selectTargets(context, units);
  const events: ComboEvent[] = [];
  let metrics = { ...runtime.metrics };

  if (targets.length === 0) {
    const outcome = applyComboDamage(undefined, amount, metrics, true);
    metrics = outcome.metrics;
    events.push({
      id: runtime.events.length,
      causalId: `${context.parentCausalId}:overflow`,
      parentCausalId: context.parentCausalId,
      kind: 'overkill',
      message: `${context.rule.name}轉為 Annihilation Overflow +${amount}。`,
      amount,
    });
  } else {
    targets.forEach((target, index) => {
      const current = units.find((unit) => unit.id === target.id)!;
      const outcome = applyComboDamage(current, amount, metrics, livingEnemies(units).length === 1);
      metrics = outcome.metrics;
      if (outcome.target) Object.assign(current, outcome.target);
      events.push({
        id: runtime.events.length + events.length,
        causalId: `${context.parentCausalId}:damage:${index}:${target.id}`,
        parentCausalId: context.parentCausalId,
        kind: 'damage',
        message: `${context.rule.name}對${target.name}造成 ${amount} 傷害。`,
        targetId: target.id,
        amount,
      });
    });
  }

  const enemiesAlive = livingEnemies(units).length > 0;
  return {
    battle: {
      ...context.battle,
      status: enemiesAlive ? context.battle.status : 'victory',
      selectedTargetId: livingEnemies(units)[0]?.id,
      units,
      combo: {
        ...runtime,
        phase: enemiesAlive ? runtime.phase : 'complete',
        events: [...runtime.events, ...events],
        metrics,
      },
    },
    events,
  };
}
