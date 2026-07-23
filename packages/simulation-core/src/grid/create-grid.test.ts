import { describe, expect, it } from 'vitest';

import { createGrid } from './create-grid';

describe('createGrid', () => {
  it('creates the default 128 by 128 empty grid', () => {
    const grid = createGrid();

    expect(grid.width).toBe(128);
    expect(grid.height).toBe(128);
    expect(grid.cells).toHaveLength(16_384);
    expect(grid.cells[0]).toMatchObject({
      index: 0,
      position: { x: 0, y: 0 },
      terrain: 'PLAIN',
      height: 0,
      movementCost: 1,
      factionDensity: {},
      factionPressure: {},
      factionMorale: {},
      factionCohesion: {},
      factionFlow: {},
      activeUnitIds: [],
      activeMonsterIds: [],
      environmentalEffects: [],
      isActiveContactCell: false,
    });
  });

  it('uses a terrain callback for focused grids', () => {
    const grid = createGrid({
      width: 2,
      height: 1,
      terrainAt: ({ index }) =>
        index === 0
          ? { terrain: 'ROAD', height: 0, movementCost: 0.75 }
          : { terrain: 'MUD', height: -1, movementCost: 2 },
    });

    expect(grid.cells[0]).toMatchObject({
      terrain: 'ROAD',
      movementCost: 0.75,
    });
    expect(grid.cells[1]).toMatchObject({
      terrain: 'MUD',
      height: -1,
      movementCost: 2,
    });
  });

  it('rejects invalid dimensions', () => {
    expect(() => createGrid({ width: 0, height: 1 })).toThrow('width must be a positive integer');
    expect(() => createGrid({ width: 1.5, height: 1 })).toThrow('width must be a positive integer');
  });
});
