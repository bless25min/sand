import type { FixedOrderAction } from '@expedition/shared-types';
import type { VisualUnitSource } from '@expedition/pixi-renderer';
import { describe, expect, it } from 'vitest';

import { createBattlefieldOverlay } from './create-battlefield-overlay';

const sources: VisualUnitSource[] = [
  {
    id: 'heavy',
    factionId: 'expedition',
    troopCount: 100,
    position: { x: 120, y: 200 },
    targetPosition: { x: 600, y: 260 },
    direction: { x: 1, y: 0 },
    formation: 'DENSE_BLOCK',
    executionState: 'MOVING',
    shape: 'SQUARE',
    color: 0x6fb6d9,
    pointScale: 1,
    appearanceIds: [],
  },
];

function overlay(action?: FixedOrderAction) {
  return createBattlefieldOverlay({
    sources,
    selectedUnitId: 'heavy',
    action,
  });
}

describe('createBattlefieldOverlay', () => {
  it('locates the selected unit and exposes an accessible label', () => {
    expect(overlay()).toMatchObject({
      mode: 'idle',
      selected: { unitId: 'heavy', x: 120, y: 200 },
      accessibleLabel: '已選取 heavy',
    });
  });

  it.each([
    ['ADVANCE', 'advance'],
    ['ATTACK', 'attack'],
  ] as const)('draws a target line for %s', (action, mode) => {
    expect(overlay(action)).toMatchObject({
      mode,
      targetLine: {
        from: { x: 120, y: 200 },
        to: { x: 600, y: 260 },
      },
    });
  });

  it('marks hold without drawing a misleading movement line', () => {
    const result = overlay('HOLD');

    expect(result.mode).toBe('hold');
    expect(result.targetLine).toBeUndefined();
  });

  it('marks retreat as an outbound state', () => {
    const result = overlay('RETREAT');

    expect(result).toMatchObject({
      mode: 'retreat',
      accessibleLabel: 'heavy 正在撤退',
    });
    expect(result.targetLine).toBeUndefined();
  });
});
