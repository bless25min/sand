import { describe, expect, it } from 'vitest';

import type { GuildCombatSceneUnit } from './contracts';
import { unitSelectionMarker } from './unit-selection-marker';

const unit = (overrides: Partial<GuildCombatSceneUnit>): GuildCombatSceneUnit => ({
  id: 'unit',
  name: '測試單位',
  side: 'heroes',
  x: 0,
  y: 0,
  hpRatio: 1,
  statusLayers: { burn: 0, poison: 0, tide: 0 },
  state: 'idle',
  selected: false,
  ...overrides,
});

describe('unit selection marker', () => {
  it('chooses one dominant marker instead of stacking target, actor, relay and next rings', () => {
    expect(
      unitSelectionMarker(
        unit({ side: 'enemies', selected: true, state: 'targeted', comboReady: true }),
      ),
    ).toBe('target');
    expect(unitSelectionMarker(unit({ state: 'acting', comboReady: true }))).toBe('actor');
    expect(unitSelectionMarker(unit({ state: 'next', comboReady: true }))).toBe('next');
    expect(unitSelectionMarker(unit({ comboReady: true }))).toBe('relay');
    expect(unitSelectionMarker(unit({}))).toBe('none');
  });
});
