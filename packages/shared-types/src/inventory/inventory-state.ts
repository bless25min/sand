import type { EquipmentInstance } from '../equipment/equipment-instance';
import type { MaterialId } from '../items/material-id';

export interface InventoryStack {
  readonly materialId: MaterialId;
  readonly quantity: number;
}

export interface InventoryState {
  readonly capacityWeight: number;
  readonly stacks: readonly InventoryStack[];
  readonly equipment: readonly EquipmentInstance[];
}
