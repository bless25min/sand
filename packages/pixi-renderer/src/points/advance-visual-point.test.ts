import type { VisualPoint } from '../contracts/visual-point';
import { describe, expect, it } from 'vitest';

import { advanceVisualPoint } from './advance-visual-point';

const point: VisualPoint = {
  id: 1,
  unitId: 'heavy',
  factionId: 'player',
  position: { x: 0, y: 0 },
  targetPosition: { x: 10, y: 0 },
  rotation: 0,
  scale: 1,
  alpha: 1,
  shape: 'SQUARE',
  color: 0x5da9e9,
  state: 'ACTIVE',
  stateAgeSeconds: 0,
  animationSeed: 42,
};

describe('advanceVisualPoint', () => {
  it('interpolates active points without overshoot or mutation', () => {
    const sourceSnapshot = structuredClone(point);
    const next = advanceVisualPoint({
      point,
      deltaSeconds: 0.5,
      interpolationRate: 1,
      casualtyFadeSeconds: 2,
    });

    expect(next.position).toEqual({ x: 5, y: 0 });
    expect(next.stateAgeSeconds).toBe(0.5);
    expect(point).toEqual(sourceSnapshot);
  });

  it('keeps casualty points in place and fades their alpha', () => {
    const next = advanceVisualPoint({
      point: {
        ...point,
        state: 'CASUALTY',
      },
      deltaSeconds: 1,
      interpolationRate: 1,
      casualtyFadeSeconds: 2,
    });

    expect(next.position).toEqual(point.position);
    expect(next.alpha).toBe(0.5);
  });

  it('adds deterministic flow and lateral wobble to routing points', () => {
    const input = {
      point: {
        ...point,
        state: 'ROUTING' as const,
      },
      deltaSeconds: 0.25,
      interpolationRate: 1,
      casualtyFadeSeconds: 2,
      routingFlow: { x: -4, y: 0 },
    };
    const first = advanceVisualPoint(input);
    const second = advanceVisualPoint(input);

    expect(first).toEqual(second);
    expect(first.position.x).toBeLessThan(2.5);
    expect(first.position.y).not.toBe(0);
  });
});
