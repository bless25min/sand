import { describe, expect, it } from 'vitest';

import type { GuildCombatSceneUnit } from './contracts';
import { createStatusAuraPlan } from './status-aura-plan';

const unit = (
  statusLayers: GuildCombatSceneUnit['statusLayers'],
  afterStatus?: GuildCombatSceneUnit['statusLayers'],
): GuildCombatSceneUnit => ({
  id: 'wolf',
  name: '灰牙首領',
  side: 'enemies',
  x: 300,
  y: 330,
  hpRatio: 1,
  state: 'targeted',
  selected: true,
  statusLayers,
  ...(afterStatus
    ? {
        preview: {
          afterHp: 18,
          damage: 0,
          healing: 0,
          afterStatus,
          afterDefenseReduction: 0,
          afterStrengthened: 0,
        },
      }
    : {}),
});

describe('status aura plan', () => {
  it('keeps an unstressed unit visually quiet', () => {
    expect(createStatusAuraPlan(unit({ burn: 0, poison: 0, tide: 0 }))).toEqual({
      layers: [],
      activeKinds: 0,
    });
  });

  it('escalates each element through three readable battlefield tiers', () => {
    const plan = createStatusAuraPlan(unit({ burn: 1, poison: 4, tide: 8 }));

    expect(plan.layers).toEqual([
      expect.objectContaining({
        kind: 'burn',
        motif: 'flame',
        value: 1,
        tier: 1,
        projectedTier: 1,
      }),
      expect.objectContaining({
        kind: 'poison',
        motif: 'spore',
        value: 4,
        tier: 2,
        projectedTier: 2,
      }),
      expect.objectContaining({
        kind: 'tide',
        motif: 'ripple',
        value: 8,
        tier: 3,
        projectedTier: 3,
      }),
    ]);
    expect(plan.activeKinds).toBe(3);
  });

  it('previews a pending status increase without replacing the current tier', () => {
    const plan = createStatusAuraPlan(
      unit({ burn: 3, poison: 0, tide: 0 }, { burn: 5, poison: 2, tide: 0 }),
    );

    expect(plan.layers).toEqual([
      expect.objectContaining({
        kind: 'burn',
        value: 3,
        projectedValue: 5,
        tier: 1,
        projectedTier: 2,
        previewDelta: 2,
      }),
      expect.objectContaining({
        kind: 'poison',
        value: 0,
        projectedValue: 2,
        tier: 0,
        projectedTier: 1,
        previewDelta: 2,
      }),
    ]);
  });

  it('caps decorative marks while preserving exact layer values for the HUD', () => {
    const [burn] = createStatusAuraPlan(unit({ burn: 99, poison: 0, tide: 0 })).layers;

    expect(burn).toMatchObject({
      value: 99,
      projectedValue: 99,
      tier: 3,
      projectedTier: 3,
      marks: 7,
    });
  });
});
