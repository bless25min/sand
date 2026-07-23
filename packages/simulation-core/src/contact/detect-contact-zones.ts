import type {
  ContactZone,
  GridCellState,
  GridState,
  MonsterGroupState,
  UnitState,
  Vec2,
} from '@expedition/shared-types';

export interface DetectContactZonesInput {
  readonly grid: GridState;
  readonly units: readonly UnitState[];
  readonly monsterGroups: readonly MonsterGroupState[];
}

interface ActorFaction {
  readonly id: string;
  readonly factionId: string;
}

function normalize(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0) {
    return { x: 1, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function actorIdsForFaction(
  cell: GridCellState,
  factionId: string,
  actorById: ReadonlyMap<string, ActorFaction>,
): string[] {
  return [...cell.activeUnitIds, ...cell.activeMonsterIds].filter(
    (actorId) => actorById.get(actorId)?.factionId === factionId,
  );
}

function createZone(
  cell: GridCellState,
  actorById: ReadonlyMap<string, ActorFaction>,
): ContactZone | undefined {
  const factions = Object.entries(cell.factionDensity)
    .filter(([, density]) => density > 0)
    .sort(([firstId, firstDensity], [secondId, secondDensity]) => {
      const densityDifference = secondDensity - firstDensity;
      return densityDifference === 0 ? firstId.localeCompare(secondId) : densityDifference;
    });
  const attacker = factions[0];
  const defender = factions[1];

  if (attacker === undefined || defender === undefined) {
    return undefined;
  }

  const attackingFactionId = attacker[0];
  const defendingFactionId = defender[0];

  return {
    id: `contact-${cell.index}-${attackingFactionId}-${defendingFactionId}`,
    cellIndices: [cell.index],
    attackingFactionId,
    defendingFactionId,
    attackingUnitIds: actorIdsForFaction(cell, attackingFactionId, actorById),
    defendingUnitIds: actorIdsForFaction(cell, defendingFactionId, actorById),
    contactNormal: normalize(cell.factionFlow[attackingFactionId] ?? { x: 1, y: 0 }),
    width: 1,
    attackingPressure: 0,
    defendingPressure: 0,
    contactType: 'FRONTAL',
  };
}

export function detectContactZones(input: DetectContactZonesInput): ContactZone[] {
  const actorById = new Map<string, ActorFaction>();

  for (const unit of input.units) {
    actorById.set(unit.id, unit);
  }

  for (const monsterGroup of input.monsterGroups) {
    actorById.set(monsterGroup.id, monsterGroup);
  }

  const zones: ContactZone[] = [];

  for (const cell of input.grid.cells) {
    const zone = createZone(cell, actorById);

    if (zone !== undefined) {
      zones.push(zone);
    }
  }

  return zones;
}
