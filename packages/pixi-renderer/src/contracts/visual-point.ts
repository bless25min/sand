import type { Vec2 } from '@expedition/shared-types';

import type { PointShape } from './point-shape';
import type { PointState } from './point-state';

export interface VisualPoint {
  readonly id: number;
  readonly unitId: string;
  readonly factionId: string;
  readonly position: Vec2;
  readonly targetPosition: Vec2;
  readonly rotation: number;
  readonly scale: number;
  readonly alpha: number;
  readonly shape: PointShape;
  readonly color: number;
  readonly state: PointState;
  readonly stateAgeSeconds: number;
  readonly animationSeed: number;
}
