export function allocatePointCounts(troopCounts: readonly number[], pointBudget: number): number[] {
  if (!Number.isInteger(pointBudget) || pointBudget < 0) {
    throw new RangeError('point budget must be a non-negative integer');
  }

  if (troopCounts.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new RangeError('troop counts must be non-negative integers');
  }

  const totalTroops = troopCounts.reduce((sum, value) => sum + value, 0);
  const targetPointCount = Math.min(totalTroops, pointBudget);

  if (totalTroops === 0 || targetPointCount === 0) {
    return troopCounts.map(() => 0);
  }

  const quotas = troopCounts.map((troopCount) => (troopCount / totalTroops) * targetPointCount);
  const allocations = quotas.map(Math.floor);
  let remaining = targetPointCount - allocations.reduce((sum, value) => sum + value, 0);
  const allocationOrder = quotas
    .map((quota, index) => ({
      index,
      remainder: quota - Math.floor(quota),
    }))
    .sort((first, second) => second.remainder - first.remainder || first.index - second.index);

  for (const candidate of allocationOrder) {
    if (remaining === 0) {
      break;
    }

    const current = allocations[candidate.index];

    if (current === undefined) {
      throw new RangeError(`allocation ${candidate.index} does not exist`);
    }

    allocations[candidate.index] = current + 1;
    remaining -= 1;
  }

  return allocations;
}
