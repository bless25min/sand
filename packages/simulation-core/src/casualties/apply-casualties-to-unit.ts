import type { UnitState } from '@expedition/shared-types';

import type { CasualtyAllocation } from './casualty-allocation';

function allocationTotal(allocation: CasualtyAllocation): number {
  return (
    allocation.wounded +
    allocation.dead +
    allocation.routed +
    allocation.missing +
    allocation.captured
  );
}

function accountedTroops(unit: UnitState): number {
  return (
    unit.troopCount +
    unit.woundedCount +
    unit.deadCount +
    unit.routedCount +
    unit.missingCount +
    unit.capturedCount
  );
}

export function applyCasualtiesToUnit(unit: UnitState, allocation: CasualtyAllocation): UnitState {
  const values = [
    allocation.wounded,
    allocation.dead,
    allocation.routed,
    allocation.missing,
    allocation.captured,
  ];

  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new RangeError('casualty allocation values must be non-negative integers');
  }

  if (accountedTroops(unit) !== unit.initialTroopCount) {
    throw new RangeError('source unit violates force conservation');
  }

  const total = allocationTotal(allocation);

  if (total > unit.troopCount) {
    throw new RangeError('casualty allocation exceeds active troop count');
  }

  return {
    ...unit,
    troopCount: unit.troopCount - total,
    woundedCount: unit.woundedCount + allocation.wounded,
    deadCount: unit.deadCount + allocation.dead,
    routedCount: unit.routedCount + allocation.routed,
    missingCount: unit.missingCount + allocation.missing,
    capturedCount: unit.capturedCount + allocation.captured,
  };
}
