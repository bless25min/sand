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
  it('keeps only identity-critical HP and compact projected changes on the unit', () => {
    expect(createCombatUnitHud(target)).toEqual({
      hpLabel: '136/175',
      projectedHpLabel: '136 → 81',
      statusPips: ['燃3', '毒2'],
      impactLabel: '−55',
    });
  });

  it('keeps the projected result absent until a skill is armed', () => {
    const withoutPreview = { ...target };
    delete withoutPreview.preview;
    expect(createCombatUnitHud(withoutPreview)).toMatchObject({
      hpLabel: '136/175',
      projectedHpLabel: undefined,
      statusPips: ['燃3', '毒2'],
      impactLabel: undefined,
    });
  });
});
