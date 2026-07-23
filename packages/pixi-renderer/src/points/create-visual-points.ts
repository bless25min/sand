import type { Vec2 } from '@expedition/shared-types';

import type { VisualPoint } from '../contracts/visual-point';
import type { VisualUnitSource } from '../contracts/visual-unit-source';
import { createFormationOffset } from '../formations/create-formation-offset';
import { resolveEquipmentVisualStyle } from '../styles/resolve-equipment-visual-style';
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

function assertNormalized(source: VisualUnitSource, key: 'morale' | 'fatigue' | 'cohesion'): void {
  const value = source[key];
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`source ${source.id} ${key} must be between zero and one`);
  }
}

function assertSource(source: VisualUnitSource): void {
  if (!Number.isFinite(source.pointScale) || source.pointScale <= 0) {
    throw new RangeError(`source ${source.id} pointScale must be greater than zero`);
  }

  if (!Number.isInteger(source.color) || source.color < 0 || source.color > 0xffffff) {
    throw new RangeError(`source ${source.id} color must be a 24-bit integer`);
  }

  assertNormalized(source, 'morale');
  assertNormalized(source, 'fatigue');
  assertNormalized(source, 'cohesion');
}

function seededUnit(seed: number): number {
  return ((seed >>> 8) & 0xffff) / 0xffff;
}

export function createVisualPoints(input: CreateVisualPointsInput): VisualPoint[] {
  const allocations = allocatePointCounts(
    input.sources.map((source) => source.troopCount),
    input.pointBudget,
  );
  const points: VisualPoint[] = [];

  input.sources.forEach((source, sourceIndex) => {
    assertSource(source);
    const visualStyle = resolveEquipmentVisualStyle(source);
    const pointCount = allocations[sourceIndex];

    if (pointCount === undefined) {
      throw new RangeError(`point allocation ${sourceIndex} does not exist`);
    }

    for (let localIndex = 0; localIndex < pointCount; localIndex += 1) {
      const animationSeed = hashString(`${source.id}:${localIndex}`);
      const cohesionSpacing = input.spacing * (1 + (1 - source.cohesion) * 0.8);
      const offset = createFormationOffset({
        pointIndex: localIndex,
        pointCount,
        formation: source.formation,
        spacing: cohesionSpacing,
        animationSeed,
      });
      const fatigueLag = source.fatigue * input.spacing * (0.35 + seededUnit(animationSeed) * 0.65);
      const trailingOffset = {
        x: -source.direction.x * fatigueLag,
        y: -source.direction.y * fatigueLag,
      };
      const moraleWaver = (seededUnit(animationSeed) - 0.5) * (1 - source.morale) * (Math.PI / 4);

      points.push({
        id: points.length,
        unitId: source.id,
        factionId: source.factionId,
        position: add(add(source.position, offset), trailingOffset),
        targetPosition: add(add(source.targetPosition, offset), trailingOffset),
        rotation: Math.atan2(source.direction.y, source.direction.x) + moraleWaver,
        scale: visualStyle.pointScale,
        alpha: 0.58 + source.morale * 0.42,
        shape: visualStyle.shape,
        color: visualStyle.color,
        state: source.executionState === 'ROUTING' ? 'ROUTING' : 'ACTIVE',
        stateAgeSeconds: 0,
        animationSeed,
      });
    }
  });

  return points;
}
