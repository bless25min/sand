import type { GuildBattleEvent } from '@expedition/shared-types';
import { describe, expect, it, vi } from 'vitest';

import { compilePresentation, playPresentationSequence, type BeatPlayer } from './sequence';

const event = (
  id: number,
  kind: GuildBattleEvent['kind'],
  input: Partial<GuildBattleEvent> = {},
): GuildBattleEvent => ({
  id,
  kind,
  message: `${kind}-${id}`,
  ...input,
});

const relayEvents: GuildBattleEvent[] = Array.from({ length: 6 }, (_, index) => [
  event(index * 3 + 1, 'skill_cast', {
    actorId: `hero-${index + 1}`,
    targetId: 'enemy-1',
    skillId: `skill-${index + 1}`,
  }),
  event(index * 3 + 2, index === 5 ? 'reaction' : 'damage', {
    actorId: `hero-${index + 1}`,
    targetId: 'enemy-1',
    amount: index + 1,
    causalId: `hit-${index + 1}`,
    element: index % 3 === 0 ? 'fire' : index % 3 === 1 ? 'grass' : 'water',
  }),
  event(index * 3 + 3, index === 5 ? 'finisher' : 'relay', {
    actorId: `hero-${index + 1}`,
    targetId: 'enemy-1',
    amount: index + 1,
    causalDepth: index + 1,
  }),
]).flat();

describe('compilePresentation', () => {
  it('preserves causal order and escalates every hero beyond the previous hero', () => {
    const sequence = compilePresentation(relayEvents);
    const casts = sequence.beats.filter(({ kind }) => kind === 'cast');
    const impacts = sequence.beats.filter(({ kind }) => kind === 'impact');

    expect(casts.map(({ actorId }) => actorId)).toEqual([
      'hero-1',
      'hero-2',
      'hero-3',
      'hero-4',
      'hero-5',
      'hero-6',
    ]);
    expect(casts.map(({ tier }) => tier)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(
      impacts.every(
        (beat, index) =>
          index === 0 ||
          (beat.cue.particles > impacts[index - 1]!.cue.particles &&
            beat.cue.hitStopMs > impacts[index - 1]!.cue.hitStopMs &&
            beat.cue.cameraZoom > impacts[index - 1]!.cue.cameraZoom),
      ),
    ).toBe(true);
    expect(sequence.beats.at(-1)).toMatchObject({ kind: 'finisher', tier: 6 });
  });

  it('routes bounces and lone-target echoes without displaying damage as a multiplier', () => {
    const sequence = compilePresentation([
      event(1, 'skill_cast', { actorId: 'hero-1', targetId: 'enemy-1' }),
      event(2, 'bounce', {
        actorId: 'hero-1',
        targetId: 'enemy-1',
        triggerId: 'on_bounce',
      }),
      event(3, 'reaction', {
        actorId: 'hero-1',
        targetId: 'enemy-1',
        amount: 7,
        triggerId: 'lone_target',
      }),
    ]);

    expect(sequence.beats[1]).toMatchObject({ route: 'bounce' });
    expect(sequence.beats[2]).toMatchObject({
      route: 'echo-self',
      number: { kind: 'damage', value: 7 },
    });
    expect(sequence.beats[2]!.number).not.toHaveProperty('multiplier');
  });

  it('starts a separately resolved action at its visible relay position', () => {
    const action = [
      event(41, 'skill_cast', { actorId: 'hero-4', targetId: 'enemy-1' }),
      event(42, 'damage', { actorId: 'hero-4', targetId: 'enemy-1', amount: 4 }),
    ];

    const sequence = compilePresentation(action, { baseTier: 4 });

    expect(sequence.beats.map(({ tier }) => tier)).toEqual([4, 4]);
    expect(sequence.beats[1]!.cue.particles).toBeGreaterThan(
      compilePresentation(action, { baseTier: 3 }).beats[1]!.cue.particles,
    );
  });

  it('keeps every semantic cue in reduced motion while removing forced movement', () => {
    const regular = compilePresentation(relayEvents);
    const reduced = compilePresentation(relayEvents, { reducedMotion: true });

    expect(reduced.beats.map(({ sourceEventIds }) => sourceEventIds)).toEqual(
      regular.beats.map(({ sourceEventIds }) => sourceEventIds),
    );
    expect(
      reduced.beats.every(({ durationMs, cue }) => durationMs === 0 && cue.shakePx === 0),
    ).toBe(true);
  });
});

describe('playPresentationSequence', () => {
  it('supports skip, abort and animation timeout recovery', async () => {
    const sequence = compilePresentation(relayEvents.slice(0, 4));
    const played: string[] = [];
    const player: BeatPlayer = {
      play: vi.fn(async (beat) => {
        played.push(beat.id);
      }),
    };

    const skipped = await playPresentationSequence(sequence, player, {
      startAt: 2,
      timeoutMs: 50,
    });
    expect(skipped).toMatchObject({ completed: true, nextIndex: sequence.beats.length });
    expect(played).toEqual(sequence.beats.slice(2).map(({ id }) => id));

    const controller = new AbortController();
    controller.abort();
    const aborted = await playPresentationSequence(sequence, player, {
      signal: controller.signal,
    });
    expect(aborted).toMatchObject({ completed: false, aborted: true, nextIndex: 0 });

    const stalled: BeatPlayer = { play: () => new Promise(() => undefined) };
    const recovered = await playPresentationSequence(sequence, stalled, { timeoutMs: 1 });
    expect(recovered).toMatchObject({
      completed: true,
      timedOutBeatIds: sequence.beats.map(({ id }) => id),
    });
  });
});
