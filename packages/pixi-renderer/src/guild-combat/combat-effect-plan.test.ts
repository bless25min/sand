import { describe, expect, it } from 'vitest';

import type { GuildCombatScene } from './contracts';
import { createCombatEffectPlan } from './combat-effect-plan';

const scene = (relay: number): GuildCombatScene => ({
  width: 1_000,
  height: 560,
  questId: 'border_pack',
  relay,
  zone: {
    id: 'greyfang_frontier',
    skyTop: 0x081b1d,
    skyBottom: 0x183237,
    ground: 0x142923,
    accent: 0xe1b568,
    atmosphere: 'moon-mist',
    weather: 'cloud-drift',
  },
  units: [
    {
      id: 'brann',
      name: '布蘭',
      side: 'heroes',
      x: 160,
      y: 390,
      hpRatio: 1,
      state: 'acting',
      selected: false,
      statusLayers: { burn: 0, poison: 0, tide: 0 },
      hero: {
        id: 'brann',
        sigil: '盾',
        primary: 0xc1533b,
        secondary: 0x4c2624,
        accent: 0xffc46b,
        weapon: 'shield',
      },
    },
    {
      id: 'wolf_alpha',
      name: '灰牙首領',
      side: 'enemies',
      x: 760,
      y: 270,
      hpRatio: 0.7,
      state: 'targeted',
      selected: true,
      statusLayers: { burn: 6, poison: 0, tide: 0 },
      enemy: {
        id: 'wolf_alpha',
        family: 'greyfang',
        archetype: 'boss',
        primary: 0xb8793a,
        secondary: 0x332315,
        accent: 0xffd36a,
        scale: 1.14,
        crowned: true,
      },
    },
  ],
});

describe('Pixi guild combat effect plan', () => {
  it('strictly increases ambient and impact density across all six relays', () => {
    const plans = [1, 2, 3, 4, 5, 6].map((relay) => createCombatEffectPlan(scene(relay)));

    expect(
      plans.every(
        ({ ambientParticles }, index) =>
          index === 0 || ambientParticles > plans[index - 1]!.ambientParticles,
      ),
    ).toBe(true);
    expect(
      plans.every(
        ({ impactRings }, index) => index === 0 || impactRings > plans[index - 1]!.impactRings,
      ),
    ).toBe(true);
    expect(plans[5]).toMatchObject({ finisher: true, cameraZoom: 1.08 });
  });

  it('builds a same-target bounce path that visibly leaves and returns to the target', () => {
    const battle = {
      ...scene(4),
      event: {
        id: 'visual:2:bounce',
        sourceEventId: 2,
        eventKind: 'bounce' as const,
        phase: 'travel' as const,
        headline: '彈射折返',
        detail: '烈焰折返回原目標',
        relay: 4,
        intensity: 62,
        durationMs: 170,
        polarity: 'damage' as const,
        route: 'bounce' as const,
        camera: 'track' as const,
        actorId: 'brann',
        targetId: 'wolf_alpha',
        element: 'fire' as const,
      },
    };
    const plan = createCombatEffectPlan(battle);

    expect(plan.route).toHaveLength(4);
    expect(plan.route[0]).toEqual({ x: 160, y: 350 });
    expect(plan.route.at(-1)).toEqual({ x: 760, y: 230 });
    expect(plan.route[1]).not.toEqual(plan.route.at(-1));
  });
});
