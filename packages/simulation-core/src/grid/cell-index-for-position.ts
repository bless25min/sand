import type { Vec2 } from '@expedition/shared-types';

import { assertPositiveGridDimension } from './assert-positive-grid-dimension';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function cellIndexForPosition(position: Vec2, width: number, height: number): number {
  assertPositiveGridDimension(width, 'width');
  assertPositiveGridDimension(height, 'height');

  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    throw new RangeError('position must contain finite coordinates');
  }

  const x = clamp(Math.floor(position.x), 0, width - 1);
  const y = clamp(Math.floor(position.y), 0, height - 1);

  return y * width + x;
}
