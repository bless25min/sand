import { describe, expect, it } from 'vitest';

import {
  closeLootDetail,
  createLootLayout,
  RARITY_COLORS,
  type LootEntryInput,
} from './loot-layout';

const equipment = (index: number, rarity: LootEntryInput['rarity'] = 'common'): LootEntryInput => ({
  id: `equipment-${index}`,
  kind: 'equipment',
  name: `裝備 ${index}`,
  rarity,
  summary: `攻擊 +${index}`,
  detailLines: [`詞綴 ${index}`, `核心 ${index}`],
});

const skill = (index: number): LootEntryInput => ({
  id: `skill-${index}`,
  kind: 'skill',
  name: `技能 ${index}`,
  rarity: 'rare',
  summary: '火・疊層・目標燃燒',
  detailLines: ['命中後疊加燃燒'],
});

describe('createLootLayout', () => {
  it('fits twenty non-material drops on one page and allows only one skill', () => {
    const model = createLootLayout({
      materials: [
        { id: 'iron', name: '邊境鐵', quantity: 12 },
        { id: 'ash', name: '灰牙粉', quantity: 8 },
      ],
      entries: [...Array.from({ length: 19 }, (_, index) => equipment(index)), skill(1), skill(2)],
    });

    expect(model.grid).toEqual({ columns: 4, rows: 5, capacity: 20 });
    expect(model.entries).toHaveLength(20);
    expect(model.entries.filter(({ kind }) => kind === 'skill')).toHaveLength(1);
    expect(model.materials).toHaveLength(2);
    expect(model.materials.every(({ id }) => !model.entries.some((entry) => entry.id === id))).toBe(
      true,
    );
  });

  it('uses rarity rather than element for color and opens details in place', () => {
    const entries = [
      equipment(1, 'common'),
      equipment(2, 'uncommon'),
      equipment(3, 'rare'),
      equipment(4, 'epic'),
      equipment(5, 'legendary'),
    ];
    const model = createLootLayout({ materials: [], entries }, 'equipment-4');

    expect(model.entries.map(({ color }) => color)).toEqual([
      RARITY_COLORS.common,
      RARITY_COLORS.uncommon,
      RARITY_COLORS.rare,
      RARITY_COLORS.epic,
      RARITY_COLORS.legendary,
    ]);
    expect(model.detail).toMatchObject({
      id: 'equipment-4',
      name: '裝備 4',
      restoreFocusId: 'equipment-4',
    });
    expect(closeLootDetail(model.detail!)).toEqual({
      selectedId: undefined,
      focusId: 'equipment-4',
    });
  });
});
