import type { Vec2 } from '../primitives/vec2';
import type { TerrainType } from './terrain-type';

export interface GridCellState {
  readonly index: number;
  readonly position: Vec2;
  readonly terrain: TerrainType;
  readonly height: number;
  readonly movementCost: number;
  readonly factionDensity: Readonly<Record<string, number>>;
  readonly factionPressure: Readonly<Record<string, number>>;
  readonly factionMorale: Readonly<Record<string, number>>;
  readonly factionCohesion: Readonly<Record<string, number>>;
  readonly factionFlow: Readonly<Record<string, Vec2>>;
  readonly activeUnitIds: readonly string[];
  readonly activeMonsterIds: readonly string[];
  readonly environmentalEffects: readonly string[];
  readonly isActiveContactCell: boolean;
}

export interface GridState {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly GridCellState[];
}
