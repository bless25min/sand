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
}

interface PlaybackTickInput {
  eventCount: number;
  reducedMotion: boolean;
  speed: 1 | 2;
  visibleEventCount: number;
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

  return {
    events,
    metrics: complete ? runtime.metrics : projectVisibleMetrics(events),
    progress: { visible, total: releaseEvents.length },
    stage: playbackStage(events),
  };
}

export function nextPlaybackTick(input: PlaybackTickInput): PlaybackTick {
  const remaining = Math.max(0, input.eventCount - input.visibleEventCount);
  if (remaining === 0) return { type: 'complete', delayMs: 700 };
  if (input.reducedMotion) return { type: 'advance', count: remaining, delayMs: 0 };
  return {
    type: 'advance',
    count: Math.min(remaining, input.speed),
    delayMs: input.speed === 2 ? 90 : 180,
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
  if (events.some((event) => ['overkill', 'infinite_engine', 'victory'].includes(event.kind))) {
    return 'overflow';
  }
  return events.some((event) => event.kind === 'unit_defeated') ? 'break' : 'stack';
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
