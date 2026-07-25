import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { createPlaybackProjection, nextPlaybackTick, projectPlaybackUnits } from './playback-model';

function releaseFullCommand() {
  let state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  for (const cardId of [
    'brann_brace',
    'brann_riposte',
    'brann_sweep',
    'lyra_mark',
    'lyra_piercing_shot',
    'lyra_ricochet',
    'elin_prayer',
    'elin_overflow_bolt',
    'elin_radiant_burst',
  ]) {
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
  }
  return guildRpgReducer(state, { type: 'RELEASE_COMBO' });
}

describe('combo playback model', () => {
  it('reveals only the current release and reaches the exact final metrics', () => {
    const state = releaseFullCommand();
    const runtime = state.battle!.combo!;
    const startIndex = state.playback!.eventStartIndex;
    const eventCount = runtime.events.length - startIndex;

    const opening = createPlaybackProjection(runtime, startIndex, 1);
    const complete = createPlaybackProjection(runtime, startIndex, eventCount);
    const openingUnits = projectPlaybackUnits(
      state.playback!.startingUnits,
      state.battle!.units,
      opening,
    );
    const completeUnits = projectPlaybackUnits(
      state.playback!.startingUnits,
      state.battle!.units,
      complete,
    );

    expect(opening.events).toHaveLength(1);
    expect(opening.stage).toBe('stack');
    expect(opening.progress).toEqual({ visible: 1, total: eventCount });
    expect(complete.events).toEqual(runtime.events.slice(startIndex));
    expect(complete.metrics).toEqual(runtime.metrics);
    expect(complete.stage).toBe('overflow');
    expect(
      openingUnits.filter((unit) => unit.side === 'enemies').every((unit) => unit.currentHp > 0),
    ).toBe(true);
    expect(completeUnits).toEqual(state.battle!.units);
  });

  it('uses speed batches, reveals reduced-motion playback together, then completes', () => {
    expect(
      nextPlaybackTick({
        eventCount: 8,
        reducedMotion: false,
        speed: 1,
        visibleEventCount: 2,
      }),
    ).toEqual({ type: 'advance', count: 1, delayMs: 180 });
    expect(
      nextPlaybackTick({
        eventCount: 8,
        reducedMotion: false,
        speed: 2,
        visibleEventCount: 2,
      }),
    ).toEqual({ type: 'advance', count: 2, delayMs: 90 });
    expect(
      nextPlaybackTick({
        eventCount: 8,
        reducedMotion: true,
        speed: 1,
        visibleEventCount: 2,
      }),
    ).toEqual({ type: 'advance', count: 6, delayMs: 0 });
    expect(
      nextPlaybackTick({
        eventCount: 8,
        reducedMotion: false,
        speed: 1,
        visibleEventCount: 8,
      }),
    ).toEqual({ type: 'complete', delayMs: 700 });
  });
});
