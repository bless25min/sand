import type { GridCellState, GridState, TerrainType, Vec2 } from '@expedition/shared-types';

import { assertPositiveGridDimension } from './assert-positive-grid-dimension';

const DEFAULT_GRID_SIZE = 128;

export interface TerrainCellDefinition {
  readonly terrain: TerrainType;
  readonly height: number;
  readonly movementCost: number;
}

export interface TerrainCellContext {
  readonly index: number;
  readonly position: Vec2;
}

export interface CreateGridInput {
  readonly width?: number;
  readonly height?: number;
  readonly terrainAt?: (context: TerrainCellContext) => TerrainCellDefinition;
}

const DEFAULT_TERRAIN: TerrainCellDefinition = {
  terrain: 'PLAIN',
  height: 0,
  movementCost: 1,
};

function createCell(
  index: number,
  width: number,
  terrainAt: CreateGridInput['terrainAt'],
): GridCellState {
  const position = {
    x: index % width,
    y: Math.floor(index / width),
  };
  const terrain = terrainAt?.({ index, position }) ?? DEFAULT_TERRAIN;

  if (!Number.isFinite(terrain.movementCost) || terrain.movementCost <= 0) {
    throw new RangeError('terrain movementCost must be greater than zero');
  }

  return {
    index,
    position,
    terrain: terrain.terrain,
    height: terrain.height,
    movementCost: terrain.movementCost,
    factionDensity: {},
    factionPressure: {},
    factionMorale: {},
    factionCohesion: {},
    factionFlow: {},
    activeUnitIds: [],
    activeMonsterIds: [],
    environmentalEffects: [],
    isActiveContactCell: false,
  };
}

export function createGrid(input: CreateGridInput = {}): GridState {
  const width = input.width ?? DEFAULT_GRID_SIZE;
  const height = input.height ?? DEFAULT_GRID_SIZE;
  assertPositiveGridDimension(width, 'width');
  assertPositiveGridDimension(height, 'height');

  return {
    width,
    height,
    cells: Array.from({ length: width * height }, (_, index) =>
      createCell(index, width, input.terrainAt),
    ),
  };
}
