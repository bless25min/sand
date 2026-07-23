import type {
  GridCellState,
  GridState,
  MonsterGroupState,
  UnitState,
  Vec2,
} from '@expedition/shared-types';

import { cellIndexForPosition } from './cell-index-for-position';

export interface ProjectBattlefieldInput {
  readonly grid: GridState;
  readonly units: readonly UnitState[];
  readonly monsterGroups: readonly MonsterGroupState[];
}

interface ActorProjection {
  readonly id: string;
  readonly factionId: string;
  readonly troopCount: number;
  readonly position: Vec2;
  readonly direction: Vec2;
  readonly morale: number;
  readonly cohesion: number;
}

interface FactionAccumulator {
  density: number;
  weightedMorale: number;
  weightedCohesion: number;
  weightedFlowX: number;
  weightedFlowY: number;
}

interface CellAccumulator {
  readonly factions: Map<string, FactionAccumulator>;
  readonly activeUnitIds: string[];
  readonly activeMonsterIds: string[];
}

function createAccumulator(): CellAccumulator {
  return {
    factions: new Map(),
    activeUnitIds: [],
    activeMonsterIds: [],
  };
}

function addActor(
  accumulator: CellAccumulator,
  actor: ActorProjection,
  actorKind: 'UNIT' | 'MONSTER',
): void {
  if (!Number.isInteger(actor.troopCount) || actor.troopCount < 0) {
    throw new RangeError(`actor ${actor.id} troopCount must be a non-negative integer`);
  }

  if (actor.troopCount === 0) {
    return;
  }

  const faction = accumulator.factions.get(actor.factionId) ?? {
    density: 0,
    weightedMorale: 0,
    weightedCohesion: 0,
    weightedFlowX: 0,
    weightedFlowY: 0,
  };
  faction.density += actor.troopCount;
  faction.weightedMorale += actor.morale * actor.troopCount;
  faction.weightedCohesion += actor.cohesion * actor.troopCount;
  faction.weightedFlowX += actor.direction.x * actor.troopCount;
  faction.weightedFlowY += actor.direction.y * actor.troopCount;
  accumulator.factions.set(actor.factionId, faction);

  if (actorKind === 'UNIT') {
    accumulator.activeUnitIds.push(actor.id);
  } else {
    accumulator.activeMonsterIds.push(actor.id);
  }
}

function materializeCell(cell: GridCellState, accumulator: CellAccumulator): GridCellState {
  const factionDensity: Record<string, number> = {};
  const factionMorale: Record<string, number> = {};
  const factionCohesion: Record<string, number> = {};
  const factionFlow: Record<string, Vec2> = {};

  for (const [factionId, faction] of accumulator.factions) {
    factionDensity[factionId] = faction.density;
    factionMorale[factionId] = faction.weightedMorale / faction.density;
    factionCohesion[factionId] = faction.weightedCohesion / faction.density;
    factionFlow[factionId] = {
      x: faction.weightedFlowX / faction.density,
      y: faction.weightedFlowY / faction.density,
    };
  }

  return {
    index: cell.index,
    position: cell.position,
    terrain: cell.terrain,
    height: cell.height,
    movementCost: cell.movementCost,
    factionDensity,
    factionPressure: {},
    factionMorale,
    factionCohesion,
    factionFlow,
    activeUnitIds: [...accumulator.activeUnitIds],
    activeMonsterIds: [...accumulator.activeMonsterIds],
    environmentalEffects: [...cell.environmentalEffects],
    isActiveContactCell: accumulator.factions.size >= 2,
  };
}

export function projectBattlefield(input: ProjectBattlefieldInput): GridState {
  const expectedCellCount = input.grid.width * input.grid.height;

  if (input.grid.cells.length !== expectedCellCount) {
    throw new RangeError('grid cell count must equal width multiplied by height');
  }

  const accumulators = Array.from({ length: expectedCellCount }, createAccumulator);

  for (const unit of input.units) {
    const index = cellIndexForPosition(unit.position, input.grid.width, input.grid.height);
    const accumulator = accumulators[index];

    if (accumulator === undefined) {
      throw new RangeError(`grid cell ${index} does not exist`);
    }

    addActor(accumulator, unit, 'UNIT');
  }

  for (const monsterGroup of input.monsterGroups) {
    const index = cellIndexForPosition(monsterGroup.position, input.grid.width, input.grid.height);
    const accumulator = accumulators[index];

    if (accumulator === undefined) {
      throw new RangeError(`grid cell ${index} does not exist`);
    }

    addActor(accumulator, monsterGroup, 'MONSTER');
  }

  return {
    width: input.grid.width,
    height: input.grid.height,
    cells: input.grid.cells.map((cell, index) => {
      const accumulator = accumulators[index];

      if (accumulator === undefined) {
        throw new RangeError(`grid accumulator ${index} does not exist`);
      }

      return materializeCell(cell, accumulator);
    }),
  };
}
