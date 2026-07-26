import type { GuildBattleState, GuildElement, TriggerCondition } from '@expedition/shared-types';

export interface TriggerContext {
  battle: GuildBattleState;
  actorId: string;
  targetId: string;
  element: GuildElement;
  hitIndex: number;
  isBounce: boolean;
  isEcho: boolean;
  defeated: boolean;
  overkill: number;
}

const layers = (battle: GuildBattleState, targetId: string) =>
  battle.units.find((unit) => unit.id === targetId)?.statusLayers ?? {
    burn: 0,
    poison: 0,
    tide: 0,
  };

export function triggerMatches(trigger: TriggerCondition, context: TriggerContext): boolean {
  const { battle, actorId, targetId, element, hitIndex } = context;
  const targetLayers = layers(battle, targetId);
  const actor = battle.units.find((unit) => unit.id === actorId);
  const order = battle.roundOrder;
  const currentRound = battle.roundIndex ?? 1;
  const history = (battle.skillHistory ?? []).filter(
    (entry) => entry.roundIndex === currentRound && entry.actorId !== actorId,
  );
  const previous = history.at(-1);

  switch (trigger) {
    case 'battle_open':
      return (battle.skillHistory?.length ?? 0) === 0;
    case 'round_open':
      return history.length === 0;
    case 'first_actor':
      return order?.currentOrder[0] === actorId;
    case 'final_actor':
      return order?.currentOrder.at(-1) === actorId;
    case 'after_skill':
      return true;
    case 'target_burning':
      return targetLayers.burn > 0;
    case 'target_poisoned':
      return targetLayers.poison > 0;
    case 'target_tide':
      return targetLayers.tide > 0;
    case 'actor_strengthened':
      return (actor?.strengthened ?? 0) > 0;
    case 'target_weakened':
      return (battle.units.find((unit) => unit.id === targetId)?.defenseReduction ?? 0) > 0;
    case 'layer_threshold':
      return Math.max(...Object.values(targetLayers)) >= 5;
    case 'consume_burn':
    case 'consume_all_burn':
      return targetLayers.burn > 0;
    case 'consume_poison':
    case 'consume_all_poison':
      return targetLayers.poison > 0;
    case 'consume_tide':
    case 'consume_all_tide':
      return targetLayers.tide > 0;
    case 'consume_mixed':
      return Object.values(targetLayers).filter((value) => value > 0).length >= 2;
    case 'on_hit':
      return hitIndex >= 0;
    case 'on_repeat_hit':
      return hitIndex > 0;
    case 'on_bounce':
      return context.isBounce;
    case 'on_echo':
      return context.isEcho;
    case 'on_defeat':
      return context.defeated;
    case 'on_overkill':
      return context.overkill > 0;
    case 'previous_fire':
      return previous?.element === 'fire';
    case 'previous_grass':
      return previous?.element === 'grass';
    case 'previous_water':
      return previous?.element === 'water';
    case 'ally_same_element':
      return history.some((entry) => entry.element === element);
    case 'team_three_elements':
      return new Set([...history.map((entry) => entry.element), element]).size === 3;
    case 'lone_target':
      return (
        battle.units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0).length === 1
      );
  }
}
