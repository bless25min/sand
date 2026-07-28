import { describe, expect, it } from 'vitest';

import type { GuildCombatSceneUnit } from './contracts';
import { createCombatUnitHud } from './combat-unit-hud';

const target: GuildCombatSceneUnit = {
  id: 'wolf',
  name: '灰牙首領',
  side: 'enemies',
  x: 690,
  y: 210,
  currentHp: 136,
  maxHp: 175,
  attack: 34,
  defense: 12,
  hpRatio: 136 / 175,
  state: 'targeted',
  selected: true,
  statusLayers: { burn: 3, poison: 2, tide: 0 },
  preview: {
    afterHp: 81,
    damage: 55,
    healing: 0,
    afterStatus: { burn: 7, poison: 2, tide: 0 },
    afterDefenseReduction: 4,
    afterStrengthened: 0,
  },
};

describe('combat unit HUD', () => {
  it('shows exact HP, battle stats, and projected changes on the unit', () => {
    expect(createCombatUnitHud(target)).toEqual({
      hpLabel: '136 / 175',
      statLabel: '攻 34 · 防 12',
      projectedHpLabel: '136 → 81',
      statuses: ['燃3→7', '毒2', '削防4'],
      damage: 55,
      healing: 0,
    });
  });

  it('keeps the projected result absent until a skill is armed', () => {
    const withoutPreview = { ...target };
    delete withoutPreview.preview;
    expect(createCombatUnitHud(withoutPreview)).toMatchObject({
      hpLabel: '136 / 175',
      projectedHpLabel: undefined,
      statuses: ['燃3', '毒2'],
      damage: 0,
      healing: 0,
    });
  });
});
