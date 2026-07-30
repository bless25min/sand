import { describe, expect, it } from 'vitest';

import { createCinematicBeatPlan } from './cinematic';

const cue = (tier: number) => ({
  particles: 12 + tier * tier * 8,
  rings: 1 + tier,
  afterimages: tier,
  shakePx: tier * tier,
  hitStopMs: 24 + tier * tier * 7,
  cameraZoom: 1 + tier * tier * 0.008,
  flashAlpha: 0.08 + tier * tier * 0.02,
});

describe('createCinematicBeatPlan', () => {
  it('always gives a visible attack anticipation, route, impact, reaction, and recovery', () => {
    const plan = createCinematicBeatPlan({
      kind: 'impact',
      tier: 2,
      route: 'direct',
      cue: cue(2),
    });

    expect(plan.phases.map(({ kind }) => kind)).toEqual([
      'anticipation',
      'travel',
      'impact',
      'reaction',
      'recovery',
    ]);
    expect(plan.travel).toBe(true);
    expect(plan.hitStopMs).toBe(cue(2).hitStopMs);
  });

  it('escalates every relay without turning damage segments into a multiplier', () => {
    const plans = [1, 2, 3, 4, 5, 6].map((tier) =>
      createCinematicBeatPlan({
        kind: tier === 6 ? 'finisher' : 'impact',
        tier,
        route: tier === 3 ? 'bounce' : 'direct',
        cue: cue(tier),
      }),
    );

    expect(plans.map(({ intensity }) => intensity)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(plans.map(({ hitStopMs }) => hitStopMs)).toEqual(
      [...plans.map(({ hitStopMs }) => hitStopMs)].sort((left, right) => left - right),
    );
    expect(plans.at(-1)?.finisher).toBe(true);
    expect(plans[2]?.route).toBe('bounce');
  });

  it('preserves causal feedback but removes motion durations for reduced motion', () => {
    const plan = createCinematicBeatPlan({
      kind: 'status',
      tier: 4,
      route: 'none',
      cue: cue(4),
      reducedMotion: true,
    });

    expect(plan.travel).toBe(false);
    expect(plan.phases.every(({ durationMs }) => durationMs === 0)).toBe(true);
    expect(plan.hitStopMs).toBe(0);
  });
});
