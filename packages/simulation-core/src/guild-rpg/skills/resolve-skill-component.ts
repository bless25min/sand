import type {
  BattleUnit,
  GuildBattleEvent,
  GuildBattleState,
  SkillComponent,
  StatusLayers,
} from '@expedition/shared-types';

import { resolveElementReaction } from './resolve-element-reaction';
import { resolveTargetRoute } from './resolve-target-route';
import { triggerMatches } from './resolve-trigger';

type EventDraft = Omit<GuildBattleEvent, 'id'>;

const hitCount = (component: SkillComponent, enemyCount: number) => {
  if (component.specializationId === 'multistrike' || component.specializationId === 'chain') {
    return component.repeatCount;
  }
  if (component.specializationId === 'blast') return enemyCount > 1 ? enemyCount : 2;
  return 1;
};

const consumedLayers = (layers: StatusLayers, component: SkillComponent) => {
  if (!component.triggerId.startsWith('consume')) return { amount: 0, layers };
  const next = { ...layers };
  const consume = (key: keyof StatusLayers) => {
    const value = next[key];
    next[key] = component.triggerId.startsWith('consume_all') ? 0 : Math.max(0, value - 1);
    return component.triggerId.startsWith('consume_all') ? value : Math.min(1, value);
  };
  if (component.triggerId.endsWith('burn')) return { amount: consume('burn'), layers: next };
  if (component.triggerId.endsWith('poison')) return { amount: consume('poison'), layers: next };
  if (component.triggerId.endsWith('tide')) return { amount: consume('tide'), layers: next };
  const amount = consume('burn') + consume('poison') + consume('tide');
  return { amount, layers: next };
};

const replaceUnit = (units: BattleUnit[], unit: BattleUnit) => {
  const index = units.findIndex(({ id }) => id === unit.id);
  if (index >= 0) units[index] = unit;
};

