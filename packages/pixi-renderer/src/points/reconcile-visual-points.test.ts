import { describe, expect, it } from 'vitest';

import type { VisualPoint } from '../contracts/visual-point';
import { reconcileVisualPoints } from './reconcile-visual-points';

function point(
  id: number,
  unitId: string,
  x: number,
  state: VisualPoint['state'] = 'ACTIVE',
): VisualPoint {
  return {
    id,
    unitId,
    factionId: 'test',
    position: { x, y: 10 },
    targetPosition: { x: x + 99, y: 10 },
    rotation: 0,
    scale: 1,
    alpha: 1,
    shape: 'CIRCLE',
    color: 0xffffff,
    state,
    stateAgeSeconds: 0,
    animationSeed: id,
  };
}

describe('reconcileVisualPoints', () => {
  it('animates an existing point from its rendered position to the new snapshot position', () => {
    const result = reconcileVisualPoints([point(8, 'heavy', 5)], [point(0, 'heavy', 20)]);

    expect(result[0]).toMatchObject({
      id: 0,
      position: { x: 5, y: 10 },
      targetPosition: { x: 20, y: 10 },
    });
  });

  it('matches points by unit-local order when global point ids shift', () => {
    const previous = [point(0, 'archers', 3), point(1, 'wolves', 30)];
    const next = [point(0, 'wolves', 40)];

    expect(reconcileVisualPoints(previous, next)[0]?.position.x).toBe(30);
  });

  it('starts a newly allocated point at its current snapshot position', () => {
    const result = reconcileVisualPoints([], [point(0, 'heavy', 20)]);

    expect(result[0]).toMatchObject({
      position: { x: 20, y: 10 },
      targetPosition: { x: 20, y: 10 },
    });
  });

  it('turns removed active points into fading casualties', () => {
    const previous = [point(0, 'heavy', 5), point(1, 'heavy', 6)];
    const result = reconcileVisualPoints(previous, [point(0, 'heavy', 20)]);

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      position: { x: 6, y: 10 },
      targetPosition: { x: 6, y: 10 },
      state: 'CASUALTY',
      stateAgeSeconds: 0,
    });
  });

  it('retains casualties that are still fading across later snapshots', () => {
    const casualty = { ...point(9, 'heavy', 6, 'CASUALTY'), alpha: 0.5 };
    const result = reconcileVisualPoints([point(0, 'heavy', 5), casualty], [
      point(0, 'heavy', 20),
    ]);

    expect(result).toContainEqual(casualty);
  });
});
