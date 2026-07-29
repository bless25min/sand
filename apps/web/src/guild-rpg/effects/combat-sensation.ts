import type { GuildPreferences } from '../preferences/guild-preferences';
import type { CombatBeat } from '../presentation/combat-beats';

interface CombatTone {
  frequency: number;
  endFrequency: number;
  durationMs: number;
  gain: number;
  wave: OscillatorType;
}

export interface CombatSensationPorts {
  vibrate?: (pattern: readonly number[]) => boolean;
  tone?: (tone: CombatTone) => void;
}

const FREQUENCY: Readonly<Record<CombatBeat['kind'], number>> = {
  cast: 220,
  hit: 130,
  enemy: 92,
  status: 280,
  chain: 330,
  relay: 250,
  defeat: 105,
  finisher: 360,
  total: 190,
  support: 430,
  info: 180,
};

function hapticFor(beat: CombatBeat): readonly number[] {
  if (beat.kind === 'finisher') return [48, 30, 108];
  if (beat.kind === 'defeat') return [34, 20, 70];
  if (beat.kind === 'total') return [24, 16, 54];
  if (beat.kind === 'chain') return [18, 16, 22, 18, 28 + beat.relay * 3];
  if (beat.kind === 'hit') return [14 + beat.relay * 2, 24];
  if (beat.kind === 'enemy') return [26, 18, 36];
  return [10 + beat.relay * 2];
}

function browserPorts(): CombatSensationPorts {
  if (typeof window === 'undefined') return {};
  return {
    ...(typeof navigator.vibrate === 'function'
      ? { vibrate: (pattern: readonly number[]) => navigator.vibrate([...pattern]) }
      : {}),
    tone: (tone) => {
      const AudioContextConstructor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;
      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;
      const end = start + tone.durationMs / 1_000;
      oscillator.type = tone.wave;
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, tone.gain), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => void context.close().catch(() => undefined);
      oscillator.start(start);
      oscillator.stop(end);
    },
  };
}

export function playCombatSensation(
  beat: CombatBeat,
  preferences: GuildPreferences,
  suppliedPorts?: CombatSensationPorts,
) {
  const ports = suppliedPorts ?? browserPorts();
  if (preferences.hapticsEnabled) {
    try {
      ports.vibrate?.(hapticFor(beat));
    } catch {
      // Haptics are optional and must never block battle playback.
    }
  }
  if (!preferences.musicEnabled || preferences.masterVolume <= 0) return;
  try {
    const frequency = FREQUENCY[beat.kind];
    ports.tone?.({
      frequency,
      endFrequency: beat.kind === 'finisher' ? 86 : frequency * 1.35,
      durationMs: beat.kind === 'finisher' ? 280 : 70 + beat.relay * 14,
      gain: Math.min(0.18, preferences.masterVolume * (0.08 + beat.relay * 0.012)),
      wave: beat.kind === 'hit' || beat.kind === 'finisher' ? 'sawtooth' : 'triangle',
    });
  } catch {
    // Web Audio may be denied or unavailable; visuals remain fully functional.
  }
}
