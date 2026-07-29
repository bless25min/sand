import type {
  BattleUnit,
  GuildBattleEvent,
  GuildBattleState,
  GuildElement,
  SkillComponent,
  StatusLayers,
  TriggerCondition,
} from '@expedition/shared-types';

import { resolveTargetRoute } from './resolve-target-route';
import { matchesHuntWeakness, resolveGuardedTargetId } from './resolve-hunt-mechanics';

type EventDraft = Omit<GuildBattleEvent, 'id'>;
type ResolverInput = {
  battle: GuildBattleState;
  units: readonly BattleUnit[];
  actorId: string;
  preferredTargetId: string;
  component: SkillComponent;
  isOpeningComponent: boolean;
  triggerReady?: boolean;
};

const layerKey: Readonly<Record<GuildElement, keyof StatusLayers>> = {
  fire: 'burn',
  grass: 'poison',
  water: 'tide',
};

const emptyLayers = (): StatusLayers => ({ burn: 0, poison: 0, tide: 0 });
const bounded = (value: number) => Math.max(1, Math.min(5, Math.trunc(value)));

const replaceUnit = (units: BattleUnit[], unit: BattleUnit) => {
  const index = units.findIndex(({ id }) => id === unit.id);
  if (index >= 0) units[index] = unit;
};

const impactReady = (triggerId: TriggerCondition, events: readonly EventDraft[]) => {
  const damage = events.filter(({ kind }) => kind === 'damage' || kind === 'reaction');
  if (triggerId === 'after_skill' || triggerId === 'on_hit') return damage.length > 0;
  if (triggerId === 'on_repeat_hit') return damage.length > 1;
  if (triggerId === 'on_bounce') return events.some(({ kind }) => kind === 'bounce');
  if (triggerId === 'on_echo') return events.some(({ kind }) => kind === 'echo');
  if (triggerId === 'on_defeat') return events.some(({ kind }) => kind === 'unit_defeated');
  if (triggerId === 'on_overkill') return events.some(({ kind }) => kind === 'overkill');
  return false;
};

const consumeLayers = (layers: StatusLayers, triggerId: TriggerCondition) => {
  const next = { ...layers };
  const consume = (key: keyof StatusLayers, all: boolean) => {
    const amount = all ? next[key] : Math.min(1, next[key]);
    next[key] -= amount;
    return amount;
  };
  if (!triggerId.startsWith('consume')) return { amount: 0, layers: next };
  if (triggerId.endsWith('burn'))
    return { amount: consume('burn', triggerId.includes('_all_')), layers: next };
  if (triggerId.endsWith('poison'))
    return { amount: consume('poison', triggerId.includes('_all_')), layers: next };
  if (triggerId.endsWith('tide'))
    return { amount: consume('tide', triggerId.includes('_all_')), layers: next };
  return {
    amount: consume('burn', false) + consume('poison', false) + consume('tide', false),
    layers: next,
  };
};

