import { createMonsterGroupState, createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { createGrid } from './create-grid';
import { projectBattlefield } from './project-battlefield';

function totalDensity(cells: ReturnType<typeof projectBattlefield>['cells']): number {
  return cells.reduce(
    (total, cell) =>
      total + Object.values(cell.factionDensity).reduce((sum, value) => sum + value, 0),
    0,
  );
}

describe('projectBattlefield', () => {
  it('adds overlapping actor density and troop-weighted metrics by faction', () => {
    const grid = createGrid({ width: 2, height: 1 });
    const units = [
      createUnitState({
        id: 'heavy-1',
        position: { x: 0.2, y: 0 },
        troopCount: 100,
        morale: 1,
        cohesion: 1,
        direction: { x: 1, y: 0 },
      }),
      createUnitState({
        id: 'heavy-2',
        position: { x: 0.8, y: 0 },
        troopCount: 50,
        morale: 0.4,
        cohesion: 0.7,
        direction: { x: 0, y: 1 },
      }),
    ];
    const monsters = [
      createMonsterGroupState({
        id: 'wolves-1',
        position: { x: 0.4, y: 0 },
        troopCount: 20,
      }),
    ];

    const projected = projectBattlefield({ grid, units, monsterGroups: monsters });
    const cell = projected.cells[0];

    expect(cell?.factionDensity).toEqual({
      player: 150,
      monsters: 20,
    });
    expect(cell?.factionMorale.player).toBeCloseTo(0.8);
    expect(cell?.factionCohesion.player).toBeCloseTo(0.9);
    expect(cell?.factionFlow.player).toEqual({
      x: 2 / 3,
      y: 1 / 3,
    });
    expect(cell?.activeUnitIds).toEqual(['heavy-1', 'heavy-2']);
    expect(cell?.activeMonsterIds).toEqual(['wolves-1']);
    expect(cell?.isActiveContactCell).toBe(true);
    expect(totalDensity(projected.cells)).toBe(170);
  });

  it('moves density between projections without mutating terrain or the source grid', () => {
    const grid = createGrid({
      width: 2,
      height: 1,
      terrainAt: ({ index }) => ({
        terrain: index === 0 ? 'ROAD' : 'MUD',
        height: 0,
        movementCost: index === 0 ? 0.75 : 2,
      }),
    });
    const firstUnit = createUnitState({
      position: { x: 0.2, y: 0 },
      troopCount: 100,
    });
    const first = projectBattlefield({
      grid,
      units: [firstUnit],
      monsterGroups: [],
    });
    const second = projectBattlefield({
      grid,
      units: [
        {
          ...firstUnit,
          position: { x: 1.2, y: 0 },
        },
      ],
      monsterGroups: [],
    });

    expect(first.cells[0]?.factionDensity.player).toBe(100);
    expect(second.cells[0]?.factionDensity).toEqual({});
    expect(second.cells[1]?.factionDensity.player).toBe(100);
    expect(second.cells[1]?.terrain).toBe('MUD');
    expect(second.cells[1]?.movementCost).toBe(2);
    expect(grid.cells[0]?.factionDensity).toEqual({});
    expect(totalDensity(second.cells)).toBe(100);
  });

  it('does not project zero-troop actors', () => {
    const projected = projectBattlefield({
      grid: createGrid({ width: 1, height: 1 }),
      units: [createUnitState({ troopCount: 0 })],
      monsterGroups: [],
    });

    expect(projected.cells[0]?.factionDensity).toEqual({});
    expect(projected.cells[0]?.activeUnitIds).toEqual([]);
  });
});
