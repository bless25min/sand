import type { FormationType, UnitExecutionState, Vec2 } from '@expedition/shared-types';

import type { PointShape } from './point-shape';

export interface VisualUnitSource {
  readonly id: string;
  readonly factionId: string;
  readonly troopCount: number;
  readonly position: Vec2;
  readonly targetPosition: Vec2;
  readonly direction: Vec2;
  readonly formation: FormationType;
  readonly executionState: UnitExecutionState;
  readonly shape: PointShape;
  readonly color: number;
  readonly pointScale: number;
}
