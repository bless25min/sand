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
  const causalId = `passive:${input.battle.sequence}:${actor.deliveryPassiveId}`;
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
  const emit = (message: string, amount: number, targetId?: string) =>
    events.push({
      kind: 'passive',
      message,
      actorId: actor.id,
      ...(targetId ? { targetId } : {}),
      amount,
      causalId,
    });

  if (actor.deliveryPassiveId === 'ironwall-delivery') {
    const next = nextHero();
    replace({ ...actor, guarding: true });
    if (next) replace({ ...next, strengthened: Math.min(5, (next.strengthened ?? 0) + 1) });
    emit(`盾火開路：架盾並讓${next?.name ?? '下一棒'}取得 1 點強化。`, 1, next?.id);
  } else if (actor.deliveryPassiveId === 'eagle-eye-delivery') {
    const target = units.find(({ id }) => id === input.targetId);
    if (target)
      replace({ ...target, defenseReduction: Math.min(5, (target.defenseReduction ?? 0) + 1) });
    emit('鷹眼追獵：標記主目標並建立 1 點後續破綻。', 1, target?.id);
  } else if (actor.deliveryPassiveId === 'morning-tide-delivery') {
    const ally = units
      .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
      .sort((left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp)[0];
    if (ally && ally.currentHp < ally.stats.hp) {
      replace({ ...ally, currentHp: Math.min(ally.stats.hp, ally.currentHp + 1) });
      emit(`晨潮祝禱：治療${ally.name} 1 點。`, 1, ally.id);
    } else {
      const next = nextHero();
      if (next) replace({ ...next, strengthened: Math.min(5, (next.strengthened ?? 0) + 1) });
      emit(`晨潮溢療：讓${next?.name ?? '下一棒'}取得 1 點強化。`, 1, next?.id);
    }
  } else if (actor.deliveryPassiveId === 'catalyst-delivery') {
    const target = units.find(({ id }) => id === input.targetId);
    if (target) {
      const key = layerKey[input.element];
      const layers = target.statusLayers ?? { burn: 0, poison: 0, tide: 0 };
      replace({ ...target, statusLayers: { ...layers, [key]: layers[key] + 1 } });
    }
    emit('異相催化：保留 1 層屬性作為下一棒引線。', 1, target?.id);
  } else if (actor.deliveryPassiveId === 'tide-order-delivery') {
    const next = nextHero();
    const reordered =
      input.battle.roundOrder?.currentOrder.join() !== input.battle.roundOrder?.defaultOrder.join();
    const amount = reordered ? 2 : 1;
    if (next)
      replace({
        ...next,
        strengthened: Math.min(5, (next.strengthened ?? 0) + amount),
      });
    emit(`改令成潮：讓${next?.name ?? '下一棒'}取得 ${amount} 點強化。`, amount, next?.id);
  } else if (actor.deliveryPassiveId === 'ember-finale-delivery') {
    const target = units.find(({ id }) => id === input.targetId);
    if (target) {
      const layers = target.statusLayers ?? { burn: 0, poison: 0, tide: 0 };
      replace({ ...target, statusLayers: { ...layers, burn: layers.burn + 1 } });
    }
    emit(`燼刃壓軸：第 ${input.relayIndex} 棒保留 1 層燃燒。`, 1, target?.id);
  }

  return { units, events };
}
