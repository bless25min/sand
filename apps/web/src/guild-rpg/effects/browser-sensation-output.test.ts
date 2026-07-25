import { describe, expect, it, vi } from 'vitest';
import { SPECTACLE_CUE_IDS } from '@expedition/shared-types';

import { createDefaultGuildPreferences } from '../preferences/guild-preferences';
import type { SensationCueId } from '../presentation/sensation-cues';
import { createBrowserSensationOutput, hapticPatternForCue } from './browser-sensation-output';

function createAudioHarness() {
  const gainValues: number[] = [];
  const frequencyValues: number[] = [];
  const starts: number[] = [];
  const stops: number[] = [];
  const context = {
    currentTime: 3,
    state: 'suspended',
    destination: {},
    resume: vi.fn(() => {
      context.state = 'running';
      return Promise.resolve();
    }),
    suspend: vi.fn(() => {
      context.state = 'suspended';
      return Promise.resolve();
    }),
    close: vi.fn(() => Promise.resolve()),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: (value: number) => gainValues.push(value),
        exponentialRampToValueAtTime: (value: number) => gainValues.push(value),
      },
      connect: vi.fn(),
    })),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: {
        setValueAtTime: (value: number) => frequencyValues.push(value),
        exponentialRampToValueAtTime: (value: number) => frequencyValues.push(value),
      },
      connect: vi.fn(),
      start: (time: number) => starts.push(time),
      stop: (time: number) => stops.push(time),
    })),
  };
  return { context, gainValues, frequencyValues, starts, stops };
}

describe('browser sensation output', () => {
  it('waits for a user unlock, clamps volume, plays a bounded tone and haptic identity', () => {
    const audio = createAudioHarness();
    const vibrate = vi.fn(() => true);
    const output = createBrowserSensationOutput(
      {
        createAudioContext: () => audio.context,
        vibrate,
      },
      { ...createDefaultGuildPreferences(false), masterVolume: 9 },
    );

    output.play('overkill');
    expect(audio.starts).toEqual([]);

    output.unlock();
    output.play('overkill');

    expect(audio.context.resume).toHaveBeenCalledOnce();
    expect(audio.frequencyValues.length).toBeGreaterThan(0);
    expect(Math.max(...audio.gainValues)).toBeLessThanOrEqual(1);
    expect(audio.starts).toHaveLength(1);
    expect(audio.stops[0]! - audio.starts[0]!).toBeLessThanOrEqual(0.5);
    expect(vibrate).toHaveBeenCalledWith(hapticPatternForCue('overkill'));

    output.play('boss-execution');
    expect(audio.starts).toHaveLength(3);
    expect(audio.frequencyValues).toContain(46);
  });

  it('suspends cleanly, honors sound and haptic toggles, and tolerates unsupported browsers', () => {
    const audio = createAudioHarness();
    const vibrate = vi.fn(() => true);
    const output = createBrowserSensationOutput(
      { createAudioContext: () => audio.context, vibrate },
      createDefaultGuildPreferences(false),
    );
    output.unlock();
    output.play('kill');
    expect(audio.starts).toHaveLength(1);
    output.setPaused(true);
    output.play('hit');
    expect(audio.context.suspend).toHaveBeenCalledOnce();
    expect(audio.stops.at(-1)).toBe(audio.context.currentTime);
    expect(vibrate).toHaveBeenLastCalledWith(0);
    const vibrationCallsAfterPause = vibrate.mock.calls.length;

    output.setPaused(false);
    output.updatePreferences({
      ...createDefaultGuildPreferences(false),
      musicEnabled: false,
      hapticsEnabled: false,
    });
    output.play('kill');
    expect(audio.starts).toHaveLength(1);
    expect(vibrate).toHaveBeenCalledTimes(vibrationCallsAfterPause);
    output.dispose();
    expect(vibrate).toHaveBeenLastCalledWith(0);
    expect(audio.context.close).toHaveBeenCalledOnce();

    const unsupported = createBrowserSensationOutput({}, createDefaultGuildPreferences(false));
    expect(() => {
      unsupported.unlock();
      unsupported.play('annihilation');
      unsupported.setPaused(true);
      unsupported.dispose();
    }).not.toThrow();
  });

  it('keeps every haptic cue short enough to preserve impact without buzzing continuously', () => {
    const cues: readonly SensationCueId[] = SPECTACLE_CUE_IDS;

    for (const cue of cues) {
      const pattern = hapticPatternForCue(cue);
      expect(pattern.length).toBeLessThanOrEqual(7);
      expect(Math.max(...pattern)).toBeLessThanOrEqual(180);
      expect(pattern.reduce((total, value) => total + value, 0)).toBeLessThanOrEqual(600);
    }
  });
});
