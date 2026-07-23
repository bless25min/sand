import type { VisualUnitSource } from '../contracts/visual-unit-source';
import type { PointShape } from '../contracts/point-shape';

export interface VisualStyle {
  readonly shape: PointShape;
  readonly color: number;
  readonly pointScale: number;
}

const HORNPLATE_STYLE: VisualStyle = {
  shape: 'SQUARE',
  color: 0xb69a5a,
  pointScale: 0.38,
};

export function resolveEquipmentVisualStyle(source: VisualUnitSource): VisualStyle {
  if (source.appearanceIds.includes('HORNPLATE_SHIELD')) {
    return HORNPLATE_STYLE;
  }

  return {
    shape: source.shape,
    color: source.color,
    pointScale: source.pointScale,
  };
}
