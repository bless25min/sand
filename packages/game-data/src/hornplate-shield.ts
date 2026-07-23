import type { CraftingRecipe, EquipmentDefinition } from '@expedition/shared-types';

export const HORNPLATE_SHIELD: EquipmentDefinition = {
  id: 'hornplate-heavy-shield',
  name: '角甲重盾',
  slot: 'SHIELD',
  allowedUnitTypes: ['HEAVY_INFANTRY'],
  weight: 3,
  frontalDefenseBonus: 6,
  mobilityMultiplier: 0.8,
  fatigueModifier: 0.15,
  appearanceId: 'HORNPLATE_SHIELD',
  tags: ['HEAVY', 'FRONTAL_DEFENSE', 'GREYFANG'],
};

export const HORNPLATE_SHIELD_RECIPE: CraftingRecipe = {
  id: 'recipe-hornplate-heavy-shield',
  name: '角甲重盾配方',
  outputEquipmentDefinitionId: HORNPLATE_SHIELD.id,
  ingredients: [
    { materialId: 'WOLF_PELT', quantity: 4 },
    { materialId: 'MONSTER_FANG', quantity: 6 },
    { materialId: 'HORN_PLATE', quantity: 2 },
  ],
};
