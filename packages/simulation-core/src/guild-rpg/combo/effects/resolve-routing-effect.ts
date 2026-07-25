import type { BattleUnit, ComboEvent } from '@expedition/shared-types';

import type { RuleEffectContext, RuleEffectResult } from '../rule-effect';

function targetHero(context: RuleEffectContext, units: readonly BattleUnit[]) {
  const heroes = units.filter((unit) => unit.side === 'heroes' && unit.currentHp > 0);
  if (context.rule.selector === 'lowest_hp') {
    return [...heroes].sort(
      (left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp,
    )[0];
  }
  return heroes[0];
}

export function resolveRoutingEffect(context: RuleEffectContext): RuleEffectResult {
  const runtime = context.battle.combo;
  if (!runtime) return { battle: context.battle, events: [] };
  const units = context.battle.units.map((unit) => ({ ...unit }));
  const hero = targetHero(context, units);
  const amount = Math.max(0, context.effect.amount ?? 0);
  let kind: ComboEvent['kind'] = 'rule_triggered';
  let message = `${context.rule.name}執行 ${context.effect.kind} 路由。`;

  if (context.effect.kind === 'heal' && hero) {
    const healed = Math.min(amount, hero.stats.hp - hero.currentHp);
    hero.currentHp += healed;
    kind = 'healing';
    message = `${context.rule.name}治療${hero.name} ${healed} 點。`;
  } else if (context.effect.kind === 'shield' && hero) {
    hero.guarding = true;
    kind = 'shield';
    message = `${context.rule.name}為${hero.name}建立護盾。`;
  }

  const event: ComboEvent = {
    id: runtime.events.length,
    causalId: `${context.parentCausalId}:${context.effect.kind}`,
    parentCausalId: context.parentCausalId,
    kind,
    message,
    ...(hero ? { targetId: hero.id } : {}),
    ...(amount > 0 ? { amount } : {}),
  };
  return {
    battle: {
      ...context.battle,
      units,
      combo: { ...runtime, events: [...runtime.events, event] },
    },
    events: [event],
  };
}
