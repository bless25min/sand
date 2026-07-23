import { BEAST_HUNTER_MARKSMAN, HEAVY_SHIELD_GUARD, LEGION_SKILLS } from '@expedition/game-data';
import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { promoteUnit } from './promote-unit';

describe('promoteUnit', () => {
  it.each([
    {
      definition: HEAVY_SHIELD_GUARD,
      unit: createUnitState({ classId: 'infantry', level: 2 }),
      expected: {
        classId: 'heavy-shield-guard',
        attack: 10,
        defense: 11,
        frontalDefense: 14,
        mobility: 1.7,
        skillIds: ['shield-wall-training'],
        passiveIds: ['shield-wall-training'],
        appearanceIds: ['class-heavy-shield-guard'],
      },
    },
    {
      definition: BEAST_HUNTER_MARKSMAN,
      unit: createUnitState({
        unitType: 'ARCHER',
        classId: 'archer',
        level: 2,
        formation: 'LOOSE',
      }),
      expected: {
        classId: 'beast-hunter-marksman',
        attack: 13,
        defense: 9,
        frontalDefense: 9.5,
        mobility: 2.25,
        skillIds: ['beast-hunting-manual'],
        passiveIds: ['beast-hunting-manual'],
        appearanceIds: ['class-beast-hunter-marksman'],
      },
    },
  ])('atomically promotes $definition.id units', ({ definition, unit, expected }) => {
    const result = promoteUnit({
      unit,
      classDefinition: definition,
      skillDefinitions: LEGION_SKILLS,
      eventId: 'event-class-change',
    });

    expect(result).toMatchObject({
      ok: true,
      unit: expected,
      event: {
        id: 'event-class-change',
        unitId: unit.id,
        type: 'CLASS_CHANGED',
        causes: [unit.id],
        effects: {
          fromClassId: definition.sourceClassId,
          toClassId: definition.id,
        },
      },
    });
    expect(unit.classId).toBe(definition.sourceClassId);
  });

  it('does not duplicate class, skill, passive, or appearance IDs', () => {
    const unit = createUnitState({
      classId: 'infantry',
      level: 2,
      skillIds: ['shield-wall-training'],
      passiveIds: ['shield-wall-training'],
      appearanceIds: ['class-heavy-shield-guard'],
    });

    const result = promoteUnit({
      unit,
      classDefinition: HEAVY_SHIELD_GUARD,
      skillDefinitions: LEGION_SKILLS,
      eventId: 'event-no-duplicates',
    });

    expect(result).toMatchObject({
      ok: true,
      unit: {
        skillIds: ['shield-wall-training'],
        passiveIds: ['shield-wall-training'],
        appearanceIds: ['class-heavy-shield-guard'],
      },
    });
  });

  it('returns WRONG_SOURCE_CLASS before lower-level or missing-skill checks without changing the unit', () => {
    const unit = createUnitState({ classId: 'archer', level: 1 });

    const result = promoteUnit({
      unit,
      classDefinition: HEAVY_SHIELD_GUARD,
      skillDefinitions: {},
      eventId: 'event-wrong-source',
    });

    expect(result).toMatchObject({ ok: false, reason: 'WRONG_SOURCE_CLASS' });
    expect(result.unit).toBe(unit);
  });

  it('returns LEVEL_TOO_LOW before missing-skill checks without changing the unit', () => {
    const unit = createUnitState({ classId: 'infantry', level: 1 });

    const result = promoteUnit({
      unit,
      classDefinition: HEAVY_SHIELD_GUARD,
      skillDefinitions: {},
      eventId: 'event-low-level',
    });

    expect(result).toMatchObject({ ok: false, reason: 'LEVEL_TOO_LOW' });
    expect(result.unit).toBe(unit);
  });

  it('returns MISSING_SKILL_DEFINITION with the missing skill and preserves the source unit', () => {
    const unit = createUnitState({ classId: 'infantry', level: 2 });

    const result = promoteUnit({
      unit,
      classDefinition: HEAVY_SHIELD_GUARD,
      skillDefinitions: {},
      eventId: 'event-missing-skill',
    });

    expect(result).toMatchObject({
      ok: false,
      reason: 'MISSING_SKILL_DEFINITION',
      missingSkillId: 'shield-wall-training',
    });
    expect(result.unit).toBe(unit);
  });
});
