import { describe, expect, it } from 'vitest';

import type { GuildCombatSceneUnit } from './contracts';
import { createUnitPresentation } from './combat-unit-presentation';

const enemy = (crowned: boolean): GuildCombatSceneUnit => ({
  id: crowned ? 'boss' : 'guard',
  name: crowned ? '灰牙首領' : '灰牙獵手',
  side: 'enemies',
  x: 760,
  y: 270,
  hpRatio: 1,
  state: 'idle',
  selected: false,
  statusLayers: { burn: 0, poison: 0, tide: 0 },
  enemy: {
    id: crowned ? 'boss' : 'guard',
    family: 'greyfang',
    archetype: crowned ? 'boss' : 'brute',
    primary: 0xb8793a,
    secondary: 0x332315,
    accent: 0xffd36a,
    scale: crowned ? 1.3 : 1,
    ...(crowned ? { crowned: true } : {}),
  },
});

describe('combat unit presentation', () => {
  it('gives bosses a persistent frame and escalating presence rings', () => {
    const opening = createUnitPresentation(enemy(true), 1);
    const finisher = createUnitPresentation(enemy(true), 6);

    expect(opening).toMatchObject({ boss: true, badge: 'BOSS' });
    expect(opening.presenceRings).toBeGreaterThanOrEqual(2);
    expect(finisher.presenceRings).toBeGreaterThan(opening.presenceRings);
  });

  it('keeps ordinary enemies free of boss-only framing', () => {
    expect(createUnitPresentation(enemy(false), 6)).toEqual({
      boss: false,
      presenceRings: 0,
    });
  });
});
