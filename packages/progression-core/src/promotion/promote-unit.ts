import type {
  GrowthEvent,
  SkillDefinition,
  UnitClassDefinition,
  UnitState,
} from '@expedition/shared-types';

import { applyUnitStatModifiers } from './apply-unit-stat-modifiers';

export type PromotionFailureReason =
  'WRONG_SOURCE_CLASS' | 'LEVEL_TOO_LOW' | 'MISSING_SKILL_DEFINITION';

export interface PromoteUnitInput {
  readonly unit: UnitState;
  readonly classDefinition: UnitClassDefinition;
  readonly skillDefinitions: Readonly<Record<string, SkillDefinition>>;
  readonly eventId: string;
}

export type PromotionResult =
  | { readonly ok: true; readonly unit: UnitState; readonly event: GrowthEvent }
  | {
      readonly ok: false;
      readonly reason: PromotionFailureReason;
      readonly unit: UnitState;
      readonly missingSkillId?: string;
    };

export function promoteUnit(input: PromoteUnitInput): PromotionResult {
  const { classDefinition, skillDefinitions, unit } = input;

  if (unit.classId !== classDefinition.sourceClassId) {
    return { ok: false, reason: 'WRONG_SOURCE_CLASS', unit };
  }

  if (unit.level < classDefinition.minimumLevel) {
    return { ok: false, reason: 'LEVEL_TOO_LOW', unit };
  }

  const skills: SkillDefinition[] = [];
  for (const skillId of classDefinition.skillIds) {
    const skill = skillDefinitions[skillId];
    if (skill === undefined) {
      return { ok: false, reason: 'MISSING_SKILL_DEFINITION', unit, missingSkillId: skillId };
    }
    skills.push(skill);
  }

  for (const passiveId of classDefinition.passiveIds) {
    const passive = skillDefinitions[passiveId];
    if (
      !classDefinition.skillIds.includes(passiveId) ||
      passive === undefined ||
      passive.type !== 'PASSIVE'
    ) {
      return {
        ok: false,
        reason: 'MISSING_SKILL_DEFINITION',
        unit,
        missingSkillId: passiveId,
      };
    }
  }

  let promotedUnit = applyUnitStatModifiers(unit, classDefinition.statModifiers);
  for (const skill of skills) {
    promotedUnit = applyUnitStatModifiers(promotedUnit, skill.statModifiers);
  }

  const updatedUnit: UnitState = {
    ...promotedUnit,
    classId: classDefinition.id,
    skillIds: uniqueIds(unit.skillIds, classDefinition.skillIds),
    passiveIds: uniqueIds(unit.passiveIds, classDefinition.passiveIds),
    appearanceIds: uniqueIds(unit.appearanceIds, classDefinition.appearanceIds),
  };

  return {
    ok: true,
    unit: updatedUnit,
    event: {
      id: input.eventId,
      unitId: unit.id,
      type: 'CLASS_CHANGED',
      causes: [unit.id],
      effects: {
        fromClassId: unit.classId,
        toClassId: classDefinition.id,
      },
    },
  };
}

function uniqueIds(existingIds: readonly string[], addedIds: readonly string[]): string[] {
  return [...new Set([...existingIds, ...addedIds])];
}