export function resolveSkillComponent(input: {
  battle: GuildBattleState;
  units: readonly BattleUnit[];
  actorId: string;
  preferredTargetId: string;
  component: SkillComponent;
}): { units: BattleUnit[]; events: EventDraft[] } {
  let units = input.units.map((unit) => ({ ...unit }));
  const events: EventDraft[] = [];
  const actor = units.find(({ id }) => id === input.actorId);
  if (!actor) throw new Error(`Unknown skill actor: ${input.actorId}`);
  const coreStrength = (coreId: string) =>
    actor.equippedCores
      ?.filter(({ id }) => id === coreId)
      .reduce((sum, { strength }) => sum + strength, 0) ?? 0;
  const venomDepth = input.component.element === 'grass' ? coreStrength('venom-depth') : 0;
  const component =
    venomDepth > 0
      ? {
          ...input.component,
          layerStrength: input.component.layerStrength + venomDepth,
        }
      : input.component;
  let target = units.find(({ id }) => id === input.preferredTargetId);
  if (!target || target.side !== 'enemies')
    throw new Error(`Unknown enemy target: ${input.preferredTargetId}`);
  const initialLayers = target.statusLayers ?? { burn: 0, poison: 0, tide: 0 };

  const applyCoreDamage = (coreName: string, targetIds: readonly string[], amount: number) => {
    events.push({
      kind: 'core_triggered',
      message: `${coreName}建立 ${targetIds.length} 次獨立傷害事件。`,
      actorId: actor.id,
      ...(targetIds[0] ? { targetId: targetIds[0] } : {}),
      amount,
      componentId: input.component.id,
      element: input.component.element,
      specializationId: input.component.specializationId,
      triggerId: input.component.triggerId,
    });
    for (const targetId of targetIds) {
      const coreTarget = units.find(({ id }) => id === targetId);
      if (!coreTarget) continue;
      if (coreTarget.currentHp <= 0) {
        events.push({
          kind: 'overkill',
          message: `${coreName}迴響轉為 OVERKILL +${amount}。`,
          actorId: actor.id,
          targetId,
          amount,
        });
        continue;
      }
      const nextHp = Math.max(0, coreTarget.currentHp - amount);
      const overflow = Math.max(0, amount - coreTarget.currentHp);
      replaceUnit(units, { ...coreTarget, currentHp: nextHp });
      events.push({
        kind: 'damage',
        message: `${coreName}對${coreTarget.name}造成 ${amount} 點獨立傷害。`,
        actorId: actor.id,
        targetId,
        amount,
        componentId: input.component.id,
        element: input.component.element,
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
      if (nextHp === 0) {
        events.push({
          kind: 'unit_defeated',
          message: `${coreTarget.name}被${coreName}擊破。`,
          actorId: actor.id,
          targetId,
        });
      }
      if (overflow > 0) {
        events.push({
          kind: 'overkill',
          message: `${coreName} OVERKILL +${overflow}。`,
          actorId: actor.id,
          targetId,
          amount: overflow,
        });
      }
    }
  };

  const consumed = consumedLayers(
    target.statusLayers ?? { burn: 0, poison: 0, tide: 0 },
    input.component,
  );
  replaceUnit(units, { ...target, statusLayers: consumed.layers });
  if (consumed.amount > 0) {
    events.push({
      kind: 'triggered',
      message: `消耗 ${consumed.amount} 層狀態，建立 ${consumed.amount} 次獨立爆發。`,
      actorId: actor.id,
      targetId: target.id,
      amount: consumed.amount * input.component.triggerAddition,
      componentId: input.component.id,
      element: input.component.element,
      specializationId: input.component.specializationId,
      triggerId: input.component.triggerId,
    });
    for (let layerIndex = 0; layerIndex < consumed.amount; layerIndex += 1) {
      const burstTarget = units.find(({ id }) => id === target!.id)!;
      if (burstTarget.currentHp <= 0) {
        events.push({
          kind: 'overkill',
          message: `消耗爆發 ${layerIndex + 1}/${consumed.amount} 轉為 OVERKILL +${input.component.triggerAddition}。`,
          actorId: actor.id,
          targetId: burstTarget.id,
          amount: input.component.triggerAddition,
        });
        continue;
      }
      const nextHp = Math.max(0, burstTarget.currentHp - input.component.triggerAddition);
      replaceUnit(units, { ...burstTarget, currentHp: nextHp });
      events.push({
        kind: 'damage',
        message: `第 ${layerIndex + 1} 層消耗爆發造成 ${input.component.triggerAddition} 點傷害。`,
        actorId: actor.id,
        targetId: burstTarget.id,
        amount: input.component.triggerAddition,
        componentId: input.component.id,
        element: input.component.element,
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
    }
  }

  if (input.component.specializationId === 'weaken') {
    target = units.find(({ id }) => id === target!.id)!;
    replaceUnit(units, {
      ...target,
      defenseReduction: (target.defenseReduction ?? 0) + input.component.layerStrength,
    });
    events.push({
      kind: 'weaken',
      message: `${target.name}防禦削弱 ${input.component.layerStrength} 點。`,
      actorId: actor.id,
      targetId: target.id,
      amount: input.component.layerStrength,
      componentId: input.component.id,
      element: input.component.element,
      specializationId: 'weaken',
      triggerId: input.component.triggerId,
    });
  }

  if (input.component.specializationId === 'empower') {
    const order = input.battle.roundOrder?.currentOrder ?? [];
    const actorIndex = order.indexOf(actor.id);
    const nextHeroId = order
      .slice(actorIndex + 1)
      .find((id) => units.some((unit) => unit.id === id && unit.currentHp > 0));
    const nextHero = units.find(({ id }) => id === nextHeroId);
    if (nextHero) {
      replaceUnit(units, {
        ...nextHero,
        strengthened: (nextHero.strengthened ?? 0) + input.component.layerStrength,
      });
      events.push({
        kind: 'strengthen',
        message: `${nextHero.name}承接 ${input.component.layerStrength} 點接力強化。`,
        actorId: actor.id,
        targetId: nextHero.id,
        amount: input.component.layerStrength,
        componentId: input.component.id,
        element: input.component.element,
        specializationId: 'empower',
        triggerId: input.component.triggerId,
      });
    }
  }

  const beforeReactionHp = target.currentHp;
  const reaction = resolveElementReaction({
    units,
    actorId: actor.id,
    targetId: target.id,
    component,
  });
  units = reaction.units;
  events.push(...reaction.events);
  if (venomDepth > 0) {
    events.push({
      kind: 'core_triggered',
      message: `深毒核心讓毒素疊層再增加 ${venomDepth} 層。`,
      actorId: actor.id,
      targetId: target.id,
      amount: venomDepth,
      componentId: input.component.id,
      element: input.component.element,
      specializationId: input.component.specializationId,
      triggerId: input.component.triggerId,
    });
  }
  target = units.find(({ id }) => id === target!.id)!;
  if (beforeReactionHp > 0 && target.currentHp === 0) {
    events.push({
      kind: 'unit_defeated',
      message: `${target.name}被屬性反應擊破。`,
      targetId: target.id,
    });
  }

  const moltenArmor = input.component.element === 'fire' ? coreStrength('molten-armor') : 0;
  if (moltenArmor > 0 && target.currentHp > 0) {
    const moltenTarget = units.find(({ id }) => id === target!.id)!;
    replaceUnit(units, {
      ...moltenTarget,
      defenseReduction: (moltenTarget.defenseReduction ?? 0) + moltenArmor,
    });
    events.push({
      kind: 'core_triggered',
      message: `熔甲核心削弱${moltenTarget.name} ${moltenArmor} 點防禦。`,
      actorId: actor.id,
      targetId: moltenTarget.id,
      amount: moltenArmor,
      componentId: input.component.id,
      element: 'fire',
      specializationId: input.component.specializationId,
      triggerId: input.component.triggerId,
    });
  }

  const livingEnemyIds = units
    .filter((unit) => unit.side === 'enemies' && unit.currentHp > 0)
    .map(({ id }) => id);
  const burnBurst = coreStrength('burn-burst');
  if (burnBurst > 0 && consumed.amount > 0 && input.component.triggerId.includes('burn')) {
    const routes =
      livingEnemyIds.length === 1 ? [livingEnemyIds[0]!, livingEnemyIds[0]!] : livingEnemyIds;
    applyCoreDamage('焚爆核心', routes, burnBurst + consumed.amount);
  }
  const toxicMist = coreStrength('toxic-mist');
  if (toxicMist > 0 && input.component.element === 'grass' && initialLayers.burn > 0) {
    const routes =
      livingEnemyIds.length === 1 ? [livingEnemyIds[0]!, livingEnemyIds[0]!] : livingEnemyIds;
    applyCoreDamage('毒霧核心', routes, toxicMist + component.layerStrength);
  }
  const tideRelay = coreStrength('tide-relay');
  if (tideRelay > 0 && input.component.element === 'water') {
    const order = input.battle.roundOrder;
    const nextHeroId = order?.currentOrder.find(
      (id) => id !== actor.id && !order.actedIds.includes(id),
    );
    const nextHero = units.find(
      ({ id, side, currentHp }) => id === nextHeroId && side === 'heroes' && currentHp > 0,
    );
    if (nextHero) {
      replaceUnit(units, {
        ...nextHero,
        strengthened: (nextHero.strengthened ?? 0) + tideRelay,
      });
      events.push({
        kind: 'core_triggered',
        message: `潮湧接力核心讓${nextHero.name}獲得 ${tideRelay} 點強化。`,
        actorId: actor.id,
        targetId: nextHero.id,
        amount: tideRelay,
        componentId: input.component.id,
        element: 'water',
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
    }
  }
  const healingEcho = coreStrength('healing-echo');
  if (healingEcho > 0 && consumed.amount > 0 && input.component.triggerId.includes('tide')) {
    const ally = units
      .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
      .sort((left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp)[0];
    if (ally) {
      const amount = Math.min(healingEcho + consumed.amount, ally.stats.hp - ally.currentHp);
      replaceUnit(units, { ...ally, currentHp: ally.currentHp + amount });
      events.push({
        kind: 'core_triggered',
        message: `治癒迴響核心治療${ally.name} ${amount} 點。`,
        actorId: actor.id,
        targetId: ally.id,
        amount,
        componentId: input.component.id,
        element: 'water',
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
    }
  }
  const relayPrism = coreStrength('relay-prism');
  const roundHistory = (input.battle.skillHistory ?? []).filter(
    ({ roundIndex }) => roundIndex === (input.battle.roundIndex ?? 1),
  );
  if (
    relayPrism > 0 &&
    new Set([...roundHistory.map(({ element }) => element), input.component.element]).size === 3
  ) {
    const prismTarget = units.find(({ id, currentHp }) => id === target!.id && currentHp > 0);
    if (prismTarget) applyCoreDamage('三相稜鏡核心', [prismTarget.id], relayPrism);
  }

  let previousTargetId: string | undefined;
  const chain =
    input.component.specializationId === 'chain' ||
    input.component.specializationId === 'blast' ||
    (coreStrength('lone-king-loop') > 0 &&
      units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0).length === 1);
  const count = hitCount(
    component,
    units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0).length,
  );
  for (let hitIndex = 0; hitIndex < count; hitIndex += 1) {
    const route = resolveTargetRoute(units, input.preferredTargetId, previousTargetId, chain);
    if (!route.target) {
      const amount = actor.stats.attack + input.component.power;
      events.push({
        kind: 'overkill',
        message: `後續第 ${hitIndex + 1} 擊轉為 OVERKILL +${amount}。`,
        actorId: actor.id,
        amount,
        componentId: input.component.id,
        element: input.component.element,
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
      continue;
    }
    if (route.bounced)
      events.push({
        kind: 'bounce',
        message: `連鎖彈射至${route.target.name}。`,
        actorId: actor.id,
        targetId: route.target.id,
        componentId: input.component.id,
        element: input.component.element,
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
    if (route.echoed)
      events.push({
        kind: 'echo',
        message: `孤王迴響回到${route.target.name}。`,
        actorId: actor.id,
        targetId: route.target.id,
        componentId: input.component.id,
        element: input.component.element,
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });

    const liveTarget = units.find(({ id }) => id === route.target!.id)!;
    const reduction = Math.max(0, liveTarget.stats.defense - (liveTarget.defenseReduction ?? 0));
    const amount = Math.max(
      0,
      actor.stats.attack + input.component.power + (actor.strengthened ?? 0) - reduction,
    );
    const overflow = Math.max(0, amount - liveTarget.currentHp);
    const nextHp = Math.max(0, liveTarget.currentHp - amount);
    replaceUnit(units, { ...liveTarget, currentHp: nextHp });
    events.push({
      kind: 'damage',
      message: `${actor.name}第 ${hitIndex + 1} 擊對${liveTarget.name}造成 ${amount} 點傷害。`,
      actorId: actor.id,
      targetId: liveTarget.id,
      amount,
      componentId: input.component.id,
      element: input.component.element,
      specializationId: input.component.specializationId,
      triggerId: input.component.triggerId,
    });
    if (nextHp === 0 && liveTarget.currentHp > 0) {
      events.push({
        kind: 'unit_defeated',
        message: `${liveTarget.name}被擊破。`,
        actorId: actor.id,
        targetId: liveTarget.id,
      });
    }
    if (overflow > 0) {
      events.push({
        kind: 'overkill',
        message: `OVERKILL +${overflow}`,
        actorId: actor.id,
        targetId: liveTarget.id,
        amount: overflow,
      });
    }

    const triggerContext = {
      ...input.battle,
      units,
    };
    const matched =
      !input.component.triggerId.startsWith('consume') &&
      triggerMatches(input.component.triggerId, {
        battle: triggerContext,
        actorId: actor.id,
        targetId: liveTarget.id,
        element: input.component.element,
        hitIndex,
        isBounce: route.bounced,
        isEcho: route.echoed,
        defeated: liveTarget.currentHp > 0 && nextHp === 0,
        overkill: overflow,
      });
    if (matched) {
      events.push({
        kind: 'triggered',
        message: `${input.component.triggerId} 建立獨立追加事件 +${input.component.triggerAddition}。`,
        actorId: actor.id,
        targetId: liveTarget.id,
        amount: input.component.triggerAddition,
        componentId: input.component.id,
        element: input.component.element,
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
      const triggerTarget = units.find(({ id }) => id === liveTarget.id)!;
      if (triggerTarget.currentHp > 0) {
        const triggerHp = Math.max(0, triggerTarget.currentHp - input.component.triggerAddition);
        const triggerOverflow = Math.max(
          0,
          input.component.triggerAddition - triggerTarget.currentHp,
        );
        replaceUnit(units, { ...triggerTarget, currentHp: triggerHp });
        events.push({
          kind: 'damage',
          message: `${input.component.triggerId} 對${triggerTarget.name}追加 ${input.component.triggerAddition} 點傷害。`,
          actorId: actor.id,
          targetId: triggerTarget.id,
          amount: input.component.triggerAddition,
          componentId: input.component.id,
          element: input.component.element,
          specializationId: input.component.specializationId,
          triggerId: input.component.triggerId,
        });
        if (triggerHp === 0) {
          events.push({
            kind: 'unit_defeated',
            message: `${triggerTarget.name}被觸發追擊擊破。`,
            actorId: actor.id,
            targetId: triggerTarget.id,
          });
        }
        if (triggerOverflow > 0) {
          events.push({
            kind: 'overkill',
            message: `觸發 OVERKILL +${triggerOverflow}`,
            actorId: actor.id,
            targetId: triggerTarget.id,
            amount: triggerOverflow,
          });
        }
      } else {
        events.push({
          kind: 'overkill',
          message: `觸發追擊轉為 OVERKILL +${input.component.triggerAddition}`,
          actorId: actor.id,
          targetId: triggerTarget.id,
          amount: input.component.triggerAddition,
          componentId: input.component.id,
          element: input.component.element,
          specializationId: input.component.specializationId,
          triggerId: input.component.triggerId,
        });
      }
    }
    previousTargetId = liveTarget.id;
  }
  return { units, events };
}
