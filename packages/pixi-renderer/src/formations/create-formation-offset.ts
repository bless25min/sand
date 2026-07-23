import type { FormationType, Vec2 } from '@expedition/shared-types';

export interface CreateFormationOffsetInput {
  readonly pointIndex: number;
  readonly pointCount: number;
  readonly formation: FormationType;
  readonly spacing: number;
  readonly animationSeed: number;
}

function centeredGrid(
  pointIndex: number,
  pointCount: number,
  columnCount: number,
  spacing: number,
): Vec2 {
  const rowCount = Math.ceil(pointCount / columnCount);
  const column = pointIndex % columnCount;
  const row = Math.floor(pointIndex / columnCount);

  return {
    x: (column - (columnCount - 1) / 2) * spacing,
    y: (row - (rowCount - 1) / 2) * spacing,
  };
}

function seededUnit(seed: number, salt: number): number {
  let value = (seed + salt * 0x9e3779b9) | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4_294_967_296;
}

function squarePerimeter(pointIndex: number, pointCount: number, spacing: number): Vec2 {
  const slotsPerSide = Math.max(1, Math.ceil(pointCount / 4));
  const side = Math.min(3, Math.floor(pointIndex / slotsPerSide));
  const slot = pointIndex % slotsPerSide;
  const extent = ((slotsPerSide - 1) * spacing) / 2;
  const along = slot * spacing - extent;

  switch (side) {
    case 0:
      return { x: along, y: -extent };
    case 1:
      return { x: extent, y: along };
    case 2:
      return { x: -along, y: extent };
    case 3:
      return { x: -extent, y: -along };
    default:
      throw new RangeError(`square perimeter side ${side} is invalid`);
  }
}

function wedge(pointIndex: number, pointCount: number, spacing: number): Vec2 {
  let row = 0;
  let firstIndexInRow = 0;

  while (pointIndex >= firstIndexInRow + row + 1) {
    firstIndexInRow += row + 1;
    row += 1;
  }

  const indexInRow = pointIndex - firstIndexInRow;
  const rowCount = Math.ceil((Math.sqrt(pointCount * 8 + 1) - 1) / 2);

  return {
    x: (indexInRow - row / 2) * spacing,
    y: (row - (rowCount - 1) / 2) * spacing,
  };
}

export function createFormationOffset(input: CreateFormationOffsetInput): Vec2 {
  if (!Number.isInteger(input.pointCount) || input.pointCount <= 0) {
    throw new RangeError('pointCount must be a positive integer');
  }

  if (
    !Number.isInteger(input.pointIndex) ||
    input.pointIndex < 0 ||
    input.pointIndex >= input.pointCount
  ) {
    throw new RangeError('pointIndex must be within pointCount');
  }

  if (!Number.isFinite(input.spacing) || input.spacing <= 0) {
    throw new RangeError('spacing must be greater than zero');
  }

  if (!Number.isFinite(input.animationSeed)) {
    throw new RangeError('animationSeed must be finite');
  }

  const squareColumns = Math.ceil(Math.sqrt(input.pointCount));

  switch (input.formation) {
    case 'DENSE_BLOCK':
      return centeredGrid(input.pointIndex, input.pointCount, squareColumns, input.spacing * 0.8);
    case 'LINE':
      return centeredGrid(
        input.pointIndex,
        input.pointCount,
        Math.max(1, Math.ceil(Math.sqrt(input.pointCount) * 2)),
        input.spacing,
      );
    case 'COLUMN':
      return centeredGrid(
        input.pointIndex,
        input.pointCount,
        Math.max(1, Math.ceil(Math.sqrt(input.pointCount) / 2)),
        input.spacing,
      );
    case 'LOOSE': {
      const base = centeredGrid(
        input.pointIndex,
        input.pointCount,
        squareColumns,
        input.spacing * 1.6,
      );
      return {
        x: base.x + (seededUnit(input.animationSeed, 1) - 0.5) * input.spacing * 0.7,
        y: base.y + (seededUnit(input.animationSeed, 2) - 0.5) * input.spacing * 0.7,
      };
    }
    case 'SQUARE':
      return squarePerimeter(input.pointIndex, input.pointCount, input.spacing);
    case 'WEDGE':
      return wedge(input.pointIndex, input.pointCount, input.spacing);
  }
}
