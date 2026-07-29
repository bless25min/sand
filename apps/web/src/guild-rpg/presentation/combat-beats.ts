import type { BattleEventKind, GuildBattleEvent } from '@expedition/shared-types';

import { projectVisualEvents, type VisualEvent } from './visual-events';

type CombatBeatKind =
  | 'cast'
  | 'hit'
  | 'status'
  | 'chain'
  | 'relay'
  | 'defeat'
  | 'finisher'
  | 'support'
  | 'enemy'
  | 'total'
  | 'info';

export interface CombatBeat {
  id: string;
  sourceEventIds: readonly number[];
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
  comboIndex?: number;
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
  enemy_attack: 'enemy',
  dodge: 'enemy',
  healing: 'support',
  guard: 'enemy',
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
  boss_phase: 'finisher',
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
  enemy: 320,
  total: 220,
  info: 100,
};

const DECISIVE_EVENTS = new Set<BattleEventKind>([
  'unit_defeated',
  'overkill',
  'finisher',
  'victory',
]);

const SECONDARY_EVENTS = new Set<BattleEventKind>(['passive', 'strengthen', 'healing']);

const safeBeatLabel = (event: GuildBattleEvent, visual: VisualEvent) => {
  if (event.kind === 'overkill') return `OVERKILL +${Math.abs(event.amount ?? 0)}`;
  if (visual.number === undefined) return visual.headline;
  const sign = visual.number > 0 ? '+' : '';
  return `${visual.headline} ${sign}${visual.number}`;
};

const mergeSecondaryIntoDecisive = (beats: readonly CombatBeat[]): readonly CombatBeat[] => {
  const decisiveIndexes = beats
    .map(({ eventKind }, index) => (DECISIVE_EVENTS.has(eventKind) ? index : -1))
    .filter((index) => index >= 0);
  if (decisiveIndexes.length === 0) return beats;

  const mergedIds = new Map<number, number[]>();
  beats.forEach((beat, index) => {
    if (!SECONDARY_EVENTS.has(beat.eventKind)) return;
    const targetIndex = decisiveIndexes.reduce((best, candidate) => {
      const candidateDistance = Math.abs(candidate - index);
      const bestDistance = Math.abs(best - index);
      return candidateDistance <= bestDistance ? candidate : best;
    });
    mergedIds.set(targetIndex, [...(mergedIds.get(targetIndex) ?? []), ...beat.sourceEventIds]);
  });

  return beats
    .filter(({ eventKind }) => !SECONDARY_EVENTS.has(eventKind))
    .map((beat) => {
      const originalIndex = beats.indexOf(beat);
      const secondaryIds = mergedIds.get(originalIndex);
      return secondaryIds
        ? {
            ...beat,
            sourceEventIds: [...secondaryIds, ...beat.sourceEventIds].sort(
              (left, right) => left - right,
            ),
          }
        : beat;
    });
};

const appendDamageTotal = (
  beats: readonly CombatBeat[],
  reducedMotion: boolean,
): readonly CombatBeat[] => {
  const damageBeats = beats.filter(
    ({ eventKind, amount }) =>
      (eventKind === 'damage' || eventKind === 'reaction') && (amount ?? 0) > 0,
  );
  if (damageBeats.length < 2) return beats;
  const total = damageBeats.reduce((sum, { amount = 0 }) => sum + amount, 0);
  const last = damageBeats.at(-1)!;
  const lastIndex = beats.lastIndexOf(last);
  const sourceEventIds = damageBeats.flatMap(({ sourceEventIds }) => sourceEventIds);
  const totalBeat: CombatBeat = {
    id: `${sourceEventIds.join('+')}:total`,
    sourceEventIds,
    kind: 'total',
    label: `合計 ${total}`,
    relay: Math.max(...damageBeats.map(({ relay }) => relay)),
    delayMs: reducedMotion ? 0 : DELAY_BY_KIND.total,
    eventKind: 'damage',
    amount: total,
    visual: {
      ...last.visual,
      id: `${last.visual.id}:total`,
      phase: 'aftermath',
      headline: '合計',
      detail: `合計 ${total}`,
      route: 'none',
      camera: 'punch',
      durationMs: reducedMotion ? 0 : DELAY_BY_KIND.total,
      number: -total,
    },
    ...(last.actorId ? { actorId: last.actorId } : {}),
    ...(last.element ? { element: last.element } : {}),
  };
  return [...beats.slice(0, lastIndex + 1), totalBeat, ...beats.slice(lastIndex + 1)];
};

