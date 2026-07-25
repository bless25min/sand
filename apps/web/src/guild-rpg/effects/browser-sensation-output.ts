import type { GuildPreferences } from '../preferences/guild-preferences';
import type { SensationCueId } from '../presentation/sensation-cues';
import { hapticPatternForCue, toneForCue, type ToneSpec } from './sensation-patterns';

export { hapticPatternForCue } from './sensation-patterns';

interface AudioParamPort {
  setValueAtTime(value: number, time: number): void;
  exponentialRampToValueAtTime(value: number, time: number): void;
}

interface GainPort {
  gain: AudioParamPort;
  connect(destination: unknown): unknown;
}

interface OscillatorPort {
  type: string;
  onended?: (() => void) | null;
  frequency: AudioParamPort;
  connect(destination: unknown): unknown;
  start(time: number): void;
  stop(time: number): void;
}

interface AudioContextPort {
  currentTime: number;
  state: string;
  destination: unknown;
  createGain(): GainPort;
  createOscillator(): OscillatorPort;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
}

export interface BrowserSensationPorts {
  createAudioContext?: () => AudioContextPort;
  vibrate?: (pattern: number | readonly number[]) => boolean;
}

export interface SensationOutput {
  unlock(): void;
  play(cue: SensationCueId): void;
  setPaused(paused: boolean): void;
  updatePreferences(preferences: GuildPreferences): void;
  dispose(): void;
}

function normalizePreferences(preferences: GuildPreferences): GuildPreferences {
  return {
    ...preferences,
    masterVolume: Math.max(0, Math.min(1, preferences.masterVolume)),
  };
}

function scheduleTone(context: AudioContextPort, spec: ToneSpec, masterVolume: number) {
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const peak = Math.max(0.0001, Math.min(1, masterVolume * spec.gain));
  oscillator.type = spec.wave;
  oscillator.frequency.setValueAtTime(spec.frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(spec.endFrequency, start + spec.duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.025, spec.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + spec.duration);
  return oscillator;
}

function browserPorts(): BrowserSensationPorts {
  if (typeof window === 'undefined') return {};
  const AudioContextConstructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return {
    ...(AudioContextConstructor
      ? {
          createAudioContext: () => new AudioContextConstructor() as unknown as AudioContextPort,
        }
      : {}),
    ...(typeof navigator.vibrate === 'function'
      ? {
          vibrate: (pattern: number | readonly number[]) =>
            navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]),
        }
      : {}),
  };
}

export function createBrowserSensationOutput(
  suppliedPorts: BrowserSensationPorts | undefined,
  initialPreferences: GuildPreferences,
): SensationOutput {
  const ports = suppliedPorts ?? browserPorts();
  let preferences = normalizePreferences(initialPreferences);
  let context: AudioContextPort | undefined;
  let unlocked = false;
  let paused = false;
  let disposed = false;
  const activeOscillators = new Set<OscillatorPort>();

  const resume = () => {
    if (!context || context.state === 'running') return;
    void context.resume().catch(() => undefined);
  };
  const suspend = () => {
    if (!context || context.state === 'suspended') return;
    void context.suspend().catch(() => undefined);
  };
  const schedule = (spec: ToneSpec) => {
    if (!context) return;
    const oscillator = scheduleTone(context, spec, preferences.masterVolume);
    activeOscillators.add(oscillator);
    oscillator.onended = () => activeOscillators.delete(oscillator);
  };
  const stopActive = () => {
    try {
      ports.vibrate?.(0);
    } catch {
      // Haptics are optional.
    }
    for (const oscillator of activeOscillators) {
      try {
        oscillator.stop(context?.currentTime ?? 0);
      } catch {
        // An oscillator may already have reached its scheduled end.
      }
    }
    activeOscillators.clear();
  };

  return {
    unlock() {
      if (disposed || unlocked) return;
      unlocked = true;
      try {
        context = ports.createAudioContext?.();
        if (!paused && preferences.musicEnabled) resume();
      } catch {
        context = undefined;
      }
    },
    play(cue) {
      if (disposed || !unlocked || paused) return;
      if (preferences.hapticsEnabled) {
        try {
          ports.vibrate?.(hapticPatternForCue(cue));
        } catch {
          // Sensation output is optional and never interrupts the game.
        }
      }
      if (!preferences.musicEnabled || !context || preferences.masterVolume <= 0) return;
      try {
        resume();
        const spec = toneForCue(cue);
        schedule(spec);
        if (spec.pulseBedFrequency) {
          schedule({
            ...spec,
            frequency: spec.pulseBedFrequency,
            endFrequency: Math.max(30, spec.pulseBedFrequency * 0.72),
            gain: spec.gain * 0.28,
            wave: 'sine',
          });
        }
      } catch {
        // Unsupported or interrupted Web Audio must remain a silent fallback.
      }
    },
    setPaused(nextPaused) {
      paused = nextPaused;
      if (paused) {
        stopActive();
        suspend();
      } else if (unlocked && preferences.musicEnabled) resume();
    },
    updatePreferences(nextPreferences) {
      preferences = normalizePreferences(nextPreferences);
      if (!preferences.musicEnabled) suspend();
      else if (unlocked && !paused) resume();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        stopActive();
        if (context) void context.close().catch(() => undefined);
      } finally {
        context = undefined;
      }
    },
  };
}
