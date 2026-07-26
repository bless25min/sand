import type { GuildGameContent, IntegerRollRange, OwnedSkill } from '@expedition/shared-types';

const midpoint = ({ min, max }: IntegerRollRange) => Math.floor((min + max) / 2);

export function createOwnedSkill(input: {
  id: string;
  name?: string;
  formId: string;
  content: GuildGameContent;
  roll?: (range: IntegerRollRange) => number;
  sourceHuntId?: string;
}): OwnedSkill {
  const form = input.content.skillForms.find(({ id }) => id === input.formId);
  if (!form) throw new Error(`Unknown skill form: ${input.formId}`);
  const element = input.content.elements.find(({ id }) => id === form.element)!;
  const specialization = input.content.skillSpecializations.find(
    ({ id }) => id === form.specializationId,
  )!;
  const trigger = input.content.triggerConditions.find(({ id }) => id === form.triggerId)!;
  const roll = input.roll ?? midpoint;
  return {
    id: input.id,
    name: input.name ?? form.name,
    stars: 1,
    components: [
      {
        id: `${input.id}:component`,
        formId: form.id,
        element: form.element,
        specializationId: form.specializationId,
        triggerId: form.triggerId,
        power: roll(specialization.powerRoll),
        layerStrength: roll(element.layerRoll),
        triggerAddition: roll(trigger.additionRoll),
        repeatCount: roll(specialization.repeatRoll),
      },
    ],
    ...(input.sourceHuntId ? { sourceHuntId: input.sourceHuntId } : {}),
  };
}
