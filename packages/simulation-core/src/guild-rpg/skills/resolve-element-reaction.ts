import type {
  BattleUnit,
  GuildBattleEvent,
  GuildElement,
  SkillComponent,
  StatusLayers,
} from '@expedition/shared-types';

type EventDraft = Omit<GuildBattleEvent, 'id'>;

const emptyLayers = (): StatusLayers => ({ burn: 0, poison: 0, tide: 0 });
const layerKey: Readonly<Record<GuildElement, keyof StatusLayers>> = {
  fire: 'burn',
  grass: 'poison',
  water: 'tide',
};

export function resolveElementReaction(input: {
  units: readonly BattleUnit[];
  actorId: string;
  targetId: string;
  component: SkillComponent;
}): { units: BattleUnit[]; events: EventDraft[] } {
  const units = input.units.map((unit) => ({
    ...unit,
    ...(unit.statusLayers ? { statusLayers: { ...unit.statusLayers } } : {}),
  }));
  const targetIndex = units.findIndex((unit) => unit.id === input.targetId);
  const target = units[targetIndex];
  if (!target) return { units, events: [] };

  const before = target.statusLayers ?? emptyLayers();
  const key = layerKey[input.component.element];
  const nextLayers = { ...before, [key]: before[key] + input.component.layerStrength };
  let nextTarget = { ...target, statusLayers: nextLayers };
  const events: EventDraft[] = [
    {
      kind: 'status_applied',
      message: `${target.name}獲得 ${input.component.layerStrength} 層${key}。`,
      actorId: input.actorId,
      targetId: target.id,
      amount: input.component.layerStrength,
      componentId: input.component.id,
      element: input.component.element,
      specializationId: input.component.specializationId,
      triggerId: input.component.triggerId,
    },
  ];

  const reactionBase =
    input.component.element === 'grass'
      ? before.burn
      : input.component.element === 'water'
        ? before.poison
        : before.tide;
  if (reactionBase > 0) {
    const amount = reactionBase + input.component.layerStrength;
    nextTarget = { ...nextTarget, currentHp: Math.max(0, nextTarget.currentHp - amount) };
    events.push({
      kind: 'reaction',
      message: `${input.component.element === 'grass' ? '毒霧擴散' : input.component.element === 'water' ? '潮汐淨化' : '蒸焰爆發'}造成 ${amount} 點連動傷害。`,
      actorId: input.actorId,
      targetId: target.id,
      amount,
      componentId: input.component.id,
      element: input.component.element,
      specializationId: input.component.specializationId,
      triggerId: input.component.triggerId,
    });
  }
  units[targetIndex] = nextTarget;

  if (input.component.element === 'water') {
    const ally = units
      .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
      .sort((left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp)[0];
    if (ally) {
      const heal = Math.min(
        input.component.layerStrength +
          (units.find((unit) => unit.id === input.actorId)?.stats.healing ?? 0),
        ally.stats.hp - ally.currentHp,
      );
      const allyIndex = units.findIndex((unit) => unit.id === ally.id);
      units[allyIndex] = { ...ally, currentHp: ally.currentHp + heal };
      events.push({
        kind: 'healing',
        message: `潮汐迴響治療${ally.name} ${heal} 點。`,
        actorId: input.actorId,
        targetId: ally.id,
        amount: heal,
        componentId: input.component.id,
        element: 'water',
        specializationId: input.component.specializationId,
        triggerId: input.component.triggerId,
      });
    }
  }

  return { units, events };
}
