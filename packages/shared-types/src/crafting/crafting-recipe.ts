import type { MaterialId } from '../items/material-id';

export interface RecipeIngredient {
  readonly materialId: MaterialId;
  readonly quantity: number;
}

export interface CraftingRecipe {
  readonly id: string;
  readonly name: string;
  readonly outputEquipmentDefinitionId: string;
  readonly ingredients: readonly RecipeIngredient[];
}
