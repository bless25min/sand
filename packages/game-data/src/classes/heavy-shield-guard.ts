import type { UnitClassDefinition } from '@expedition/shared-types';

export const HEAVY_SHIELD_GUARD: UnitClassDefinition = {
  id: 'heavy-shield-guard',
  name: '重盾衛隊',
  sourceClassId: 'infantry',
  minimumLevel: 2,
  skillIds: ['shield-wall-training'],
  passiveIds: ['shield-wall-training'],
  appearanceIds: ['class-heavy-shield-guard'],
  statModifiers: {
    defense: 1,
    frontalDefense: 2,
    mobility: -0.2,
  },
};
