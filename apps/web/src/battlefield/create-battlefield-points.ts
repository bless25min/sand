import {
  createVisualPoints,
  type VisualPoint,
  type VisualUnitSource,
} from '@expedition/pixi-renderer';

export function createBattlefieldPoints(sources: readonly VisualUnitSource[]): VisualPoint[] {
  return createVisualPoints({
    sources,
    pointBudget: 2_000,
    spacing: 4,
  });
}
