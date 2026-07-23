import type { Vec2 } from '@expedition/shared-types';

import type { VisualPoint } from '../contracts/visual-point';

export interface AdvanceVisualPointInput {
  readonly point: VisualPoint;
  readonly deltaSeconds: number;
  readonly interpolationRate: number;
  readonly casualtyFadeSeconds: number;
  readonly routingFlow?: Vec2;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function interpolate(first: Vec2, second: Vec2, progress: number): Vec2 {
  return {
    x: first.x + (second.x - first.x) * progress,
    y: first.y + (second.y - first.y) * progress,
  };
}

function routingOffset(
  point: VisualPoint,
  flow: Vec2,
  deltaSeconds: number,
  nextAge: number,
): Vec2 {
  const length = Math.hypot(flow.x, flow.y);
  const perpendicular =
    length === 0
      ? { x: 0, y: 1 }
      : {
          x: -flow.y / length,
          y: flow.x / length,
        };
  const phase = ((point.animationSeed % 360) * Math.PI) / 180;
  const wobble = Math.sin(phase + nextAge * 4) * 0.35 * deltaSeconds;

  return {
    x: flow.x * deltaSeconds + perpendicular.x * wobble,
    y: flow.y * deltaSeconds + perpendicular.y * wobble,
  };
}

export function advanceVisualPoint(input: AdvanceVisualPointInput): VisualPoint {
  if (!Number.isFinite(input.deltaSeconds) || input.deltaSeconds < 0) {
    throw new RangeError('deltaSeconds must be a non-negative finite number');
  }

  if (!Number.isFinite(input.interpolationRate) || input.interpolationRate < 0) {
    throw new RangeError('interpolationRate must be a non-negative finite number');
  }

  if (!Number.isFinite(input.casualtyFadeSeconds) || input.casualtyFadeSeconds <= 0) {
    throw new RangeError('casualtyFadeSeconds must be greater than zero');
  }

  const nextAge = input.point.stateAgeSeconds + input.deltaSeconds;

  if (input.point.state === 'CASUALTY') {
    return {
      ...input.point,
      alpha: clamp(1 - nextAge / input.casualtyFadeSeconds, 0, 1),
      stateAgeSeconds: nextAge,
    };
  }

  const progress = clamp(input.deltaSeconds * input.interpolationRate, 0, 1);
  const interpolated = interpolate(input.point.position, input.point.targetPosition, progress);

  if (input.point.state === 'ROUTING') {
    const offset = routingOffset(
      input.point,
      input.routingFlow ?? { x: 0, y: 0 },
      input.deltaSeconds,
      nextAge,
    );

    return {
      ...input.point,
      position: {
        x: interpolated.x + offset.x,
        y: interpolated.y + offset.y,
      },
      stateAgeSeconds: nextAge,
    };
  }

  return {
    ...input.point,
    position: interpolated,
    stateAgeSeconds: nextAge,
  };
}
