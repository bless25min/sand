import type { EquipmentDefinition, EquipmentInstance, UnitState } from '@expedition/shared-types';

export interface EquipUnitInput {
  readonly unit: UnitState;
  readonly equipmentInstance: EquipmentInstance;
  readonly definition: EquipmentDefinition;
}

export function equipUnit(input: EquipUnitInput): UnitState {
  if (input.equipmentInstance.definitionId !== input.definition.id) {
    throw new RangeError('equipment instance does not match definition');
  }

  if (!input.definition.allowedUnitTypes.includes(input.unit.unitType)) {
    throw new RangeError(
      `${input.definition.name} requires ${input.definition.allowedUnitTypes.join(' or ')}`,
    );
  }

  if (input.unit.equipmentIds.includes(input.equipmentInstance.id)) {
    throw new RangeError(`equipment ${input.equipmentInstance.id} is already equipped`);
  }

  return {
    ...input.unit,
    frontalDefense: input.unit.frontalDefense + input.definition.frontalDefenseBonus,
    mobility: Number((input.unit.mobility * input.definition.mobilityMultiplier).toFixed(4)),
    equipmentWeight: input.unit.equipmentWeight + input.definition.weight,
    equipmentIds: [...input.unit.equipmentIds, input.equipmentInstance.id],
    appearanceIds: [...input.unit.appearanceIds, input.definition.appearanceId],
  };
}
