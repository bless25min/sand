import { describe, expect, it } from 'vitest';

import type { GuildCombatScene } from './contracts';
import { createCombatEffectPlan } from './combat-effect-plan';

const scene = (relay: number): GuildCombatScene => ({
  width: 1_000,
  height: 560,
  layout: 'landscape',
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
    const impactGains = plans
      .slice(1)
      .map(({ impactParticles }, index) => impactParticles - plans[index]!.impactParticles);
    const hitStopGains = plans
      .slice(1)
      .map(({ hitStopMs }, index) => hitStopMs - plans[index]!.hitStopMs);
    const flashGains = plans
      .slice(1)
      .map(({ screenFlashAlpha }, index) => screenFlashAlpha - plans[index]!.screenFlashAlpha);

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
    expect(impactGains.every((gain, index) => index === 0 || gain > impactGains[index - 1]!)).toBe(
      true,
    );
    expect(
      hitStopGains.every((gain, index) => index === 0 || gain > hitStopGains[index - 1]!),
    ).toBe(true);
    expect(
      plans.every(
        ({ afterimageCount }, index) =>
          index === 0 || afterimageCount > plans[index - 1]!.afterimageCount,
      ),
    ).toBe(true);
    expect(flashGains.every((gain) => gain > 0)).toBe(true);
    expect(plans[5]).toMatchObject({
      finisher: true,
      cameraZoom: 1.162,
      hitStopMs: 168,
      afterimageCount: 7,
    });
    expect(plans[5]!.screenFlashAlpha).toBeGreaterThanOrEqual(0.68);
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

  it('gives fire, grass, and water different effect motifs', () => {
    const motifs = (['fire', 'grass', 'water'] as const).map(
      (element) =>
        createCombatEffectPlan({
          ...scene(3),
          event: {
            id: `visual:${element}`,
            sourceEventId: 30,
            eventKind: 'damage',
            phase: 'impact',
            headline: '屬性命中',
            detail: '屬性命中',
            relay: 3,
            intensity: 50,
            durationMs: 170,
            polarity: 'damage',
            route: 'direct',
            camera: 'punch',
            actorId: 'brann',
            targetId: 'wolf_alpha',
            number: -30,
            element,
            specializationId: 'stack',
            triggerId: 'on_hit',
          },
        }).elementMotif,
    );

    expect(new Set(motifs).size).toBe(3);
    expect(motifs).toEqual(['ember-shards', 'toxic-spores', 'tidal-ribbons']);
  });

  it('assigns all six specializations a distinct readable combat signature', () => {
    const specializations = [
      'blast',
      'stack',
      'weaken',
      'chain',
      'empower',
      'multistrike',
    ] as const;
    const signatures = specializations.map(
      (specializationId) =>
        createCombatEffectPlan({
          ...scene(4),
          event: {
            id: `visual:${specializationId}`,
            sourceEventId: 40,
            eventKind: 'damage',
            phase: 'impact',
            headline: '特化命中',
            detail: '特化命中',
            relay: 4,
            intensity: 62,
            durationMs: 170,
            polarity: specializationId === 'empower' ? 'support' : 'damage',
            route: specializationId === 'chain' ? 'bounce' : 'direct',
            camera: 'punch',
            actorId: 'brann',
            targetId: 'wolf_alpha',
            element: 'fire',
            specializationId,
            triggerId: 'on_hit',
          },
        }).specializationMotif,
    );

    expect(new Set(signatures).size).toBe(6);
    expect(signatures).toEqual([
      'detonation',
      'layer-orbit',
      'armor-fracture',
      'ricochet',
      'relay-aura',
      'rapid-strikes',
    ]);
  });

  it('turns a targetless sixth finisher into an impact on every enemy including just-defeated targets', () => {
    const plan = createCombatEffectPlan({
      ...scene(6),
      units: [
        scene(6).units[0]!,
        {
          ...scene(6).units[1]!,
          state: 'defeated',
          hpRatio: 0,
        },
        {
          ...scene(6).units[1]!,
          id: 'wolf_guard',
          name: '灰牙獵手',
          x: 850,
          y: 390,
          state: 'idle',
          selected: false,
        },
      ],
      event: {
        id: 'visual:finisher',
        sourceEventId: 60,
        eventKind: 'finisher',
        phase: 'finisher',
        headline: '全軍終結',
        detail: '第六棒終結',
        relay: 6,
        intensity: 100,
        durationMs: 520,
        polarity: 'damage',
        route: 'area',
        camera: 'finisher',
        actorId: 'brann',
        number: -324,
        element: 'fire',
        specializationId: 'blast',
        triggerId: 'final_actor',
      },
    });

    expect(plan.impactTargetIds).toEqual(['wolf_alpha', 'wolf_guard']);
    expect(plan.finisher).toBe(true);
  });
});
