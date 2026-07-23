import type { MaterialDefinition, MaterialId } from '@expedition/shared-types';

export const GREYFANG_MATERIALS: readonly MaterialDefinition[] = [
  {
    id: 'WOLF_PELT',
    name: '狼皮',
    unitWeight: 0.75,
    tags: ['HIDE', 'FLEXIBLE'],
  },
  {
    id: 'MONSTER_FANG',
    name: '魔獸牙',
    unitWeight: 0.2,
    tags: ['BONE', 'HARD'],
  },
  {
    id: 'HORN_PLATE',
    name: '角甲',
    unitWeight: 2,
    tags: ['CARAPACE', 'HEAVY'],
  },
];

const MATERIALS_BY_ID = new Map(GREYFANG_MATERIALS.map((material) => [material.id, material]));

export function getMaterialDefinition(materialId: MaterialId): MaterialDefinition {
  const definition = MATERIALS_BY_ID.get(materialId);

  if (definition === undefined) {
    throw new RangeError(`unknown material ${materialId}`);
  }

  return definition;
}
