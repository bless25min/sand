import { describe, expect, it, vi } from 'vitest';

import { createDefaultGuildPreferences } from '../preferences/guild-preferences';
import type { CombatBeat } from '../presentation/combat-beats';
import { playCombatSensation } from './combat-sensation';

const beat = (
  relay: number,
  kind: CombatBeat['kind'],
  options: Pick<CombatBeat, 'actorId' | 'element'> = {},
): CombatBeat => ({
  id: `${relay}:${kind}`,
  sourceEventIds: [relay],
  kind,
  label: kind,
  relay,
  delayMs: 0,
  eventKind: kind === 'hit' ? 'damage' : 'relay',
  visual: {
    id: `visual:${relay}:${kind}`,
    sourceEventId: relay,
    eventKind: kind === 'hit' ? 'damage' : 'relay',
    phase: kind === 'finisher' ? 'finisher' : kind === 'hit' ? 'impact' : 'aftermath',
    headline: kind,
    detail: kind,
    relay,
    intensity: relay * 12,
    durationMs: 0,
    polarity: kind === 'hit' || kind === 'finisher' ? 'damage' : 'neutral',
    route: 'none',
    camera: kind === 'finisher' ? 'finisher' : 'none',
  },
  ...options,
});

describe('combat sensation output', () => {
  it('escalates optional haptics without making unsupported output fatal', () => {
    const vibrate = vi.fn(() => true);
    const sound = vi.fn();
    const preferences = createDefaultGuildPreferences(false);

    expect(() =>
      playCombatSensation(beat(2, 'hit'), preferences, { vibrate, sound }),
    ).not.toThrow();
    playCombatSensation(beat(6, 'finisher'), preferences, { vibrate, sound });

    expect(vibrate).toHaveBeenNthCalledWith(1, [18, 24]);
    expect(vibrate).toHaveBeenNthCalledWith(2, [48, 30, 108]);
    expect(sound.mock.calls[1]?.[0]).toMatchObject({ voice: 'brann-shield', finisher: true });
    expect(sound.mock.calls[1]?.[0].layers.length).toBeGreaterThan(
      sound.mock.calls[0]?.[0].layers.length,
    );
  });

  it('gives all six heroes distinct voices and strictly adds a layer at every relay', () => {
    const sound = vi.fn();
    const preferences = createDefaultGuildPreferences(false);
    const actors = ['brann', 'lyra', 'elin', 'seph', 'lorne', 'kyro'];

    for (const actorId of actors) {
      playCombatSensation(beat(3, 'cast', { actorId, element: 'fire' }), preferences, { sound });
    }
    const voices = sound.mock.calls.map(([cue]) => cue.voice);
    expect(new Set(voices).size).toBe(6);

    sound.mockClear();
    for (let relay = 1; relay <= 6; relay += 1) {
      playCombatSensation(
        beat(relay, 'chain', { actorId: 'kyro', element: 'grass' }),
        preferences,
        { sound },
      );
    }
    const layerCounts = sound.mock.calls.map(([cue]) => cue.layers.length);
    const energies = sound.mock.calls.map(([cue]) =>
      cue.layers.reduce((sum: number, layer: { gain: number }) => sum + layer.gain, 0),
    );
    expect(
      layerCounts.every((count, index) => index === 0 || count > layerCounts[index - 1]!),
    ).toBe(true);
    expect(energies.every((energy, index) => index === 0 || energy > energies[index - 1]!)).toBe(
      true,
    );
  });

  it('separates cast, impact, status, chain, relay, and finisher sound signatures', () => {
    const sound = vi.fn();
    const preferences = createDefaultGuildPreferences(false);
    const kinds = ['cast', 'hit', 'status', 'chain', 'relay', 'finisher'] as const;

    for (const kind of kinds) {
      playCombatSensation(beat(4, kind, { actorId: 'elin', element: 'water' }), preferences, {
        sound,
      });
    }
    const signatures = sound.mock.calls.map(([cue]) =>
      cue.layers
        .map(
          (layer: { frequency: number; endFrequency: number; wave: string; offsetMs: number }) =>
            `${layer.frequency}:${layer.endFrequency}:${layer.wave}:${layer.offsetMs}`,
        )
        .join('|'),
    );
    expect(new Set(signatures).size).toBe(kinds.length);
  });

  it('does nothing when sound and haptics are disabled', () => {
    const vibrate = vi.fn(() => true);
    const sound = vi.fn();
    const preferences = {
      ...createDefaultGuildPreferences(false),
      musicEnabled: false,
      hapticsEnabled: false,
    };

    playCombatSensation(beat(4, 'chain'), preferences, { vibrate, sound });

    expect(vibrate).not.toHaveBeenCalled();
    expect(sound).not.toHaveBeenCalled();
  });
});
