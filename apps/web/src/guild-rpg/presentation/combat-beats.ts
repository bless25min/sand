import type { BattleEventKind, GuildBattleEvent } from '@expedition/shared-types';

import { projectVisualEvents, type VisualEvent } from './visual-events';

type CombatBeatKind =
  'cast' | 'hit' | 'status' | 'chain' | 'relay' | 'defeat' | 'finisher' | 'support' | 'info';

export interface CombatBeat {
  id: string;
  kind: CombatBeatKind;
  label: string;
  relay: number;
  delayMs: number;
  actorId?: string;
  targetId?: string;
  amount?: number;
  element?: GuildBattleEvent['element'];
  eventKind: BattleEventKind;
  visual: VisualEvent;
}

export interface RelayPresentation {
  relay: number;
  label: string;
  visualPower: number;
  trailCount: number;
  shakePx: number;
  finisher: boolean;
}

const KIND_BY_EVENT: Readonly<Partial<Record<BattleEventKind, CombatBeatKind>>> = {
  skill_cast: 'cast',
  damage: 'hit',
  healing: 'support',
  guard: 'support',
  status_applied: 'status',
  reaction: 'chain',
  weaken: 'status',
  strengthen: 'support',
  triggered: 'chain',
  bounce: 'chain',
  echo: 'chain',
  relay: 'relay',
  core_triggered: 'chain',
  passive: 'chain',
  finisher: 'finisher',
  overkill: 'finisher',
  infinite_engine: 'finisher',
  unit_defeated: 'defeat',
  victory: 'finisher',
  defeat: 'defeat',
  battle_started: 'info',
};

const DELAY_BY_KIND: Readonly<Record<CombatBeatKind, number>> = {
  cast: 160,
  hit: 190,
  status: 150,
  chain: 175,
  relay: 220,
  defeat: 260,
  finisher: 360,
  support: 150,
  info: 100,
};

export function relayPresentation(relay: number): RelayPresentation {
  const normalized = Math.max(1, Math.min(6, Math.trunc(relay)));
  return {
    relay: normalized,
    label: normalized === 6 ? '終結 6 / 6' : `接力 ${normalized} / 6`,
    visualPower: normalized * 18,
    trailCount: normalized + 1,
    shakePx: normalized === 1 ? 0 : normalized * 1.5,
    finisher: normalized === 6,
  };
}

export function createCombatBeats(
  events: readonly GuildBattleEvent[],
  relay: number,
  reducedMotion = false,
): readonly CombatBeat[] {
  const normalizedRelay = relayPresentation(relay).relay;
  const visuals = projectVisualEvents(events, normalizedRelay, reducedMotion);
  return events.map((event, index) => {
    const kind = KIND_BY_EVENT[event.kind] ?? 'info';
    const visual = visuals[index]!;
    return {
      id: `${event.id}:${kind}`,
      kind,
      label: event.message,
      relay:
        event.kind === 'relay' && event.amount !== undefined
          ? relayPresentation(event.amount).relay
          : normalizedRelay,
      delayMs: reducedMotion ? 0 : Math.min(DELAY_BY_KIND[kind], visual.durationMs),
      eventKind: event.kind,
      visual,
      ...(event.actorId ? { actorId: event.actorId } : {}),
      ...(event.targetId ? { targetId: event.targetId } : {}),
      ...(event.amount !== undefined ? { amount: event.amount } : {}),
      ...(event.element ? { element: event.element } : {}),
    };
  });
}

export function advanceCombatPlayback(
  beats: readonly CombatBeat[],
  index: number,
): { index: number; complete: boolean } {
  if (beats.length === 0) return { index: 0, complete: true };
  const current = Math.max(0, Math.min(beats.length - 1, index));
  return current >= beats.length - 1
    ? { index: current, complete: true }
    : { index: current + 1, complete: false };
}