const capPlaybackDuration = (
  beats: readonly CombatBeat[],
  reducedMotion: boolean,
): readonly CombatBeat[] => {
  if (reducedMotion) return beats.map((beat) => ({ ...beat, delayMs: 0 }));
  const total = beats.reduce((sum, { delayMs }) => sum + delayMs, 0);
  if (total <= 2_000) return beats;
  const scale = 2_000 / total;
  return beats.map((beat) => ({
    ...beat,
    delayMs: Math.max(16, Math.floor(beat.delayMs * scale)),
  }));
};

export function relayPresentation(relay: number): RelayPresentation {
  const normalized = Math.max(1, Math.min(6, Math.trunc(relay)));
  return {
    relay: normalized,
    label: normalized === 6 ? '終結 6 / 6' : `接力 ${normalized} / 6`,
    visualPower: 14 + normalized * normalized * 5,
    trailCount: 1 + (normalized * (normalized + 1)) / 2,
    shakePx: normalized === 1 ? 0 : normalized * normalized * 0.45,
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
  const causalParents = new Map(
    events
      .filter(({ causalId }) => causalId !== undefined)
      .map((event) => [event.causalId!, event]),
  );
  const causalIdsWithChildren = new Set(
    events
      .map(({ parentCausalId }) => parentCausalId)
      .filter((causalId): causalId is string => causalId !== undefined),
  );
  const comboCounts = new Map<string, number>();
  const projected: {
    beat: CombatBeat;
    componentId?: string | undefined;
    isComboDamage: boolean;
  }[] = [];

  events.forEach((event, index) => {
    const isTriggerNarration = event.kind === 'triggered' || event.kind === 'core_triggered';
    if (isTriggerNarration && event.causalId && causalIdsWithChildren.has(event.causalId)) return;

    const parent = event.parentCausalId ? causalParents.get(event.parentCausalId) : undefined;
    const mergedTrigger =
      parent?.kind === 'triggered' || parent?.kind === 'core_triggered' ? parent : undefined;
    const isComboDamage = event.kind === 'damage' || event.kind === 'reaction';
    const comboIndex =
      isComboDamage && event.componentId
        ? (comboCounts.get(event.componentId) ?? 0) + 1
        : undefined;
    if (comboIndex !== undefined && event.componentId) {
      comboCounts.set(event.componentId, comboIndex);
    }
    const kind = mergedTrigger ? 'chain' : (KIND_BY_EVENT[event.kind] ?? 'info');
    const sourceEventIds = mergedTrigger ? [mergedTrigger.id, event.id] : [event.id];
    const baseVisual = visuals[index]!;
    const rawVisual =
      mergedTrigger && comboIndex !== undefined
        ? {
            ...baseVisual,
            headline: `追擊 ${comboIndex}`,
          }
        : baseVisual;
    const label = safeBeatLabel(event, rawVisual);
    const visual = { ...rawVisual, detail: label };
    projected.push({
      componentId: event.componentId,
      isComboDamage,
      beat: {
        id: `${sourceEventIds.join('+')}:${kind}`,
        sourceEventIds,
        kind,
        label,
        relay:
          event.causalDepth !== undefined
            ? relayPresentation(event.causalDepth).relay
            : event.kind === 'relay' && event.amount !== undefined
              ? relayPresentation(event.amount).relay
              : normalizedRelay,
        delayMs: reducedMotion ? 0 : Math.min(DELAY_BY_KIND[kind], visual.durationMs),
        eventKind: event.kind,
        visual,
        ...(comboIndex !== undefined ? { comboIndex } : {}),
        ...(event.actorId ? { actorId: event.actorId } : {}),
        ...(event.targetId ? { targetId: event.targetId } : {}),
        ...(event.amount !== undefined ? { amount: event.amount } : {}),
        ...(event.element ? { element: event.element } : {}),
      },
    });
  });

  const timed = projected.map(({ beat, componentId, isComboDamage }, index) => {
    if (reducedMotion || !isComboDamage || !componentId) return beat;
    const hasLaterSegment = projected
      .slice(index + 1)
      .some((entry) => entry.isComboDamage && entry.componentId === componentId);
    return {
      ...beat,
      delayMs: hasLaterSegment ? Math.max(beat.delayMs, beat.visual.durationMs) : 170,
    };
  });
  return capPlaybackDuration(
    appendDamageTotal(mergeSecondaryIntoDecisive(timed), reducedMotion),
    reducedMotion,
  );
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
