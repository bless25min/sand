import type { VisualUnitSource } from '@expedition/pixi-renderer';
import type { UnitExecutionState, UnitState, Vec2 } from '@expedition/shared-types';
import type { PlayableBattleState } from '@expedition/simulation-core';

const COLORS = {
  HEAVY_INFANTRY: 0x6fb6d9,
  ARCHER: 0xa7d8b1,
  CAVALRY: 0xe6c66b,
  HERO_TEAM: 0xd9a7e6,
} as const;

function screenPosition(position: Vec2): Vec2 {
  return { x: 105 + position.x * 10, y: 70 + position.y * 8 };
}

function unitSource(unit: UnitState): VisualUnitSource {
  return {
    id: unit.id,
    factionId: unit.factionId,
    troopCount: unit.troopCount,
    position: screenPosition(unit.position),
    targetPosition: screenPosition(unit.targetPosition ?? unit.position),
    direction: unit.direction,
    formation: unit.formation,
    executionState: unit.executionState,
    morale: unit.morale,
    fatigue: unit.fatigue,
    cohesion: unit.cohesion,
    shape:
      unit.unitType === 'HEAVY_INFANTRY'
        ? 'SQUARE'
        : unit.unitType === 'ARCHER'
          ? 'TRIANGLE'
          : unit.unitType === 'CAVALRY'
            ? 'DIAMOND'
            : 'CIRCLE',
    color: COLORS[unit.unitType],
    pointScale: unit.unitType === 'HERO_TEAM' ? 0.7 : 0.48,
    appearanceIds: unit.appearanceIds,
  };
}

function monsterExecutionState(state: string): UnitExecutionState {
  if (state === 'ROUTING') return 'ROUTING';
  if (state === 'RETREATING') return 'RETREATING';
  if (state === 'ENGAGED') return 'ENGAGED';
  return 'MOVING';
}

export function createBattlefieldSources(battle: PlayableBattleState): VisualUnitSource[] {
  const monster = battle.monsterGroup;
  return [
    ...battle.units.map(unitSource),
    {
      id: monster.id,
      factionId: monster.factionId,
      troopCount: monster.troopCount,
      position: screenPosition(monster.position),
      targetPosition: screenPosition(monster.targetPosition ?? monster.position),
      direction: monster.direction,
      formation: 'LOOSE',
      executionState: monsterExecutionState(monster.behaviorState),
      morale: monster.morale,
      fatigue: monster.fatigue,
      cohesion: monster.cohesion,
      shape: 'CIRCLE',
      color: 0xd66d62,
      pointScale: 0.52,
      appearanceIds: [],
    },
  ];
}
