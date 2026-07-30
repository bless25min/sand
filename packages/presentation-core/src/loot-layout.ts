import type { GuildItemRarity, MaterialReward } from '@expedition/shared-types';

export const RARITY_COLORS: Readonly<Record<GuildItemRarity, string>> = {
  common: '#aeb8b3',
  uncommon: '#67d27d',
  rare: '#57a9ff',
  epic: '#b875f4',
  legendary: '#ffb53d',
};

export interface LootEntryInput {
  id: string;
  kind: 'equipment' | 'skill';
  name: string;
  rarity: GuildItemRarity;
  summary: string;
  detailLines: readonly string[];
}

export interface LootEntryModel extends LootEntryInput {
  color: string;
  revealIndex: number;
}

export interface LootDetailModel extends LootEntryModel {
  restoreFocusId: string;
}

export interface LootLayoutModel {
  materials: readonly MaterialReward[];
  entries: readonly LootEntryModel[];
  grid: { columns: 4; rows: 5; capacity: 20 };
  detail?: LootDetailModel;
}

export function createLootLayout(
  input: {
    materials: readonly MaterialReward[];
    entries: readonly LootEntryInput[];
  },
  selectedId?: string,
): LootLayoutModel {
  let skillIncluded = false;
  const visibleEntries = input.entries
    .filter((entry) => {
      if (entry.kind !== 'skill') return true;
      if (skillIncluded) return false;
      skillIncluded = true;
      return true;
    })
    .slice(0, 20)
    .map((entry, revealIndex): LootEntryModel => ({
      ...entry,
      color: RARITY_COLORS[entry.rarity] ?? RARITY_COLORS.common,
      revealIndex,
    }));
  const selected = visibleEntries.find(({ id }) => id === selectedId);

  return {
    materials: input.materials,
    entries: visibleEntries,
    grid: { columns: 4, rows: 5, capacity: 20 },
    ...(selected ? { detail: { ...selected, restoreFocusId: selected.id } } : {}),
  };
}

export function closeLootDetail(detail: LootDetailModel): {
  selectedId: undefined;
  focusId: string;
} {
  return { selectedId: undefined, focusId: detail.restoreFocusId };
}
