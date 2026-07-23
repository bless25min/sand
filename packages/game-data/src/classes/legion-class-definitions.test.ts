import { describe, expect, it } from 'vitest';

import { LEGION_SKILLS } from '../index';
import { BEAST_HUNTER_MARKSMAN } from './beast-hunter-marksman';
import { HEAVY_SHIELD_GUARD } from './heavy-shield-guard';
import { BEAST_HUNTING_MANUAL } from '../skills/beast-hunting-manual';
import { SHIELD_WALL_TRAINING } from '../skills/shield-wall-training';

describe('Legion class definitions', () => {
  it('defines the heavy shield guard promotion and passive trade-offs', () => {
    expect(HEAVY_SHIELD_GUARD).toMatchObject({
      id: 'heavy-shield-guard',
      sourceClassId: 'infantry',
      minimumLevel: 2,
      skillIds: ['shield-wall-training'],
      passiveIds: ['shield-wall-training'],
      appearanceIds: ['class-heavy-shield-guard'],
      statModifiers: { defense: 1, frontalDefense: 2, mobility: -0.2 },
    });
    expect(SHIELD_WALL_TRAINING.statModifiers).toEqual({
      frontalDefense: 2,
      mobility: -0.1,
    });
  });

  it('defines the beast hunter marksman promotion and passive trade-offs', () => {
    expect(BEAST_HUNTER_MARKSMAN).toMatchObject({
      id: 'beast-hunter-marksman',
      sourceClassId: 'archer',
      minimumLevel: 2,
      skillIds: ['beast-hunting-manual'],
      passiveIds: ['beast-hunting-manual'],
      appearanceIds: ['class-beast-hunter-marksman'],
      statModifiers: { attack: 1, defense: -1, mobility: 0.1 },
    });
    expect(BEAST_HUNTING_MANUAL.statModifiers).toEqual({
      attack: 2,
      frontalDefense: -0.5,
      mobility: 0.15,
    });
  });

  it('indexes exactly the legion promotion skills by identifier', () => {
    expect(LEGION_SKILLS).toEqual({
      [SHIELD_WALL_TRAINING.id]: SHIELD_WALL_TRAINING,
      [BEAST_HUNTING_MANUAL.id]: BEAST_HUNTING_MANUAL,
    });
  });
});
