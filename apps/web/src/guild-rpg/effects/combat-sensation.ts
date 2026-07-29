import type { GuildPreferences } from '../preferences/guild-preferences';
import type { CombatBeat } from '../presentation/combat-beats';

interface CombatSoundLayer {
  offsetMs: number;
  frequency: number;
  endFrequency: number;
  durationMs: number;
  gain: number;
  wave: OscillatorType;
}

interface CombatSoundCue {
  voice: string;
  finisher: boolean;
  layers: readonly CombatSoundLayer[];
}

export interface CombatSensationPorts {
  vibrate?: (pattern: readonly number[]) => boolean;
  sound?: (cue: CombatSoundCue) => void;
}

interface VoiceProfile {
  name: string;
  pitch: number;
  wave: OscillatorType;
}

const DEFAULT_VOICE: VoiceProfile = {
  name: 'brann-shield',
  pitch: 0.72,
  wave: 'square',
};

const VOICE_BY_ACTOR: Readonly<Record<string, VoiceProfile>> = {
  brann: DEFAULT_VOICE,
  lyra: { name: 'lyra-bow', pitch: 1.42, wave: 'triangle' },
  elin: { name: 'elin-staff', pitch: 1.18, wave: 'sine' },
  seph: { name: 'seph-flask', pitch: 0.92, wave: 'square' },
  lorne: { name: 'lorne-tome', pitch: 0.84, wave: 'sine' },
  kyro: { name: 'kyro-blades', pitch: 1.56, wave: 'sawtooth' },
};

const KIND_PROFILE: Readonly<
  Record<
    CombatBeat['kind'],
    { frequency: number; endRatio: number; durationMs: number; spacingMs: number }
  >
> = {
  cast: { frequency: 210, endRatio: 1.42, durationMs: 82, spacingMs: 48 },
  hit: { frequency: 118, endRatio: 0.62, durationMs: 92, spacingMs: 22 },
  enemy: { frequency: 86, endRatio: 0.7, durationMs: 128, spacingMs: 28 },
  status: { frequency: 268, endRatio: 1.08, durationMs: 110, spacingMs: 62 },
  chain: { frequency: 318, endRatio: 1.64, durationMs: 76, spacingMs: 34 },
  relay: { frequency: 238, endRatio: 1.88, durationMs: 96, spacingMs: 52 },
  defeat: { frequency: 102, endRatio: 0.48, durationMs: 170, spacingMs: 42 },
  finisher: { frequency: 352, endRatio: 0.24, durationMs: 280, spacingMs: 44 },
  total: { frequency: 182, endRatio: 0.72, durationMs: 130, spacingMs: 38 },
  support: { frequency: 420, endRatio: 1.34, durationMs: 104, spacingMs: 58 },
  info: { frequency: 176, endRatio: 1.12, durationMs: 70, spacingMs: 54 },
};

const ELEMENT_PITCH = {
  fire: 0.94,
  grass: 0.78,
  water: 1.12,
} as const;

function hapticFor(beat: CombatBeat): readonly number[] {
  if (beat.kind === 'finisher') return [48, 30, 108];
  if (beat.kind === 'defeat') return [34, 20, 70];
  if (beat.kind === 'total') return [24, 16, 54];
  if (beat.kind === 'chain') return [18, 16, 22, 18, 28 + beat.relay * 3];
  if (beat.kind === 'hit') return [14 + beat.relay * 2, 24];
  if (beat.kind === 'enemy') return [26, 18, 36];
  return [10 + beat.relay * 2];
}

function soundFor(beat: CombatBeat, masterVolume: number): CombatSoundCue {
  const relay = Math.max(1, Math.min(6, Math.trunc(beat.relay)));
  const voice = VOICE_BY_ACTOR[beat.actorId ?? 'brann'] ?? DEFAULT_VOICE;
  const profile = KIND_PROFILE[beat.kind];
  const elementPitch = beat.element ? ELEMENT_PITCH[beat.element] : 1;
  const extraLayers = beat.kind === 'finisher' ? 2 : beat.kind === 'chain' ? 1 : 0;
  const layerCount = relay + extraLayers;
  const baseGain = Math.min(0.12, masterVolume * (0.028 + relay * 0.007));
  const layers = Array.from({ length: layerCount }, (_, index): CombatSoundLayer => {
    const chordStep =
      beat.kind === 'chain' || beat.kind === 'relay'
        ? 1 + index * 0.12
        : beat.kind === 'finisher'
          ? Math.max(0.46, 1 - index * 0.08)
          : 1 + (index % 3) * 0.045;
    const frequency = Math.max(
      48,
      Math.round(profile.frequency * voice.pitch * elementPitch * chordStep),
    );
    return {
      offsetMs: index * profile.spacingMs,
      frequency,
      endFrequency: Math.max(32, Math.round(frequency * profile.endRatio)),
      durationMs: profile.durationMs + relay * 8 + (beat.kind === 'finisher' ? index * 12 : 0),
      gain: Number((baseGain * Math.max(0.62, 1 - index * 0.045)).toFixed(4)),
      wave: index % 3 === 2 ? 'triangle' : voice.wave,
    };
  });
  return {
    voice: voice.name,
    finisher: beat.kind === 'finisher',
    layers,
  };
}

function browserPorts(): CombatSensationPorts {
  if (typeof window === 'undefined') return {};
  return {
    ...(typeof navigator.vibrate === 'function'
      ? { vibrate: (pattern: readonly number[]) => navigator.vibrate([...pattern]) }
      : {}),
    sound: (cue) => {
      const AudioContextConstructor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor || cue.layers.length === 0) return;
      const context = new AudioContextConstructor();
      let remaining = cue.layers.length;
      for (const layer of cue.layers) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + layer.offsetMs / 1_000;
        const end = start + layer.durationMs / 1_000;
        oscillator.type = layer.wave;
        oscillator.frequency.setValueAtTime(layer.frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(layer.endFrequency, end);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, layer.gain), start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => {
          remaining -= 1;
          if (remaining === 0) void context.close().catch(() => undefined);
        };
        oscillator.start(start);
        oscillator.stop(end);
      }
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
    ports.sound?.(soundFor(beat, preferences.masterVolume));
  } catch {
    // Web Audio may be denied or unavailable; visuals remain fully functional.
  }
}
