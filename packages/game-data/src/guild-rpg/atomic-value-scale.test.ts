import { describe, expect, it } from 'vitest';

import {
  GUILD_ADVENTURERS,
  GUILD_ELEMENTS,
  GUILD_EQUIPMENT_BASES,
  GUILD_QUESTS,
  GUILD_SKILL_SPECIALIZATIONS,
  GUILD_TRIGGER_CONDITIONS,
} from './index';

describe('guild RPG atomic value scale', () => {
  it('starts every hero from one-point combat scalars', () => {
    for (const hero of GUILD_ADVENTURERS) {
      expect(hero.baseStats, hero.id).toEqual({
        hp: 10,
        attack: 1,
        defense: 1,
        speed: 1,
        healing: 1,
      });
    }
  });

  it('keeps enemy attack and defense inside the public one-to-five threat scale', () => {
    for (const enemy of GUILD_QUESTS.flatMap(({ enemies }) => enemies)) {
      expect(enemy.stats.attack, `${enemy.id}:attack`).toBeGreaterThanOrEqual(1);
      expect(enemy.stats.attack, `${enemy.id}:attack`).toBeLessThanOrEqual(5);
      expect(enemy.stats.defense, `${enemy.id}:defense`).toBeGreaterThanOrEqual(1);
      expect(enemy.stats.defense, `${enemy.id}:defense`).toBeLessThanOrEqual(5);
    }
  });

  it('authors every random atomic roll inside one to five', () => {
    const atomicRanges = [
      ...GUILD_ELEMENTS.map(({ layerRoll }) => layerRoll),
      ...GUILD_SKILL_SPECIALIZATIONS.map(({ powerRoll }) => powerRoll),
      ...GUILD_TRIGGER_CONDITIONS.map(({ additionRoll }) => additionRoll),
      ...GUILD_EQUIPMENT_BASES.flatMap(({ mainStatRoll, coreStrengthRoll }) => [
        mainStatRoll,
        coreStrengthRoll,
      ]),
    ];

    for (const range of atomicRanges) {
      expect(range.min, JSON.stringify(range)).toBeGreaterThanOrEqual(1);
      expect(range.max, JSON.stringify(range)).toBeLessThanOrEqual(5);
    }
    for (const range of GUILD_SKILL_SPECIALIZATIONS.map(({ repeatRoll }) => repeatRoll)) {
      expect(range.min, JSON.stringify(range)).toBeGreaterThanOrEqual(1);
      expect(range.max, JSON.stringify(range)).toBeLessThanOrEqual(6);
    }
  });
});
