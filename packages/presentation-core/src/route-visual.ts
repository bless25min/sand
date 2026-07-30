import type { PresentationCue, PresentationRoute } from './sequence';

export type RouteVisualSignature = 'strike' | 'blast' | 'ricochet' | 'echo' | 'handoff' | 'aura';

export interface RouteVisual {
  signature: RouteVisualSignature;
  actorMotion: boolean;
  pulses: number;
  particles: number;
  rings: number;
  afterimages: number;
}

export function resolveRouteVisual(route: PresentationRoute, cue: PresentationCue): RouteVisual {
  const shared = {
    particles: cue.particles,
    rings: cue.rings,
    afterimages: cue.afterimages,
  };
  if (route === 'direct') {
    return { ...shared, signature: 'strike', actorMotion: true, pulses: 1 };
  }
  if (route === 'area') {
    return {
      ...shared,
      signature: 'blast',
      actorMotion: false,
      pulses: 2,
      rings: cue.rings + 2,
    };
  }
  if (route === 'bounce') {
    return { ...shared, signature: 'ricochet', actorMotion: false, pulses: 3 };
  }
  if (route === 'echo-self') {
    return { ...shared, signature: 'echo', actorMotion: false, pulses: 2 };
  }
  if (route === 'relay') {
    return { ...shared, signature: 'handoff', actorMotion: true, pulses: 2 };
  }
  return { ...shared, signature: 'aura', actorMotion: false, pulses: 1 };
}
