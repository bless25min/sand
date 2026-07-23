import { describe, expect, it } from 'vitest';

import { HORNPLATE_SHIELD, HORNPLATE_SHIELD_RECIPE } from './hornplate-shield';

describe('Hornplate shield data', () => {
  it('contains the required trade-offs and heavy-infantry restriction', () => {
    expect(HORNPLATE_SHIELD).toMatchObject({
      slot: 'SHIELD',
      allowedUnitTypes: ['HEAVY_INFANTRY'],
      weight: 3,
      frontalDefenseBonus: 6,
      mobilityMultiplier: 0.8,
      appearanceId: 'HORNPLATE_SHIELD',
    });
  });

  it('requires pelt, fang, and horn plate', () => {
    expect(HORNPLATE_SHIELD_RECIPE.ingredients).toEqual([
      { materialId: 'WOLF_PELT', quantity: 4 },
      { materialId: 'MONSTER_FANG', quantity: 6 },
      { materialId: 'HORN_PLATE', quantity: 2 },
    ]);
  });
});
