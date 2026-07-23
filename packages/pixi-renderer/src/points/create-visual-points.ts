import type { Vec2 } from '@expedition/shared-types';

import type { VisualPoint } from '../contracts/visual-point';
import type { VisualUnitSource } from '../contracts/visual-unit-source';
import { createFormationOffset } from '../formations/create-formation-offset';
import { allocatePointCounts } from './allocate-point-counts';

export interface CreateVisualPointsInput {
  readonly sources: readonly VisualUnitSource[];
  readonly pointBudget: number;
  readonly spacing: number;
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function add(first: Vec2, second: Vec2): Vec2 {
  return {
    x: first.x + second.x,
    y: first.y + second.y,
  };
}

function assertSource(source: VisualUnitSource): void {
  if (!Number.isFinite(source.pointScale) || source.pointScale <= 0) {
    throw new RangeError(`source ${source.id} pointScale must be greater than zero`);
  }

  if (!Number.isInteger(source.color) || source.color < 0 || source.color > 0xffffff) {
    throw new RangeError(`source ${source.id} color must be a 24-bit integer`);
  }
}

export function createVisualPoints(input: CreateVisualPointsInput): VisualPoint[] {
  const allocations = allocatePointCounts(
    input.sources.map((source) => source.troopCount),
    input.pointBudget,
  );
  const points: VisualPoint[] = [];

  input.sources.forEach((source, sourceIndex) => {
    assertSource(source);
    const pointCount = allocations[sourceIndex];

    if (pointCount === undefined) {
      throw new RangeError(`point allocation ${sourceIndex} does not exist`);
    }

    for (let localIndex = 0; localIndex < pointCount; localIndex += 1) {
      const animationSeed = hashString(`${source.id}:${localIndex}`);
      const offset = createFormationOffset({
        pointIndex: localIndex,
        pointCount,
        formation: source.formation,
        spacing: input.spacing,
        animationSeed,
      });

      points.push({
        id: points.length,
        unitId: source.id,
        factionId: source.factionId,
        position: add(source.position, offset),
        targetPosition: add(source.targetPosition, offset),
        rotation: Math.atan2(source.direction.y, source.direction.x),
        scale: source.pointScale,
        alpha: 1,
        shape: source.shape,
        color: source.color,
        state: source.executionState === 'ROUTING' ? 'ROUTING' : 'ACTIVE',
        stateAgeSeconds: 0,
        animationSeed,
      });
    }
  });

  return points;
}
