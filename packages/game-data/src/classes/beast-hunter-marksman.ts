import type { UnitClassDefinition } from '@expedition/shared-types';

export const BEAST_HUNTER_MARKSMAN: UnitClassDefinition = {
  id: 'beast-hunter-marksman',
  name: '獵獸射手',
  sourceClassId: 'archer',
  minimumLevel: 2,
  skillIds: ['beast-hunting-manual'],
  passiveIds: ['beast-hunting-manual'],
  appearanceIds: ['class-beast-hunter-marksman'],
  statModifiers: {
    attack: 1,
    defense: -1,
    mobility: 0.1,
  },
};
