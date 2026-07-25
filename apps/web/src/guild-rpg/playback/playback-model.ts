import type {
  BattleUnit,
  ComboEvent,
  ComboMetrics,
  ComboRuntimeState,
} from '@expedition/shared-types';

import type { ComboEscalationStage } from '../presenters';

export interface PlaybackProjection {
  events: readonly ComboEvent[];
  metrics: ComboMetrics;
  progress: { visible: number; total: number };
  stage: ComboEscalationStage;
  currentImpact: PlaybackImpact;
}

interface PlaybackTickInput {
  events: readonly ComboEvent[];
  reducedMotion: boolean;
  speed: 1 | 2;
  visibleEventCount: number;
}

export interface PlaybackImpact {
  kind: 'stack' | 'trigger' | 'hit' | 'kill' | 'overkill' | 'annihilation';
  label: string;
  targetId?: string;
  amount?: number;
}

export type PlaybackTick =
  { type: 'advance'; count: number; delayMs: number } | { type: 'complete'; delayMs: number };

export function createPlaybackProjection(
  runtime: ComboRuntimeState,
  eventStartIndex: number,
  visibleEventCount: number,
): PlaybackProjection {
  const releaseEvents = runtime.events.slice(eventStartIndex);
  const visible = Math.min(releaseEvents.length, Math.max(0, visibleEventCount));
  const events = releaseEvents.slice(0, visible);
  const complete = visible === releaseEvents.length;

  const stage = playbackStage(events);
  return {
    events,
    metrics: complete ? runtime.metrics : projectVisibleMetrics(events),
    progress: { visible, total: releaseEvents.length },
    stage,
    currentImpact: playbackImpact(events, stage),
  };
}

export function nextPlaybackTick(input: PlaybackTickInput): PlaybackTick {
  const remaining = Math.max(0, input.events.length - input.visibleEventCount);
  if (remaining === 0) return { type: 'complete', delayMs: 700 };
  if (input.reducedMotion) return { type: 'advance', count: remaining, delayMs: 0 };
  const progress = input.visibleEventCount / Math.max(1, input.events.length);
  const ramp = progress >= 0.75 ? 3 : progress >= 0.5 ? 2 : 1;
  const nextEvent = input.events[input.visibleEventCount];
  const previousEvent = input.events[input.visibleEventCount - 1];
  const impactPause = isImpactEvent(nextEvent) || isImpactEvent(previousEvent);
  return {
    type: 'advance',
    count: Math.min(remaining, impactPause ? 1 : input.speed * ramp),
    delayMs: impactPause ? (input.speed === 2 ? 140 : 240) : input.speed * ramp > 1 ? 90 : 180,
  };
}

export function projectPlaybackUnits(
  startingUnits: readonly BattleUnit[],
  resolvedUnits: readonly BattleUnit[],
  projection: PlaybackProjection,
): readonly BattleUnit[] {
  if (projection.progress.visible === projection.progress.total) return resolvedUnits;
  return projection.events.reduce<readonly BattleUnit[]>((units, event) => {
    if (!event.targetId) return units;
    if (!['damage', 'healing', 'unit_defeated'].includes(event.kind)) return units;
    return units.map((unit) => {
      if (unit.id !== event.targetId) return unit;
      if (event.kind === 'unit_defeated') return { ...unit, currentHp: 0 };
      const signedAmount = event.kind === 'healing' ? (event.amount ?? 0) : -(event.amount ?? 0);
      return {
        ...unit,
        currentHp: Math.min(unit.stats.hp, Math.max(0, unit.currentHp + signedAmount)),
      };
    });
  }, startingUnits);
}

function playbackStage(events: readonly ComboEvent[]): ComboEscalationStage {
  if (events.some((event) => event.kind === 'victory')) return 'annihilation';
  if (events.some((event) => ['overkill', 'infinite_engine'].includes(event.kind))) {
    return 'overkill';
  }
  if (events.some((event) => event.kind === 'unit_defeated')) return 'break';
  if (
    events.some((event) => event.kind === 'rule_triggered') ||
    events.filter((event) => event.kind === 'card_played').length >= 2
  ) {
    return 'trigger';
  }
  return 'stack';
}

function playbackImpact(
  events: readonly ComboEvent[],
  stage: ComboEscalationStage,
): PlaybackImpact {
  if (stage === 'annihilation') return { kind: 'annihilation', label: 'ANNIHILATION' };
  const latest = events.at(-1);
  if (!latest) return { kind: 'stack', label: 'STACKING' };
  if (latest.kind === 'overkill' || latest.kind === 'infinite_engine') {
    return {
      kind: 'overkill',
      ...(latest.targetId ? { targetId: latest.targetId } : {}),
      ...(latest.amount !== undefined ? { amount: latest.amount } : {}),
      label: latest.amount !== undefined ? `OVERKILL +${latest.amount}` : 'INFINITE ENGINE',
    };
  }
  if (latest.kind === 'unit_defeated') {
    return {
      kind: 'kill',
      ...(latest.targetId ? { targetId: latest.targetId } : {}),
      label: 'EXECUTED',
    };
  }
  if (latest.kind === 'damage') {
    return {
      kind: 'hit',
      ...(latest.targetId ? { targetId: latest.targetId } : {}),
      ...(latest.amount !== undefined ? { amount: latest.amount } : {}),
      label: latest.amount !== undefined ? `IMPACT ${latest.amount}` : 'IMPACT',
    };
  }
  if (latest.kind === 'rule_triggered') return { kind: 'trigger', label: 'RULE TRIGGERED' };
  if (stage === 'overkill') {
    const overkill = events.findLast((event) =>
      ['overkill', 'infinite_engine'].includes(event.kind),
    );
    return {
      kind: 'overkill',
      ...(overkill?.targetId ? { targetId: overkill.targetId } : {}),
      ...(overkill?.amount !== undefined ? { amount: overkill.amount } : {}),
      label: overkill?.amount !== undefined ? `OVERKILL +${overkill.amount}` : 'INFINITE ENGINE',
    };
  }
  if (stage === 'break') {
    const defeated = events.findLast((event) => event.kind === 'unit_defeated');
    return {
      kind: 'kill',
      ...(defeated?.targetId ? { targetId: defeated.targetId } : {}),
      label: 'EXECUTED',
    };
  }
  return stage === 'trigger'
    ? { kind: 'trigger', label: 'ENGINE CHAINING' }
    : { kind: 'stack', label: 'STACKING' };
}

function isImpactEvent(event?: ComboEvent) {
  return Boolean(
    event && ['unit_defeated', 'overkill', 'infinite_engine', 'victory'].includes(event.kind),
  );
}

function projectVisibleMetrics(events: readonly ComboEvent[]): ComboMetrics {
  return {
    comboCount: events.filter((event) => event.kind !== 'enemy_pressure').length,
    totalDamage: sumAmounts(events, 'damage'),
    totalOverkill: sumAmounts(events, 'overkill'),
    defeatedEnemyIds: events
      .filter((event) => event.kind === 'unit_defeated' && event.targetId)
      .map((event) => event.targetId!),
    annihilationOverflow: sumAmounts(events, 'overkill'),
  };
}

function sumAmounts(events: readonly ComboEvent[], kind: ComboEvent['kind']): number {
  return events
    .filter((event) => event.kind === kind)
    .reduce((total, event) => total + (event.amount ?? 0), 0);
}
