import type {
  BattleUnit,
  GuildBattleEvent,
  GuildBattleState,
  GuildElement,
  StatusLayers,
} from '@expedition/shared-types';

type EventDraft = Omit<GuildBattleEvent, 'id'>;

const layerKey: Readonly<Record<GuildElement, keyof StatusLayers>> = {
  fire: 'burn',
  grass: 'poison',
  water: 'tide',
};

export function resolveDeliveryPassive(input: {
  battle: GuildBattleState;
  units: readonly BattleUnit[];
  actorId: string;
  targetId: string;
  element: GuildElement;
  relayIndex: number;
}): { units: readonly BattleUnit[]; events: readonly EventDraft[] } {
  let units = input.units.map((unit) => ({ ...unit }));
  const events: EventDraft[] = [];
  const actor = units.find(({ id }) => id === input.actorId);
  if (!actor?.deliveryPassiveId) return { units, events };
  const replace = (next: BattleUnit) => {
    units = units.map((unit) => (unit.id === next.id ? next : unit));
  };
  const nextHero = () => {
    const order = input.battle.roundOrder;
    const id = order?.currentOrder.find(
      (heroId) => heroId !== actor.id && !order.actedIds.includes(heroId),
    );
    return units.find((unit) => unit.id === id && unit.currentHp > 0);
  };
  const damage = (label: string, amount: number) => {
    const target =
      units.find(
        (unit) => unit.id === input.targetId && unit.side === 'enemies' && unit.currentHp > 0,
      ) ?? units.find((unit) => unit.side === 'enemies' && unit.currentHp > 0);
    if (!target) {
      events.push({
        kind: 'overkill',
        message: `${label}轉為 OVERKILL +${amount}。`,
        actorId: actor.id,
        amount,
      });
      return;
    }
    const nextHp = Math.max(0, target.currentHp - amount);
    replace({ ...target, currentHp: nextHp });
    events.push({
      kind: 'damage',
      message: `${label}對${target.name}追加 ${amount} 點傷害。`,
      actorId: actor.id,
      targetId: target.id,
      amount,
    });
    if (nextHp === 0) {
      events.push({
        kind: 'unit_defeated',
        message: `${target.name}被${label}擊破。`,
        actorId: actor.id,
        targetId: target.id,
      });
    }
  };

  if (actor.deliveryPassiveId === 'ironwall-delivery') {
    const next = nextHero();
    replace({ ...actor, guarding: true });
    if (next) replace({ ...next, strengthened: (next.strengthened ?? 0) + 2 });
    events.push({
      kind: 'passive',
      message: `盾火開路：布蘭架盾，${next?.name ?? '下一棒'}承接 2 點強化。`,
      actorId: actor.id,
      ...(next ? { targetId: next.id } : {}),
      amount: 2,
    });
  } else if (actor.deliveryPassiveId === 'eagle-eye-delivery') {
    events.push({
      kind: 'passive',
      message: '鷹眼追獵：主目標留下固定追擊標記。',
      actorId: actor.id,
      targetId: input.targetId,
      amount: 4,
    });
    damage('鷹眼追擊', 4);
  } else if (actor.deliveryPassiveId === 'morning-tide-delivery') {
    const ally = units
      .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
      .sort((left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp)[0];
    const missing = ally ? ally.stats.hp - ally.currentHp : 0;
    if (ally && missing > 0) {
      const amount = Math.min(6, missing);
      replace({ ...ally, currentHp: ally.currentHp + amount });
      events.push({
        kind: 'passive',
        message: `晨潮祝禱：治療${ally.name} ${amount} 點。`,
        actorId: actor.id,
        targetId: ally.id,
        amount,
      });
    } else {
      const next = nextHero();
      if (next) replace({ ...next, strengthened: (next.strengthened ?? 0) + 6 });
      events.push({
        kind: 'passive',
        message: `晨潮溢療：轉為${next?.name ?? '下一棒'} 6 點強化。`,
        actorId: actor.id,
        ...(next ? { targetId: next.id } : {}),
        amount: 6,
      });
    }
  } else if (actor.deliveryPassiveId === 'catalyst-delivery') {
    const target = units.find(({ id }) => id === input.targetId);
    if (target) {
      const key = layerKey[input.element];
      const layers = target.statusLayers ?? { burn: 0, poison: 0, tide: 0 };
      replace({ ...target, statusLayers: { ...layers, [key]: layers[key] + 1 } });
    }
    events.push({
      kind: 'passive',
      message: '異相催化：保留 1 層屬性作為下一棒反應引線。',
      actorId: actor.id,
      targetId: input.targetId,
      amount: 1,
    });
  } else if (actor.deliveryPassiveId === 'tide-order-delivery') {
    const next = nextHero();
    const reordered =
      input.battle.roundOrder?.currentOrder.join() !== input.battle.roundOrder?.defaultOrder.join();
    const amount = reordered ? 4 : 2;
    if (next) replace({ ...next, strengthened: (next.strengthened ?? 0) + amount });
    events.push({
      kind: 'passive',
      message: `改令成潮：${reordered ? '臨時改序' : '預設順序'}讓${next?.name ?? '下一棒'}承接 ${amount} 點強化。`,
      actorId: actor.id,
      ...(next ? { targetId: next.id } : {}),
      amount,
    });
  } else if (actor.deliveryPassiveId === 'ember-finale-delivery') {
    const amount = input.relayIndex + 2;
    events.push({
      kind: 'passive',
      message: `燼刃壓軸：第 ${input.relayIndex} 棒留下 ${amount} 點殘響。`,
      actorId: actor.id,
      targetId: input.targetId,
      amount,
    });
    damage('燼刃殘響', amount);
  }

  return { units, events };
}
