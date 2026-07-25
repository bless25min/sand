import type { ComboEvent } from '@expedition/shared-types';

export type SensationCueId =
  | 'stack'
  | 'trigger'
  | 'block'
  | 'break'
  | 'hit'
  | 'kill'
  | 'overkill'
  | 'boss-execution'
  | 'annihilation'
  | 'loot'
  | 'rule-online';

export interface CueProjectionInput {
  events: readonly ComboEvent[];
  lootRevealed?: boolean;
  ruleOnline?: boolean;
}

interface SensationCueSnapshot {
  sessionId: string;
  screen: 'guild' | 'battle' | 'playback' | 'rewards';
  visibleEvents: readonly ComboEvent[];
  activatedRuleIds: readonly string[];
}

export interface SensationCueTracker {
  next(snapshot: SensationCueSnapshot): readonly SensationCueId[];
}

function eventCues(event: ComboEvent): readonly SensationCueId[] {
  if (event.kind === 'card_played') return ['stack'];
  if (event.kind === 'rule_triggered') return ['trigger'];
  if (event.kind === 'shield') return ['block'];
  if (event.kind === 'damage') return ['hit'];
  if (event.kind === 'unit_defeated') return ['break', 'kill'];
  if (event.kind === 'boss_phase') return ['boss-execution'];
  if (event.kind === 'overkill' || event.kind === 'infinite_engine') return ['overkill'];
  if (event.kind === 'victory') return ['annihilation'];
  return [];
}

export function projectSensationCues(input: CueProjectionInput): readonly SensationCueId[] {
  const cues: SensationCueId[] = [];
  const seen = new Set<SensationCueId>();
  const append = (cue: SensationCueId) => {
    if (seen.has(cue)) return;
    seen.add(cue);
    cues.push(cue);
  };

  for (const event of input.events) {
    for (const cue of eventCues(event)) append(cue);
  }
  if (input.lootRevealed) append('loot');
  if (input.ruleOnline) append('rule-online');
  return cues;
}

export function createSensationCueTracker(): SensationCueTracker {
  let sessionId: string | undefined;
  let previousScreen: SensationCueSnapshot['screen'] | undefined;
  let seenEventIds = new Set<number>();
  let seenRuleIds = new Set<string>();

  return {
    next(snapshot) {
      if (snapshot.sessionId !== sessionId) {
        sessionId = snapshot.sessionId;
        previousScreen = undefined;
        seenEventIds = new Set();
        seenRuleIds = new Set();
      }
      const events = snapshot.visibleEvents.filter((event) => {
        if (seenEventIds.has(event.id)) return false;
        seenEventIds.add(event.id);
        return true;
      });
      const ruleOnline = snapshot.activatedRuleIds.some((ruleId) => {
        if (seenRuleIds.has(ruleId)) return false;
        seenRuleIds.add(ruleId);
        return true;
      });
      const lootRevealed = snapshot.screen === 'rewards' && previousScreen !== 'rewards';
      previousScreen = snapshot.screen;
      return projectSensationCues({ events, lootRevealed, ruleOnline });
    },
  };
}
