import { describe, expect, it } from 'vitest';
import type { ComboEvent, ComboRuntimeState } from '@expedition/shared-types';

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
    expect(complete.stage).toBe('annihilation');
    expect(complete.currentImpact).toMatchObject({
      kind: 'annihilation',
      label: 'ANNIHILATION',
    });
    expect(
      openingUnits.filter((unit) => unit.side === 'enemies').every((unit) => unit.currentHp > 0),
    ).toBe(true);
    expect(completeUnits).toEqual(state.battle!.units);
  });

  it('uses speed batches, reveals reduced-motion playback together, then completes', () => {
    const events = Array.from({ length: 8 }, (_, id): ComboEvent => ({
      id,
      causalId: `event:${id}`,
      kind: 'card_played',
      message: `事件 ${id}`,
    }));
    expect(
      nextPlaybackTick({
        events,
        reducedMotion: false,
        speed: 1,
        visibleEventCount: 2,
      }),
    ).toEqual({ type: 'advance', count: 1, delayMs: 180 });
    expect(
      nextPlaybackTick({
        events,
        reducedMotion: false,
        speed: 2,
        visibleEventCount: 2,
      }),
    ).toEqual({ type: 'advance', count: 2, delayMs: 90 });
    expect(
      nextPlaybackTick({
        events,
        reducedMotion: true,
        speed: 1,
        visibleEventCount: 2,
      }),
    ).toEqual({ type: 'advance', count: 6, delayMs: 0 });
    expect(
      nextPlaybackTick({
        events,
        reducedMotion: false,
        speed: 1,
        visibleEventCount: 8,
      }),
    ).toEqual({ type: 'complete', delayMs: 700 });
  });

  it('climbs through stack, trigger, break, overkill, and annihilation impacts', () => {
    const events: readonly ComboEvent[] = [
      {
        id: 0,
        causalId: 'card:0',
        kind: 'card_played',
        message: '起手',
      },
      {
        id: 1,
        causalId: 'card:1',
        kind: 'card_played',
        message: '連鎖',
      },
      {
        id: 2,
        causalId: 'kill',
        kind: 'unit_defeated',
        message: '擊殺',
        targetId: 'target-a',
      },
      {
        id: 3,
        causalId: 'overkill',
        kind: 'overkill',
        message: '溢傷',
        targetId: 'target-a',
        amount: 99,
      },
      {
        id: 4,
        causalId: 'victory',
        kind: 'victory',
        message: '全滅',
      },
    ];
    const runtime: ComboRuntimeState = {
      phase: 'complete',
      draft: { cardIds: [] },
      availableCardIds: [],
      events,
      metrics: {
        comboCount: 5,
        totalDamage: 99,
        totalOverkill: 99,
        defeatedEnemyIds: ['target-a'],
        annihilationOverflow: 99,
      },
    };

    expect(
      [1, 2, 3, 4, 5].map((visible) => createPlaybackProjection(runtime, 0, visible).stage),
    ).toEqual(['stack', 'trigger', 'break', 'overkill', 'annihilation']);
    expect(createPlaybackProjection(runtime, 0, 3).currentImpact).toEqual({
      kind: 'kill',
      targetId: 'target-a',
      label: 'EXECUTED',
    });
    expect(createPlaybackProjection(runtime, 0, 4).currentImpact).toEqual({
      kind: 'overkill',
      targetId: 'target-a',
      amount: 99,
      label: 'OVERKILL +99',
    });
  });

  it('accelerates dense chains but pauses on impact events', () => {
    const events = Array.from({ length: 12 }, (_, id): ComboEvent => ({
      id,
      causalId: `event:${id}`,
      kind: id === 8 ? 'unit_defeated' : 'card_played',
      message: `事件 ${id}`,
    }));

    expect(
      nextPlaybackTick({
        events,
        reducedMotion: false,
        speed: 1,
        visibleEventCount: 6,
      }),
    ).toEqual({ type: 'advance', count: 2, delayMs: 90 });
    expect(
      nextPlaybackTick({
        events,
        reducedMotion: false,
        speed: 1,
        visibleEventCount: 8,
      }),
    ).toEqual({ type: 'advance', count: 1, delayMs: 240 });
  });
});
