import { HORNPLATE_SHIELD } from '@expedition/game-data';
import { createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { equipUnit } from './equip-unit';

describe('equipUnit', () => {
  const instance = {
    id: 'equipment-hornplate-1',
    definitionId: HORNPLATE_SHIELD.id,
  } as const;

  it('applies hornplate trade-offs to heavy infantry', () => {
    const unit = createUnitState({
      defense: 10,
      frontalDefense: 10,
      mobility: 2,
      equipmentWeight: 0,
    });
    const equipped = equipUnit({
      unit,
      equipmentInstance: instance,
      definition: HORNPLATE_SHIELD,
    });

    expect(equipped).toMatchObject({
      defense: 10,
      frontalDefense: 16,
      mobility: 1.6,
      equipmentWeight: 3,
      equipmentIds: ['equipment-hornplate-1'],
      appearanceIds: ['HORNPLATE_SHIELD'],
    });
    expect(unit.frontalDefense).toBe(10);
  });

  it('rejects non-heavy-infantry units', () => {
    expect(() =>
      equipUnit({
        unit: createUnitState({ unitType: 'ARCHER' }),
        equipmentInstance: instance,
        definition: HORNPLATE_SHIELD,
      }),
    ).toThrow('HEAVY_INFANTRY');
  });
});
