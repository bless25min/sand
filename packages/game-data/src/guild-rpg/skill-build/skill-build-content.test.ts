import { describe, expect, it } from 'vitest';

import { GUILD_ADVENTURERS } from '../adventurers';
import { GUILD_EQUIPMENT_BASES } from '../equipment';
import { GUILD_HUNTS } from '../combo/hunts';
import { GUILD_ELEMENTS } from './attributes';
import { GUILD_SKILL_FORMS } from './skill-forms';
import { GUILD_SKILL_SPECIALIZATIONS } from './specializations';
import { GUILD_TRIGGER_CONDITIONS } from './triggers';
import { validateSkillBuildContent } from './validate';

const idsAreUnique = (entries: readonly { id: string }[]) =>
  new Set(entries.map((entry) => entry.id)).size === entries.length;

describe('deterministic skill-build content', () => {
  it('authors the complete 3 × 6 × 30 one-star grammar', () => {
    expect(GUILD_ELEMENTS).toHaveLength(3);
    expect(GUILD_SKILL_SPECIALIZATIONS).toHaveLength(6);
    expect(GUILD_TRIGGER_CONDITIONS).toHaveLength(30);
    expect(GUILD_SKILL_FORMS).toHaveLength(540);

    expect(idsAreUnique(GUILD_ELEMENTS)).toBe(true);
    expect(idsAreUnique(GUILD_SKILL_SPECIALIZATIONS)).toBe(true);
    expect(idsAreUnique(GUILD_TRIGGER_CONDITIONS)).toBe(true);
    expect(idsAreUnique(GUILD_SKILL_FORMS)).toBe(true);
    expect(validateSkillBuildContent()).toEqual([]);
  });

  it('ships six heroes with six legal and distinct starter skills', () => {
    expect(GUILD_ADVENTURERS).toHaveLength(6);
    expect(idsAreUnique(GUILD_ADVENTURERS)).toBe(true);

    for (const adventurer of GUILD_ADVENTURERS) {
      expect(adventurer.starterSkillIds, adventurer.id).toHaveLength(6);
      expect(new Set(adventurer.starterSkillIds).size, adventurer.id).toBe(6);
      for (const skillId of adventurer.starterSkillIds) {
        expect(
          GUILD_SKILL_FORMS.some((form) => form.id === skillId),
          skillId,
        ).toBe(true);
      }
    }
  });

  it('keeps every authored roll range visible, integer, and ordered', () => {
    const ranges = [
      ...GUILD_ELEMENTS.flatMap((element) => [element.layerRoll]),
      ...GUILD_SKILL_SPECIALIZATIONS.flatMap((specialization) => [
        specialization.powerRoll,
        specialization.repeatRoll,
      ]),
      ...GUILD_TRIGGER_CONDITIONS.flatMap((trigger) => [trigger.additionRoll]),
      ...GUILD_EQUIPMENT_BASES.flatMap((equipment) => [
        equipment.mainStatRoll,
        equipment.coreStrengthRoll,
      ]),
    ];

    for (const range of ranges) {
      expect(Number.isInteger(range.min), JSON.stringify(range)).toBe(true);
      expect(Number.isInteger(range.max), JSON.stringify(range)).toBe(true);
      expect(range.min, JSON.stringify(range)).toBeLessThanOrEqual(range.max);
    }
  });

  it('exposes exactly three equipment slots and core pools on every base', () => {
    expect(new Set(GUILD_EQUIPMENT_BASES.map((equipment) => equipment.slot))).toEqual(
      new Set(['weapon', 'armor', 'accessory']),
    );
    expect(
      GUILD_EQUIPMENT_BASES.every(
        (equipment) => equipment.coreIds.length > 0 && new Set(equipment.coreIds).size > 0,
      ),
    ).toBe(true);
  });

  it('publishes twelve target-farm pools split evenly across all three elements', () => {
    expect(GUILD_HUNTS).toHaveLength(12);
    expect(
      Object.fromEntries(
        GUILD_ELEMENTS.map(({ id }) => [
          id,
          GUILD_HUNTS.filter(({ element }) => element === id).length,
        ]),
      ),
    ).toEqual({ fire: 4, grass: 4, water: 4 });

    for (const hunt of GUILD_HUNTS) {
      expect(hunt.skillDropPool?.elements).toEqual([hunt.element]);
      expect(hunt.skillDropPool?.specializationIds.length).toBeGreaterThanOrEqual(3);
      expect(hunt.skillDropPool?.triggerIds.length).toBeGreaterThanOrEqual(6);
      expect(hunt.coreDropIds?.length).toBeGreaterThanOrEqual(2);
      expect(
        hunt.coreDropIds?.every((coreId) =>
          GUILD_EQUIPMENT_BASES.some((base) => base.coreIds.includes(coreId)),
        ),
      ).toBe(true);
      if (hunt.bossEnemyId) expect(hunt.guaranteedBossDrops).toBeGreaterThanOrEqual(2);
    }
  });
});
