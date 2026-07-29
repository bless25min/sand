import type {
  GuildGameContent,
  IntegerRollRange,
  OwnedSkill,
  QualityRank,
} from '@expedition/shared-types';

import { clampQualityRank } from '../progression/quality-rank';
const midpoint = ({ min, max }: IntegerRollRange) => Math.floor((min + max) / 2);

export function createOwnedSkill(input: {
  id: string;
  name?: string;
  formId: string;
  content: GuildGameContent;
  roll?: (range: IntegerRollRange) => number;
  qualityRank?: QualityRank;
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
  const qualityRank = input.qualityRank ?? 1;
  const atomicRoll = (range: IntegerRollRange) =>
    clampQualityRank(Math.min(qualityRank, roll(range)));
  const repeatMinimum = form.specializationId === 'chain' ? 2 : 1;
  const repeatMaximum =
    form.specializationId === 'chain' ? qualityRank + 1 : Math.max(1, qualityRank);
  return {
    id: input.id,
    name: input.name ?? form.name,
    stars: 1,
    components: [
      {
        id: `${input.id}:component`,
        qualityRank,
        formId: form.id,
        element: form.element,
        specializationId: form.specializationId,
        triggerId: form.triggerId,
        power: atomicRoll(specialization.powerRoll),
        layerStrength: atomicRoll(element.layerRoll),
        triggerAddition: atomicRoll(trigger.additionRoll),
        repeatCount: Math.max(
          repeatMinimum,
          Math.min(repeatMaximum, roll(specialization.repeatRoll)),
        ),
      },
    ],
    ...(input.sourceHuntId ? { sourceHuntId: input.sourceHuntId } : {}),
  };
}
