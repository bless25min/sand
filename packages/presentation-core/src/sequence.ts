import type {
  BattleEventKind,
  GuildBattleEvent,
  GuildElement,
  SkillSpecialization,
  TriggerCondition,
} from '@expedition/shared-types';

export type PresentationBeatKind =
  | 'cast'
  | 'impact'
  | 'status'
  | 'trigger'
  | 'relay'
  | 'support'
  | 'enemy'
  | 'defeat'
  | 'finisher'
  | 'info';

export type PresentationRoute = 'none' | 'direct' | 'area' | 'bounce' | 'echo-self' | 'relay';

export interface PresentationCue {
  particles: number;
  rings: number;
  afterimages: number;
  shakePx: number;
  hitStopMs: number;
  cameraZoom: number;
  flashAlpha: number;
}

export interface PresentationNumber {
  kind: 'damage' | 'healing' | 'status' | 'overkill';
  value: number;
}

export interface PresentationBeat {
  id: string;
  sourceEventIds: readonly number[];
  eventKind: BattleEventKind;
  kind: PresentationBeatKind;
  tier: number;
  durationMs: number;
  route: PresentationRoute;
  cue: PresentationCue;
  actorId?: string;
  targetId?: string;
  skillId?: string;
  amount?: number;
  number?: PresentationNumber;
  element?: GuildElement;
  specializationId?: SkillSpecialization;
  triggerId?: TriggerCondition;
}

export interface PresentationSequence {
  beats: readonly PresentationBeat[];
  reducedMotion: boolean;
}

const kindFor = (event: GuildBattleEvent): PresentationBeatKind => {
  if (event.kind === 'skill_cast') return 'cast';
  if (event.kind === 'damage' || event.kind === 'reaction') return 'impact';
  if (event.kind === 'status_applied' || event.kind === 'weaken' || event.kind === 'strengthen') {
    return 'status';
  }
  if (
    event.kind === 'triggered' ||
    event.kind === 'core_triggered' ||
    event.kind === 'passive' ||
    event.kind === 'bounce' ||
    event.kind === 'echo'
  ) {
    return 'trigger';
  }
  if (event.kind === 'relay') return 'relay';
  if (event.kind === 'healing') return 'support';
  if (event.kind === 'enemy_attack' || event.kind === 'dodge' || event.kind === 'guard') {
    return 'enemy';
  }
  if (event.kind === 'unit_defeated' || event.kind === 'defeat') return 'defeat';
  if (
    event.kind === 'finisher' ||
    event.kind === 'overkill' ||
    event.kind === 'infinite_engine' ||
    event.kind === 'boss_phase' ||
    event.kind === 'victory'
  ) {
    return 'finisher';
  }
  return 'info';
};

const routeFor = (event: GuildBattleEvent): PresentationRoute => {
  if (event.kind === 'bounce' || event.triggerId === 'on_bounce') return 'bounce';
  if (event.kind === 'echo' || event.triggerId === 'on_echo' || event.triggerId === 'lone_target') {
    return 'echo-self';
  }
  if (
    event.kind === 'relay' ||
    event.triggerId?.startsWith('previous_') ||
    event.triggerId === 'ally_same_element' ||
    event.triggerId === 'team_three_elements'
  ) {
    return 'relay';
  }
  if (event.kind === 'victory' || event.kind === 'finisher' || event.kind === 'infinite_engine') {
    return 'area';
  }
  if (
    event.kind === 'status_applied' ||
    event.kind === 'weaken' ||
    event.kind === 'strengthen' ||
    event.kind === 'triggered' ||
    event.kind === 'core_triggered' ||
    event.kind === 'passive'
  ) {
    return 'none';
  }
  return event.actorId && event.targetId ? 'direct' : 'none';
};

const numberFor = (event: GuildBattleEvent): PresentationNumber | undefined => {
  const value = Math.abs(event.amount ?? 0);
  if (value === 0) return undefined;
  if (event.kind === 'damage' || event.kind === 'reaction' || event.kind === 'enemy_attack') {
    return { kind: 'damage', value };
  }
  if (event.kind === 'healing') return { kind: 'healing', value };
  if (event.kind === 'overkill') return { kind: 'overkill', value };
  if (event.kind === 'status_applied' || event.kind === 'weaken' || event.kind === 'strengthen') {
    return { kind: 'status', value };
  }
  return undefined;
};