export function resolveSkillComponent(input: ResolverInput): {
  units: BattleUnit[];
  events: EventDraft[];
} {
  const units = input.units.map((unit) => ({
    ...unit,
    ...(unit.statusLayers ? { statusLayers: { ...unit.statusLayers } } : {}),
  }));
  const events: EventDraft[] = [];
  const component = input.component;
  const prefix = `skill:${input.battle.sequence}:${component.id}`;
  const actor = units.find(({ id }) => id === input.actorId);
  const effectiveTargetId = resolveGuardedTargetId(units, input.preferredTargetId);
  const initialTarget = units.find(({ id }) => id === effectiveTargetId);
  if (!actor) throw new Error(`Unknown skill actor: ${input.actorId}`);
  if (!initialTarget || initialTarget.side !== 'enemies')
    throw new Error(`Unknown enemy target: ${input.preferredTargetId}`);

  const coreStrength = (id: string) =>
    bounded(
      actor.equippedCores
        ?.filter((core) => core.id === id)
        .reduce((sum, core) => sum + core.strength, 0) ?? 0,
    );
  const hasCore = (id: string) => actor.equippedCores?.some((core) => core.id === id) ?? false;
  const initialLayers = initialTarget.statusLayers ?? emptyLayers();
  const livingEnemyCount = () =>
    units.filter(({ side, currentHp }) => side === 'enemies' && currentHp > 0).length;
  const chain =
    component.specializationId === 'chain' ||
    (hasCore('lone-king-loop') && livingEnemyCount() === 1);
  const hitCount =
    component.specializationId === 'chain' || component.specializationId === 'multistrike'
      ? component.repeatCount
      : component.specializationId === 'blast' && livingEnemyCount() > 1
        ? livingEnemyCount()
        : 1;

  const dealDamage = (
    targetId: string,
    amount: number,
    causalId: string,
    parentCausalId?: string,
    kind: 'damage' | 'reaction' = 'damage',
    label?: string,
  ) => {
    const target = units.find(({ id }) => id === targetId);
    if (!target || target.currentHp <= 0) {
      events.push({
        kind: 'overkill',
        message: `${label ?? '既有因果'}轉為 OVERKILL +${amount}。`,
        actorId: actor.id,
        targetId,
        amount,
        componentId: component.id,
        element: component.element,
        specializationId: component.specializationId,
        triggerId: component.triggerId,
        causalId,
        ...(parentCausalId ? { parentCausalId } : {}),
      });
      return;
    }
    const value = bounded(amount);
    const nextHp = Math.max(0, target.currentHp - value);
    const overflow = Math.max(0, value - target.currentHp);
    replaceUnit(units, { ...target, currentHp: nextHp });
    events.push({
      kind,
      message: `${label ? `${label}使` : ''}${target.name}受到 ${value} 點${kind === 'reaction' ? '反應' : ''}傷害。`,
      actorId: actor.id,
      targetId,
      amount: value,
      componentId: component.id,
      element: component.element,
      specializationId: component.specializationId,
      triggerId: component.triggerId,
      causalId,
      ...(parentCausalId ? { parentCausalId } : {}),
    });
    if (nextHp === 0) {
      events.push({
        kind: 'unit_defeated',
        message: `${target.name}被擊破。`,
        actorId: actor.id,
        targetId,
        causalId: `${causalId}:defeat`,
        parentCausalId: causalId,
      });
    }
    if (overflow > 0) {
      events.push({
        kind: 'overkill',
        message: `OVERKILL +${overflow}`,
        actorId: actor.id,
        targetId,
        amount: overflow,
        causalId: `${causalId}:overkill`,
        parentCausalId: causalId,
      });
    }
  };

  let previousTargetId: string | undefined;
  let strength = bounded(actor.strengthened ?? 0);
  if ((actor.strengthened ?? 0) <= 0) strength = 0;
  for (let index = 0; index < hitCount; index += 1) {
    const route = resolveTargetRoute(units, effectiveTargetId, previousTargetId, chain);
    const target = route.target;
    if (!target) {
      events.push({
        kind: 'overkill',
        message: `第 ${index + 1} 段轉為 OVERKILL +${component.power}。`,
        actorId: actor.id,
        amount: bounded(component.power),
        componentId: component.id,
        causalId: `${prefix}:base:${index}`,
      });
      continue;
    }
    if (route.bounced || route.echoed) {
      events.push({
        kind: route.echoed ? 'echo' : 'bounce',
        message: route.echoed ? `迴響回到${target.name}。` : `連鎖彈射至${target.name}。`,
        actorId: actor.id,
        targetId: target.id,
        componentId: component.id,
        causalId: `${prefix}:route:${index}`,
      });
    }
    const liveTarget = units.find(({ id }) => id === target.id)!;
    const defense = Math.max(0, liveTarget.stats.defense - (liveTarget.defenseReduction ?? 0));
    const attack = input.isOpeningComponent && index === 0 ? actor.stats.attack : 0;
    const appliedStrength = index === 0 ? strength : 0;
    dealDamage(
      liveTarget.id,
      Math.max(1, attack + component.power + appliedStrength - defense),
      `${prefix}:base:${index}`,
    );
    if (appliedStrength > 0) {
      const liveActor = units.find(({ id }) => id === actor.id)!;
      replaceUnit(units, { ...liveActor, strengthened: 0 });
      strength = 0;
    }
    previousTargetId = liveTarget.id;
  }

  let liveTarget = units.find(({ id }) => id === initialTarget.id)!;
  if (
    liveTarget.currentHp > 0 &&
    matchesHuntWeakness(liveTarget, component.element, component.specializationId)
  ) {
    const cause = `${prefix}:weakness`;
    events.push({
      kind: 'triggered',
      message: `${liveTarget.name} 的公開弱點被命中。`,
      actorId: actor.id,
      targetId: liveTarget.id,
      amount: 1,
      componentId: component.id,
      element: component.element,
      specializationId: component.specializationId,
      triggerId: component.triggerId,
      causalId: cause,
    });
    dealDamage(liveTarget.id, 1, `${cause}:damage`, cause, 'reaction', '弱點反應');
    liveTarget = units.find(({ id }) => id === initialTarget.id)!;
  }
  const consumed =
    input.triggerReady === false
      ? { amount: 0, layers: liveTarget.statusLayers ?? emptyLayers() }
      : consumeLayers(liveTarget.statusLayers ?? emptyLayers(), component.triggerId);
  if (consumed.amount > 0) {
    replaceUnit(units, { ...liveTarget, statusLayers: consumed.layers });
    const cause = `${prefix}:consume`;
    events.push({
      kind: 'triggered',
      message: `消耗 ${consumed.amount} 層，建立等量獨立事件。`,
      actorId: actor.id,
      targetId: liveTarget.id,
      amount: consumed.amount,
      componentId: component.id,
      causalId: cause,
    });
    for (let index = 0; index < consumed.amount; index += 1)
      dealDamage(liveTarget.id, component.triggerAddition, `${cause}:damage:${index}`, cause);
  }

  const statusTarget = units.find(({ id }) => id === initialTarget.id)!;
  const key = layerKey[component.element];
  const beforeStatus = statusTarget.statusLayers ?? emptyLayers();
  const statusCause = `${prefix}:status`;
  if (statusTarget.currentHp > 0) {
    replaceUnit(units, {
      ...statusTarget,
      statusLayers: { ...beforeStatus, [key]: beforeStatus[key] + component.layerStrength },
    });
    events.push({
      kind: 'status_applied',
      message: `${statusTarget.name}獲得 ${component.layerStrength} 層${key}。`,
      actorId: actor.id,
      targetId: statusTarget.id,
      amount: component.layerStrength,
      componentId: component.id,
      element: component.element,
      specializationId: component.specializationId,
      triggerId: component.triggerId,
      causalId: statusCause,
    });
  }

  const reactionLayers =
    component.element === 'grass'
      ? initialLayers.burn
      : component.element === 'water'
        ? initialLayers.poison
        : initialLayers.tide;
  if (statusTarget.currentHp > 0) {
    for (let index = 0; index < reactionLayers; index += 1)
      dealDamage(
        statusTarget.id,
        component.layerStrength,
        `${prefix}:reaction:${index}`,
        statusCause,
        'reaction',
      );
  }

  if (component.element === 'water') {
    const ally = units
      .filter(({ side, currentHp }) => side === 'heroes' && currentHp > 0)
      .sort((left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp)[0];
    if (ally && ally.currentHp < ally.stats.hp) {
      const amount = bounded(component.layerStrength + actor.stats.healing);
      replaceUnit(units, { ...ally, currentHp: Math.min(ally.stats.hp, ally.currentHp + amount) });
      events.push({
        kind: 'healing',
        message: `潮汐治療${ally.name} ${amount} 點。`,
        actorId: actor.id,
        targetId: ally.id,
        amount,
        componentId: component.id,
        causalId: `${prefix}:healing`,
      });
    }
  }

  if (component.specializationId === 'weaken') {
    const target = units.find(({ id }) => id === initialTarget.id)!;
    replaceUnit(units, {
      ...target,
      defenseReduction: (target.defenseReduction ?? 0) + component.layerStrength,
    });
    events.push({
      kind: 'weaken',
      message: `${target.name}防禦削弱 ${component.layerStrength} 點。`,
      actorId: actor.id,
      targetId: target.id,
      amount: component.layerStrength,
      componentId: component.id,
      causalId: `${prefix}:weaken`,
    });
  }

  if (component.specializationId === 'empower' || hasCore('tide-relay')) {
    const order = input.battle.roundOrder;
    const nextId = order?.currentOrder.find(
      (id) => id !== actor.id && !order.actedIds.includes(id),
    );
    const next = units.find(({ id, currentHp }) => id === nextId && currentHp > 0);
    if (next) {
      const amount =
        component.specializationId === 'empower'
          ? component.layerStrength
          : coreStrength('tide-relay');
      replaceUnit(units, {
        ...next,
        strengthened: Math.min(5, (next.strengthened ?? 0) + amount),
      });
      events.push({
        kind: component.specializationId === 'empower' ? 'strengthen' : 'core_triggered',
        message: `${component.specializationId === 'empower' ? '接力強化' : '潮湧接力核心'}讓${next.name}獲得 ${amount} 點一次性強化。`,
        actorId: actor.id,
        targetId: next.id,
        amount,
        componentId: component.id,
        causalId: `${prefix}:strengthen`,
      });
    }
  }

  const triggerReady = input.triggerReady ?? impactReady(component.triggerId, events);
  if (triggerReady && consumed.amount === 0 && !component.triggerId.startsWith('consume')) {
    const cause = `${prefix}:trigger`;
    events.push({
      kind: 'triggered',
      message: `${component.triggerId} 建立一次追加事件。`,
      actorId: actor.id,
      targetId: initialTarget.id,
      amount: component.triggerAddition,
      componentId: component.id,
      element: component.element,
      specializationId: component.specializationId,
      triggerId: component.triggerId,
      causalId: cause,
    });
    dealDamage(initialTarget.id, component.triggerAddition, `${cause}:damage`, cause);
  }

  const applyCoreDamage = (coreId: string, targetIds: readonly string[]) => {
    if (!hasCore(coreId)) return;
    const coreName =
      coreId === 'burn-burst'
        ? '焚爆核心'
        : coreId === 'toxic-mist'
          ? '毒霧核心'
          : coreId === 'relay-prism'
            ? '三相稜鏡核心'
            : coreId;
    const cause = `${prefix}:core:${coreId}`;
    events.push({
      kind: 'core_triggered',
      message: `${coreName}建立 ${targetIds.length} 次獨立事件。`,
      actorId: actor.id,
      ...(targetIds[0] ? { targetId: targetIds[0] } : {}),
      amount: coreStrength(coreId),
      componentId: component.id,
      causalId: cause,
    });
    targetIds.forEach((targetId, index) =>
      dealDamage(
        targetId,
        coreStrength(coreId),
        `${cause}:damage:${index}`,
        cause,
        'damage',
        coreName,
      ),
    );
  };
  const livingIds = units
    .filter(({ side, currentHp }) => side === 'enemies' && currentHp > 0)
    .map(({ id }) => id);
  const echoedIds = livingIds.length === 1 ? [livingIds[0]!, livingIds[0]!] : livingIds;
  if (component.element === 'fire' && hasCore('molten-armor') && statusTarget.currentHp > 0) {
    const target = units.find(({ id }) => id === initialTarget.id)!;
    replaceUnit(units, {
      ...target,
      defenseReduction: (target.defenseReduction ?? 0) + coreStrength('molten-armor'),
    });
    events.push({
      kind: 'core_triggered',
      message: `熔甲削弱 ${coreStrength('molten-armor')}。`,
      actorId: actor.id,
      targetId: target.id,
      amount: coreStrength('molten-armor'),
      componentId: component.id,
      causalId: `${prefix}:core:molten-armor`,
    });
  }
  if (component.element === 'grass' && hasCore('venom-depth') && statusTarget.currentHp > 0) {
    const target = units.find(({ id }) => id === initialTarget.id)!;
    const layers = target.statusLayers ?? emptyLayers();
    replaceUnit(units, {
      ...target,
      statusLayers: { ...layers, poison: layers.poison + coreStrength('venom-depth') },
    });
    events.push({
      kind: 'core_triggered',
      message: `深毒核心追加 ${coreStrength('venom-depth')} 層毒素。`,
      actorId: actor.id,
      targetId: target.id,
      amount: coreStrength('venom-depth'),
      componentId: component.id,
      causalId: `${prefix}:core:venom-depth`,
    });
  }
  if (consumed.amount > 0 && component.triggerId.includes('burn'))
    applyCoreDamage('burn-burst', echoedIds);
  if (component.element === 'grass' && initialLayers.burn > 0)
    applyCoreDamage('toxic-mist', echoedIds);
  if (hasCore('healing-echo') && consumed.amount > 0 && component.triggerId.includes('tide')) {
    const ally = units
      .filter(({ side, currentHp }) => side === 'heroes' && currentHp > 0)
      .sort((left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp)[0];
    if (ally) {
      const amount = Math.min(
        coreStrength('healing-echo'),
        Math.max(0, ally.stats.hp - ally.currentHp),
      );
      replaceUnit(units, { ...ally, currentHp: ally.currentHp + amount });
      events.push({
        kind: 'core_triggered',
        message: `治癒迴響核心治療${ally.name} ${amount} 點。`,
        actorId: actor.id,
        targetId: ally.id,
        amount,
        componentId: component.id,
        causalId: `${prefix}:core:healing-echo`,
      });
    }
  }
  const history = (input.battle.skillHistory ?? []).filter(
    ({ roundIndex }) => roundIndex === (input.battle.roundIndex ?? 1),
  );
  if (new Set([...history.map(({ element }) => element), component.element]).size === 3)
    applyCoreDamage('relay-prism', [initialTarget.id]);

  return { units, events };
}
