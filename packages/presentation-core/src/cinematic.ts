import type { PresentationBeatKind, PresentationCue, PresentationRoute } from './sequence';

export type CinematicPhaseKind = 'anticipation' | 'travel' | 'impact' | 'reaction' | 'recovery';

export interface CinematicPhase {
  kind: CinematicPhaseKind;
  durationMs: number;
}

export interface CinematicBeatPlan {
  phases: readonly CinematicPhase[];
  route: PresentationRoute;
  travel: boolean;
  hitStopMs: number;
  intensity: number;
  finisher: boolean;
}

export function createCinematicBeatPlan(input: {
  kind: PresentationBeatKind;
  tier: number;
  route: PresentationRoute;
  cue: PresentationCue;
  reducedMotion?: boolean;
}): CinematicBeatPlan {
  const intensity = Math.max(1, Math.min(6, Math.trunc(input.tier)));
  const finisher = input.kind === 'finisher' || intensity === 6;
  const travel = input.route !== 'none';
  const zero = input.reducedMotion ?? false;
  const duration = (value: number) => (zero ? 0 : Math.max(0, Math.trunc(value)));

  return {
    phases: [
      { kind: 'anticipation', durationMs: duration(58 + intensity * 8) },
      { kind: 'travel', durationMs: duration(travel ? 70 + intensity * 6 : 0) },
      { kind: 'impact', durationMs: duration(34 + intensity * 5) },
      { kind: 'reaction', durationMs: duration(72 + intensity * 8 + (finisher ? 50 : 0)) },
      { kind: 'recovery', durationMs: duration(76 + intensity * 5) },
    ],
    route: input.route,
    travel,
    hitStopMs: zero ? 0 : input.cue.hitStopMs,
    intensity,
    finisher,
  };
}
