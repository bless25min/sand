import { describe, expect, it } from 'vitest';

import { GREYFANG_MATERIALS, getMaterialDefinition } from './greyfang-materials';

describe('Greyfang materials', () => {
  it('defines pelt, fang, and heavy horn plate with positive weights', () => {
    expect(GREYFANG_MATERIALS.map((material) => material.id)).toEqual([
      'WOLF_PELT',
      'MONSTER_FANG',
      'HORN_PLATE',
    ]);
    expect(GREYFANG_MATERIALS.every((material) => material.unitWeight > 0)).toBe(true);
    expect(getMaterialDefinition('HORN_PLATE').tags).toContain('HEAVY');
  });
});
