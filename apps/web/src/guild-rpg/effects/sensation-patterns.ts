import type { SensationCueId } from '../presentation/sensation-cues';

export interface ToneSpec {
  frequency: number;
  endFrequency: number;
  duration: number;
  gain: number;
  wave: OscillatorType;
  pulseBedFrequency?: number;
}

const TONES: Readonly<Record<SensationCueId, ToneSpec>> = {
  stack: { frequency: 160, endFrequency: 210, duration: 0.07, gain: 0.2, wave: 'sine' },
  trigger: { frequency: 280, endFrequency: 460, duration: 0.11, gain: 0.28, wave: 'triangle' },
  block: { frequency: 105, endFrequency: 78, duration: 0.12, gain: 0.34, wave: 'square' },
  break: { frequency: 190, endFrequency: 70, duration: 0.16, gain: 0.38, wave: 'sawtooth' },
  hit: { frequency: 130, endFrequency: 95, duration: 0.08, gain: 0.3, wave: 'square' },
  kill: { frequency: 115, endFrequency: 52, duration: 0.2, gain: 0.44, wave: 'sawtooth' },
  overkill: { frequency: 210, endFrequency: 62, duration: 0.28, gain: 0.52, wave: 'sawtooth' },
  'boss-execution': {
    frequency: 92,
    endFrequency: 44,
    duration: 0.34,
    gain: 0.58,
    wave: 'sawtooth',
    pulseBedFrequency: 46,
  },
  annihilation: {
    frequency: 360,
    endFrequency: 86,
    duration: 0.46,
    gain: 0.62,
    wave: 'triangle',
    pulseBedFrequency: 54,
  },
  loot: { frequency: 520, endFrequency: 840, duration: 0.2, gain: 0.34, wave: 'sine' },
  'rule-online': {
    frequency: 420,
    endFrequency: 690,
    duration: 0.24,
    gain: 0.38,
    wave: 'triangle',
  },
};

const HAPTICS: Readonly<Record<SensationCueId, readonly number[]>> = {
  stack: [12],
  trigger: [18, 22, 24],
  block: [42],
  break: [28, 18, 58],
  hit: [22],
  kill: [35, 24, 72],
  overkill: [45, 22, 80, 24, 110],
  'boss-execution': [70, 30, 110, 35, 150],
  annihilation: [90, 35, 130, 40, 180],
  loot: [18, 28, 18, 28, 36],
  'rule-online': [22, 20, 45, 20, 70],
};

export function toneForCue(cue: SensationCueId): ToneSpec {
  return TONES[cue];
}

export function hapticPatternForCue(cue: SensationCueId): readonly number[] {
  return HAPTICS[cue];
}
