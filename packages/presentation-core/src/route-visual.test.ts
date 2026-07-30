import { describe, expect, it } from 'vitest';

import { resolveRouteVisual } from './route-visual';

const cue = {
  particles: 40,
  rings: 4,
  afterimages: 3,
  shakePx: 4,
  hitStopMs: 50,
  cameraZoom: 1.04,
  flashAlpha: 0.2,
};

describe('resolveRouteVisual', () => {
  it('gives every causal route a distinct motion signature', () => {
    const routes = ['direct', 'area', 'bounce', 'echo-self', 'relay', 'none'] as const;
    const treatments = routes.map((route) => resolveRouteVisual(route, cue));

    expect(new Set(treatments.map(({ signature }) => signature)).size).toBe(routes.length);
    expect(resolveRouteVisual('direct', cue)).toMatchObject({
      signature: 'strike',
      actorMotion: true,
    });
    expect(resolveRouteVisual('bounce', cue)).toMatchObject({
      signature: 'ricochet',
      pulses: 3,
    });
    expect(resolveRouteVisual('echo-self', cue)).toMatchObject({
      signature: 'echo',
      pulses: 2,
    });
    expect(resolveRouteVisual('relay', cue)).toMatchObject({
      signature: 'handoff',
      actorMotion: true,
    });
  });

  it('keeps cue intensity while adapting it to the visual route', () => {
    expect(resolveRouteVisual('area', cue)).toMatchObject({
      particles: 40,
      rings: 6,
      afterimages: 3,
    });
    expect(resolveRouteVisual('none', { ...cue, particles: 0, afterimages: 0 })).toMatchObject({
      particles: 0,
      afterimages: 0,
    });
  });
});
