import type { VisualPoint } from '../contracts/visual-point';

function activePointsByUnit(points: readonly VisualPoint[]): Map<string, VisualPoint[]> {
  const result = new Map<string, VisualPoint[]>();

  for (const point of points) {
    if (point.state === 'CASUALTY') continue;
    const unitPoints = result.get(point.unitId) ?? [];
    unitPoints.push(point);
    result.set(point.unitId, unitPoints);
  }

  return result;
}

function stopped(point: VisualPoint): VisualPoint {
  return {
    ...point,
    targetPosition: point.position,
  };
}

export function reconcileVisualPoints(
  previous: readonly VisualPoint[],
  next: readonly VisualPoint[],
): VisualPoint[] {
  const previousByUnit = activePointsByUnit(previous);
  const nextIndexes = new Map<string, number>();
  const matchedPrevious = new Set<VisualPoint>();
  const reconciled = next.map((point) => {
    const localIndex = nextIndexes.get(point.unitId) ?? 0;
    nextIndexes.set(point.unitId, localIndex + 1);
    const previousPoint = previousByUnit.get(point.unitId)?.[localIndex];

    if (previousPoint === undefined) return stopped(point);
    matchedPrevious.add(previousPoint);
    return {
      ...point,
      position: previousPoint.position,
      targetPosition: point.position,
      stateAgeSeconds: 0,
    };
  });
  const existingCasualties = previous.filter((point) => point.state === 'CASUALTY');
  let casualtyId = Math.max(
    -1,
    ...next.map(({ id }) => id),
    ...existingCasualties.map(({ id }) => id),
  );
  const newCasualties = previous
    .filter((point) => point.state !== 'CASUALTY' && !matchedPrevious.has(point))
    .map((point) => ({
      ...point,
      id: (casualtyId += 1),
      targetPosition: point.position,
      state: 'CASUALTY' as const,
      stateAgeSeconds: 0,
    }));

  return [...reconciled, ...existingCasualties, ...newCasualties];
}
