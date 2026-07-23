import { describe, expect, it } from 'vitest';

import type { VisualUnitSource } from '../contracts/visual-unit-source';
import { resolveEquipmentVisualStyle } from './resolve-equipment-visual-style';

const SOURCE: VisualUnitSource = {
  id: 'heavy-1',
  factionId: 'expedition',
  troopCount: 100,
  position: { x: 0, y: 0 },
  targetPosition: { x: 1, y: 0 },
  direction: { x: 1, y: 0 },
  formation: 'DENSE_BLOCK',
  executionState: 'IDLE',
  shape: 'SQUARE',
  color: 0x6fb6d9,
  pointScale: 0.32,
  appearanceIds: [],
};

describe('resolveEquipmentVisualStyle', () => {
  it('preserves the base style without equipment appearance', () => {
    expect(resolveEquipmentVisualStyle(SOURCE)).toEqual({
      shape: 'SQUARE',
      color: 0x6fb6d9,
      pointScale: 0.32,
    });
  });

  it('projects hornplate shield as a larger bronze shield point', () => {
    expect(
      resolveEquipmentVisualStyle({
        ...SOURCE,
        appearanceIds: ['HORNPLATE_SHIELD'],
      }),
    ).toEqual({
      shape: 'SQUARE',
      color: 0xb69a5a,
      pointScale: 0.38,
    });
  });
});