const cueFor = (tier: number, reducedMotion: boolean): PresentationCue => {
  if (reducedMotion) {
    return {
      particles: 0,
      rings: 1,
      afterimages: 0,
      shakePx: 0,
      hitStopMs: 0,
      cameraZoom: 1,
      flashAlpha: 0,
    };
  }
  return {
    particles: 12 + tier * tier * 8,
    rings: 1 + tier + Math.floor((tier * tier) / 3),
    afterimages: tier + Math.floor((tier * tier) / 4),
    shakePx: tier === 1 ? 0 : Number((tier * tier * 0.8).toFixed(1)),
    hitStopMs: 24 + tier * tier * 7,
    cameraZoom: Number((1 + tier * tier * 0.008).toFixed(3)),
    flashAlpha: Number(Math.min(0.9, 0.08 + tier * tier * 0.02).toFixed(2)),
  };
};

export function compilePresentation(
  events: readonly GuildBattleEvent[],
  options: { reducedMotion?: boolean; baseTier?: number } = {},
): PresentationSequence {
  const reducedMotion = options.reducedMotion ?? false;
  const baseTier = Math.max(1, Math.min(6, Math.trunc(options.baseTier ?? 1)));
  let tier = baseTier;
  let castCount = 0;
  const beats = events.map((event): PresentationBeat => {
    if (event.kind === 'skill_cast') {
      castCount += 1;
      tier = Math.max(1, Math.min(6, baseTier + castCount - 1));
    } else if (event.causalDepth !== undefined) {
      tier = Math.max(tier, Math.max(1, Math.min(6, Math.trunc(event.causalDepth))));
    }
    const kind = kindFor(event);
    const durationMs = reducedMotion
      ? 0
      : kind === 'finisher'
        ? 420 + tier * 35
        : kind === 'relay'
          ? 190 + tier * 20
          : 130 + tier * 18;
    const number = numberFor(event);
    return {
      id: `event-${event.id}-${kind}`,
      sourceEventIds: [event.id],
      eventKind: event.kind,
      kind,
      tier,
      durationMs,
      route: routeFor(event),
      cue: cueFor(tier, reducedMotion),
      ...(event.actorId ? { actorId: event.actorId } : {}),
      ...(event.targetId ? { targetId: event.targetId } : {}),
      ...(event.skillId ? { skillId: event.skillId } : {}),
      ...(event.amount !== undefined ? { amount: event.amount } : {}),
      ...(number ? { number } : {}),
      ...(event.element ? { element: event.element } : {}),
      ...(event.specializationId ? { specializationId: event.specializationId } : {}),
      ...(event.triggerId ? { triggerId: event.triggerId } : {}),
    };
  });
  return { beats, reducedMotion };
}

export interface BeatPlayer {
  play(beat: PresentationBeat, signal: AbortSignal): Promise<void>;
}

export interface PresentationPlaybackOptions {
  signal?: AbortSignal;
  startAt?: number;
  timeoutMs?: number;
}

export interface PresentationPlaybackResult {
  completed: boolean;
  aborted: boolean;
  nextIndex: number;
  timedOutBeatIds: readonly string[];
}

const playWithTimeout = async (
  player: BeatPlayer,
  beat: PresentationBeat,
  parentSignal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<'played' | 'timeout' | 'aborted'> => {
  if (parentSignal?.aborted) return 'aborted';
  const controller = new AbortController();
  const abort = () => controller.abort();
  parentSignal?.addEventListener('abort', abort, { once: true });
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      player.play(beat, controller.signal).then(() => 'played' as const),
      new Promise<'timeout'>((resolve) => {
        timeoutId = setTimeout(
          () => {
            controller.abort();
            resolve('timeout');
          },
          Math.max(0, timeoutMs),
        );
      }),
      ...(parentSignal
        ? [
            new Promise<'aborted'>((resolve) => {
              parentSignal.addEventListener('abort', () => resolve('aborted'), { once: true });
            }),
          ]
        : []),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    parentSignal?.removeEventListener('abort', abort);
  }
};

export async function playPresentationSequence(
  sequence: PresentationSequence,
  player: BeatPlayer,
  options: PresentationPlaybackOptions = {},
): Promise<PresentationPlaybackResult> {
  const startAt = Math.max(0, Math.min(sequence.beats.length, Math.trunc(options.startAt ?? 0)));
  const timeoutMs = Math.max(1, Math.trunc(options.timeoutMs ?? 2_000));
  const timedOutBeatIds: string[] = [];

  if (options.signal?.aborted) {
    return { completed: false, aborted: true, nextIndex: startAt, timedOutBeatIds };
  }

  for (let index = startAt; index < sequence.beats.length; index += 1) {
    const beat = sequence.beats[index]!;
    const result = await playWithTimeout(player, beat, options.signal, timeoutMs);
    if (result === 'aborted') {
      return { completed: false, aborted: true, nextIndex: index, timedOutBeatIds };
    }
    if (result === 'timeout') timedOutBeatIds.push(beat.id);
  }

  return {
    completed: true,
    aborted: false,
    nextIndex: sequence.beats.length,
    timedOutBeatIds,
  };
}
