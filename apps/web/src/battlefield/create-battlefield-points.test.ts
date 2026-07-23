import type { VisualUnitSource } from '@expedition/pixi-renderer';
import { expect, it } from 'vitest';

import { createBattlefieldPoints } from './create-battlefield-points';

it('does not invent casualty points before the simulation reports casualties', () => {
  const sources: VisualUnitSource[] = [
    {
      id: 'heavy',
      factionId: 'expedition',
      troopCount: 100,
      position: { x: 10, y: 10 },
      targetPosition: { x: 20, y: 10 },
      direction: { x: 1, y: 0 },
      formation: 'DENSE_BLOCK',
      executionState: 'IDLE',
      morale: 1,
      fatigue: 0,
      cohesion: 1,
      shape: 'SQUARE',
      color: 0xffffff,
      pointScale: 1,
      appearanceIds: [],
    },
  ];

  expect(createBattlefieldPoints(sources).every((point) => point.state === 'ACTIVE')).toBe(true);
});
